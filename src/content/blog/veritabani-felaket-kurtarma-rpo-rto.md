---
title: "Veritabanı Felaket Kurtarma (Disaster Recovery): RPO ve RTO Prensipleri"
description: "Veri kaybına tahammülü olmayan kurumsal sistemlerde RPO ve RTO matematiği, PITR, WAL arşivleme, senkron replikasyon ve test edilmiş felaket kurtarma senaryoları."
pubDate: 2026-08-28
updatedDate: 2026-09-01
tags: ["Disaster Recovery", "High Availability", "PostgreSQL", "Backup", "Architecture"]
featured: true
readingTime: "8 dk okuma"
---

Bir Veritabanı Yöneticisi için en korkutucu an, telefonun gecenin 03:00'ünde çalması ve ana veri merkezindeki depolama biriminin (SAN) veya sunucuların tamamen çöktüğünün bildirilmesidir.

Böyle bir kriz anında sizi ve kurumunuzu kurtaracak olan şey mucizeler değil; aylar öncesinden matematiksel olarak tanımlanmış, mimarisi kurulmuş ve **düzenli olarak tatbikatı yapılmış bir Felaket Kurtarma (Disaster Recovery - DR)** planıdır.

Bu yazıda, felaket kurtarma stratejisinin temel taşları olan **RPO** ve **RTO** kavramlarını ve bunların veritabanı dünyasındaki teknik karşılıklarını inceliyoruz.

---

## 1. RPO ve RTO Nedir?

```text
ZAMAN AKIŞI  ───────────────────────────────────────────────────────────────────────────►

[ Son Kurtarılabilir Veri ] ───────► [  FELAKET ANI  ] ───────► [ Sistem Yeniden Ayakta ]
             ▲                               ▲                               ▲
             │                               │                               │
             └───────────────┬───────────────┘                               │
                            RPO                                              │
               (Maksimum Veri Kaybı Süresi)                                  │
                                             └───────────────┬───────────────┘
                                                            RTO
                                                 (Sistemin Kesinti Süresi)
```

### RPO (Recovery Point Objective - Hedeflenen Kurtarma Noktası)
- **Soru:** *"Ne kadar veri kaybına tahammül edebiliriz?"*
- **Açıklama:** Felaket anından geriye doğru ne kadarlık bir işlemin kaybolmasının tolere edilebileceğini belirten zamandır.
- **Örnek:** RPO = 0 demek, hiçbir commit edilmiş işlemin kaybedilmemesi demektir. RPO = 1 saat ise, felaket anında son 1 saatteki kayıtların kaybolmasının kabul edildiği anlamına gelir.

### RTO (Recovery Time Objective - Hedeflenen Kurtarma Süresi)
- **Soru:** *"Sistemi ne kadar sürede yeniden çalışır hale getirebiliriz?"*
- **Açıklama:** Felaketin gerçekleştiği an ile sistemin tekrar kullanıcılara hizmet vermeye başladığı an arasındaki izin verilen maksimum kesinti süresidir.
- **Örnek:** RTO = 15 dakika ise, yedek veri merkezinin devreye girmesi, DNS yönlendirmesi ve uygulamanın ayağa kalkması en geç 15 dakika içinde tamamlanmalıdır.

> **Kritik Kural:** RPO ve RTO hedefleri küçüldükçe (sıfıra yaklaştıkça), altyapı maliyeti ve mimari karmaşıklık logaritmik olarak artar.

---

## 2. RPO = 0 Mümkün mü? Senkron vs Asenkron Replikasyon

Veritabanlarında RPO hedefini belirleyen ana unsur replikasyon türüdür:

```sql
-- postgresql.conf örneği
synchronous_commit = on          -- Yerel diske yazıldıktan sonra onay
-- veya
synchronous_commit = remote_apply -- Standby sunucuda belleğe ve diske uygulandıktan sonra onay (RPO = 0)
```

| Replikasyon Türü | RPO Seviyesi | Ağ Gecikmesi (Latency) Etkisi | Risk |
| :--- | :--- | :--- | :--- |
| **Asenkron Replikasyon** | RPO > 0 (Birkaç saniye/dakika) | Minimum etki, yüksek yazma verimi | Ağ koptuğunda standby'a aktarılmamış WAL kayıtları kaybolur. |
| **Senkron Replikasyon** | RPO = 0 (Sıfır veri kaybı) | Her commit işleminde ağ RTT (Round-Trip) gecikmesi eklenir | Standby erişilemez olursa ana sunucu yazma isteklerini bekletebilir (quorum ayarı gerektirir). |

Eğer bankacılık veya ödeme sistemleri gibi RPO=0 gerektiren bir altyapı yönetiyorsanız, **Quorum-based Synchronous Replication** (örneğin 3 düğümden en az 2'sinin onayı) tercih edilmelidir:

```ini
synchronous_standby_names = 'FIRST 1 (standby_node1, standby_node2)'
```

---

## 3. Continuous Archiving ve PITR (Point-in-Time Recovery)

Sadece her gece 01:00'de alınan bir `pg_dump` veya soğuk disk yedeği bir felaket kurtarma planı **değildir**. Gün ortası saat 14:30'da bir junior geliştirici canlı tabloda `WHERE` koşulu olmadan `DELETE` çalıştırdığında ne yapacaksınız?

İşte bu noktada **PITR** devreye girer:

1. **Fiziksel Taban Yedeği (Base Backup):** `pg_basebackup` ile haftalık/günlük alınan snapshot.
2. **Sürekli WAL Arşivleme (Continuous WAL Archiving):** Üretilen her 16MB'lık Write-Ahead Log dosyasının anında güvenli bir nesne depolama alanına (S3/MinIO/NFS) gönderilmesi:

```bash

# postgresql.conf
archive_mode = on
archive_command = 'pgbackrest --stanza=db_prod archive-push %p'
```

3. **Kurtarma Anı (Recovery Target Time):**
Felaket 14:30:00'da gerçekleştiyse, veritabanını felaketten tam 1 saniye öncesine geri döndürebilirsiniz:

```ini

# recovery.signal veya patroni recovery config
restore_command = 'pgbackrest --stanza=db_prod archive-get %p %f'
recovery_target_time = '2026-09-04 14:29:59+03'
recovery_target_action = 'promote'
```

Bu strateji sayesinde RPO saniyeler seviyesine inerken, veri güvenliği garanti altına alınır.

---

## 4. RTO'yu Düşürmek: Otomatik Failover (Patroni & Raft/Consul)

Birincil (Master/Primary) veritabanı çöktüğünde DBA'in manuel olarak terminale bağlanıp bir standby'ı `promote` etmesini beklemek RTO'yu dakikalarca hatta saatlerce uzatır.

Modern yüksek erişilebilirlik (HA) mimarilerinde **Patroni** ve **DCS (Distributed Consensus Store: etcd)** kullanılır:

```text
[ Uygulama / Client ]
                 |
                 v
        [ PgBouncer / HAProxy ]
                 |
        +--------+--------+
        |                 |
        v                 v
  +-----------+     +-----------+
  | PostgreSQL|     | PostgreSQL|
  | (Leader)  |     | (Replica) |
  +-----------+     +-----------+
        ^                 ^
        |     [ etcd ]    |
        +--- Consensus ---+
```

- Patroni, lider sunucunun nabzını (heartbeat) her 2-5 saniyede bir etcd üzerinden kontrol eder.
- Lider yanıt vermezse, en güncel WAL LSN (Log Sequence Number) bilgisine sahip olan Replica otomatik olarak yeni Leader seçilir.
- **RTO Sonucu:** Kesinti süresi 10-20 saniyeye düşer!

---

## 5. Altın Kural: "Test Edilmemiş Yedek, Yedek Değildir"

Gördüğüm felaket senaryolarının çoğunda en acı gerçek şudur: Şirket yıllardır yedek alıyordur, ancak o yedekten asla geri dönmeyi (restore) test etmemiştir. Felaket günü yedek arşivinin bozuk olduğu veya şifreleme anahtarının kaybolduğu ortaya çıkar.

### DBA Felaket Kurtarma Kontrol Listesi (Checklist):
- [ ] **Otomatik Restore Testleri:** Haftada en az bir kez son alınan yedek izole bir test sunucusuna otomatik olarak restore edilip bütünlük testi (`pg_amcheck`) çalıştırılmalıdır.
- [ ] **Ayrı Coğrafi Bölge:** DR kopyaları mutlaka ana veri merkezinden farklı bir coğrafi lokasyonda bulunmalıdır.
- [ ] **Yazılı Runbook:** Felaket anında kimin hangi adımı atacağını açıklayan açık, test edilmiş bir acil durum dökümanı (Runbook) olmalıdır.
- [ ] **Yıllık DR Tatbikatı:** Yılda en az iki kez kontrollü olarak ana sistem kapatılmalı ve iş birimleriyle DR merkezine geçiş tatbikatı yapılmalıdır.

---

## Özet

Veritabanı yöneticiliği yalnızca tabloları ve sorguları yönetmek değil, **kurumun en değerli varlığı olan verinin sürekliliğini teminat altına almaktır**. RPO ve RTO hedeflerinizi net belirleyin, yedeklerinizi düzenli olarak test edin ve kriz gelmeden önce altyapınızı hazırlayın.
