---
title: "PostgreSQL'de EXPLAIN ANALYZE ile Sorgu Optimizasyonu ve Index Stratejileri"
description: "Yavaş çalışan SQL sorgularını analiz etme, execution planları doğru okuma, Shared Buffers maliyetleri ve modern PostgreSQL index mimarileri üzerine kapsamlı DBA rehberi."
pubDate: 2026-08-20
updatedDate: 2026-08-25
tags: ["PostgreSQL", "Performance Tuning", "SQL", "Indexing", "DBA"]
featured: true
readingTime: "10 dk okuma"
---

Bir Veritabanı Yöneticisi (DBA) veya backend mühendisi olarak karşılaştığımız en kritik görevlerden biri, üretim ortamında CPU'yu %100'e vurduran veya bağlantı havuzunu (connection pool) tüketen yavaş sorguları tespit edip optimize etmektir. 

Çoğu zaman çözüm aceleyle rastgele indeksler oluşturmak gibi görünse de, bu durum **yazma maliyetini (write amplification)** artırır, **HOT (Heap-Only Tuple)** güncellemelerini bozar ve `VACUUM` süreçlerini hantallaştırır.

Bu makalede, PostgreSQL'in sorgu planlayıcısını (Planner/Optimizer) nasıl anlayacağımızı, `EXPLAIN ANALYZE` çıktısını doğru okumayı ve doğru index stratejilerini adım adım inceleyeceğiz.

---

## 1. EXPLAIN vs EXPLAIN ANALYZE: Temel Fark

`EXPLAIN` tek başına çalıştırıldığında sorguyu **çalıştırmaz**, yalnızca istatistiklere (`pg_statistic`) dayanarak tahmin edilen bir maliyet (Cost) hesaplar:

```sql
-- Yalnızca tahmin üretir (sorgu çalıştırılmaz)
EXPLAIN 
SELECT id, customer_id, total_amount, created_at
FROM orders 
WHERE status = 'COMPLETED' AND created_at >= '2026-01-01';
```

Gerçek darboğazı görmek için sorgunun fiziksel olarak çalıştırıldığı ve çalışma zamanı metriklerinin toplandığı `ANALYZE` parametresini eklemeliyiz. Ayrıca mutlaka bellek okumalarını görmek için `BUFFERS` parametresini dahil etmeliyiz:

```sql
EXPLAIN (ANALYZE, BUFFERS, COSTS, TIMING, VERBOSE)
SELECT id, customer_id, total_amount, created_at
FROM orders 
WHERE status = 'COMPLETED' AND created_at >= '2026-01-01';
```

> **Dikkat:** `EXPLAIN ANALYZE` sorguyu **gerçekten çalıştırır**! `UPDATE`, `DELETE` veya `INSERT` sorgularında çalıştırırken verilerinizin etkileneceğini unutmayın; test amacıyla bir `BEGIN; ... ROLLBACK;` bloğu içinde çalıştırabilirsiniz.

---

## 2. Execution Plan Çıktısını Çözümleme

Aşağıda 12 milyon satırlık bir `orders` tablosunda çalıştırılan tipik bir problem sorgusu ve planı yer almaktadır:

```sql
-- Problem Sorgusu:
EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, SUM(total_amount)
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY customer_id
ORDER BY SUM(total_amount) DESC
LIMIT 10;
```

**Alınan Execution Plan Çıktısı:**

```text
Limit  (cost=184520.12..184520.15 rows=10 width=40) (actual time=1420.312..1420.315 rows=10 loops=1)
  Buffers: shared hit=4210 read=98240
  ->  Sort  (cost=184520.12..185140.22 rows=248040 width=40) (actual time=1420.310..1420.312 rows=10 loops=1)
        Sort Key: (sum(total_amount)) DESC
        Sort Method: top-N heapsort  Memory: 26kB
        ->  HashAggregate  (cost=165240.00..172680.00 rows=248040 width=40) (actual time=1280.145..1385.200 rows=184200 loops=1)
              Group Key: customer_id
              Batches: 1  Memory Usage: 24593kB
              ->  Seq Scan on orders  (cost=0.00..152400.00 rows=1284000 width=16) (actual time=0.082..980.450 rows=1310500 loops=1)
                    Filter: (created_at >= (now() - '30 days'::interval))
                    Rows Removed by Filter: 10689500
                    Buffers: shared hit=4210 read=98240
Planning Time: 0.185 ms
Execution Time: 1422.450 ms
```

### Bu Planda Neler Oluyor?
1. **`Seq Scan on orders`**: PostgreSQL 12 milyon satırın tamamını diskten/bellekten tek tek okumuş (`10,689,500` satır filtrede elenmiş).
2. **`Buffers: shared hit=4210 read=98240`**: 
   - `shared hit`: PostgreSQL buffer cache'ten (RAM) okunan 8KB'lık blok sayısı (~32 MB).
   - `shared read`: Diskten okunan 8KB'lık blok sayısı (~767 MB!). Sorgunun 1.4 saniye sürmesinin temel sebebi bu disk G/Ç (I/O) yüküdür.
3. **`actual rows=10` vs `rows=10`**: Planlayıcının istatistikleri oldukça tutarlı (`ANALYZE orders` güncel).

---

## 3. PostgreSQL İndeks Çeşitleri ve Doğru Strateji

### A. B-Tree: İş Atı ve Çoklu Kolon (Composite) İndeksler

En yaygın indeks tipi B-Tree'dir (`=, <, <=, >, >=, BETWEEN, IN` işlemleri için).

Yukarıdaki sorgumuz için doğrudan `created_at` üzerinde indeks oluşturursak:

```sql
-- Yalnızca created_at indeksi
CREATE INDEX CONCURRENTLY idx_orders_created_at 
ON orders (created_at);
```

> **DBA Notu:** Canlı (production) sistemde indeks oluştururken her zaman `CONCURRENTLY` anahtar kelimesini kullanın. Aksi takdirde tablo üzerinde `SHARE` kilidi oluşur ve `INSERT`/`UPDATE` işlemleri kilitlenir.

Eğer sorgumuzda `customer_id` ve `total_amount` da varsa, **Covering Index (INCLUDE)** yaklaşımını düşünebiliriz:

```sql
CREATE INDEX CONCURRENTLY idx_orders_created_covering
ON orders (created_at)
INCLUDE (customer_id, total_amount);
```

Bu sayede PostgreSQL tablo sayfalarına (Heap) hiç gitmeden doğrudan index üzerinden aradığını bulur: **`Index Only Scan`**.

```text
->  Index Only Scan using idx_orders_created_covering on orders
      Index Cond: (created_at >= (now() - '30 days'::interval))
      Heap Fetches: 0
      Buffers: shared hit=1420 read=0
Execution Time: 42.120 ms
```
*Sorgu süresi 1422 ms'den 42 ms'ye düştü! (33 kat hızlanma).*

---

### B. BRIN (Block Range Index): Devasa Zaman Serisi Tabloları İçin

Eğer tablonuz yüz milyonlarca satırdan oluşuyorsa ve `created_at` sırayla artan (monotonic append-only) bir yapıdaysa, normal B-Tree indeksi gigabaytlarca RAM tüketebilir.

**BRIN**, her 128 disk sayfasının (Block Range) minimum ve maksimum değerini tutar. Boyutu B-Tree'nin %1'inden bile küçüktür:

```sql
-- 50 GB'lık tablo için B-tree index 8 GB tutarken, BRIN index 10-20 MB tutar!
CREATE INDEX idx_orders_created_at_brin 
ON orders USING BRIN (created_at) 
WITH (pages_per_range = 64);
```

---

### C. Kısmi İndeksler (Partial Indexes)

Sisteminizdeki kayıtların %95'i `status = 'ARCHIVED'` veya `status = 'COMPLETED'` ise ve siz sürekli işlenmeyi bekleyen kayıtları sorguluyorsanız:

```sql
-- Kötü: Tüm tabloyu indeksler
CREATE INDEX idx_orders_status ON orders (status);

-- Mükemmel (Partial Index): Sadece aktif iş kuyruğunu indeksler (Çok küçük ve ultra hızlı)
CREATE INDEX idx_orders_pending_queue 
ON orders (created_at) 
WHERE status = 'PENDING';
```

Bu indeks tablonun sadece %1'ini kaplar, bellekten düşmez ve `status = 'PENDING'` filtreli sorguları anında yanıtlar.

---

## 4. Pratik DBA Kontrol Listesi (Checklist)

1. **Gereksiz İndeksleri Temizleyin:**
   Kullanılmayan indeksler her `INSERT/UPDATE/DELETE` işleminde diske boşuna yazma maliyeti üretir.
   ```sql
   SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0 AND indisunique IS FALSE
   ORDER BY pg_relation_size(indexrelid) DESC;
   ```
2. **Tablo ve İndeks Bloat (Şişme) Kontrolü:**
   `VACUUM FULL` yerine sıfır kesintiyle indeksleri yeniden oluşturmak için:
   ```sql
   REINDEX TABLE CONCURRENTLY orders;
   ```
3. **`work_mem` Ayarı:**
   Eğer planda `Sort Method: external merge Disk` görüyorsanız, sıralama belleği yetmediği için geçici dosyalar diske yazılıyordur. Oturum bazlı olarak `work_mem` artırılabilir:
   ```sql
   SET work_mem = '64MB';
   ```

---

## Sonuç

PostgreSQL'de performans ayarlamak bir sihir değil; disk I/O, bellek kullanımı ve doğru veri yapıları arasındaki dengeyi yönetme sanatıdır. Sorgularınızı optimize ederken mutlaka `BUFFERS` çıktısına dikkat edin: **En hızlı sorgu, en az disk bloğu okuyan sorgudur.**
