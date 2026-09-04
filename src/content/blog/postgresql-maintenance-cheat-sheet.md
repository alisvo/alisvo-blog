---
title: "PostgreSQL Maintenance Cheat Sheet"
description: "PostgreSQL DBA'leri için VACUUM, ANALYZE, REINDEX ve tablo şişmesi (bloat) yönetimini içeren hızlı başvuru rehberi."
pubDate: 2025-07-14
tags: ["PostgreSQL", "Reindex", "Vacuum"]
featured: false
readingTime: "1 dk okuma"
---

# PostgreSQL Maintenance Commands Cheat Sheet

## VACUUM

Frees space from dead tuples and makes pages reusable without locking out writers.

```sql
-- vacuum a single table
VACUUM store.customers;

-- vacuum all tables in the current database
VACUUM;
```

## VACUUM FULL

Fully rewrites a table to compact it and return space to the OS (locks the table).

```sql
-- reclaim disk space on a large table
VACUUM FULL store.orders;
```

## ANALYZE

Collects statistics on column distributions for the planner to choose optimal plans.

```sql
-- update stats for specific tables
ANALYZE store.emp;
ANALYZE store.dept;

-- analyze entire database
ANALYZE;
```

## REINDEX

Rebuilds an index to remove fragmentation and bloat.

```sql
-- rebuild a single index
REINDEX INDEX store.ix_orderlines_orderid;

-- rebuild all indexes on a table
REINDEX TABLE store.orderlines;
```

## Best Practices

  * Enable `autovacuum` to run `VACUUM` & `ANALYZE` automatically.
  * Use `VACUUM FULL` sparingly during low-traffic windows.
  * Monitor bloat via `pg_stat_user_tables` and `pg_stat_user_indexes`.
  * Schedule `REINDEX` after bulk loads or heavy DELETE cycles.
