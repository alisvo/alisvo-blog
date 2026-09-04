---
title: "Some Postgresql Backup Commands Reference"
description: "1. Schema-Only Dump (Store Schema) Command: ___CODE_BLOCK_0___ --schema-only : Dumps only the database structure (DDL). --schema=store : Limits the dump to..."
pubDate: 2025-07-14
tags: ["Backup & DR", "PostgreSQL"]
featured: false
readingTime: "1 dk okuma"
---

## 1\. Schema-Only Dump (Store Schema)

Command:

```bash
pg_dump --schema-only --schema=store edbstore > store_schema.sql
```

 

  * `--schema-only`: Dumps only the database structure (DDL).
  * `--schema=store`: Limits the dump to the `store` schema.
  * Redirects output to `store_schema.sql`.

## 2\. Data-Only Dump (Triggers Disabled + INSERTs)

Command:

```bash
pg_dump --data-only --disable-triggers --inserts edbstore > edbstore_data.sql
```

 

  * `--data-only`: Dumps only data (INSERT statements).
  * `--disable-triggers`: Disables all triggers during data load.
  * `--inserts`: Uses `INSERT` statements instead of `COPY`.
  * Redirects output to `edbstore_data.sql`.

## 3\. Table-Specific Full Dump (Customers Table)

Command:

```bash
pg_dump --table=edbuser.customers edbstore > edbstore_customers.sql
```

 

  * `--table=edbuser.customers`: Dumps only the `customers` table (DDL + data).
  * Redirects output to `edbstore_customers.sql`.

## 4\. Full Database Dump (Custom Format, Compressed)

Command:

```bash
pg_dump -Fc -f edbstore_full_fc.dmp edbstore
```

 

  * `-Fc`: Selects the custom archive format (compressed).
  * `-f`: Specifies the output file.
  * Backup file: `edbstore_full_fc.dmp`.
  * Restore with: `pg_restore -d targetdb edbstore_full_fc.dmp`.

## 5\. Full Cluster Dump (Plain-Text SQL)

Command:

```text
pg_dumpall -f edbdata.sql
```

 

  * Dumps all databases, roles, tablespaces, and grants.
  * Output file: `edbdata.sql` (plain-text).
  * Optionally compress with: `pg_dumpall | gzip > edbdata.sql.gz`.
  * Restore with: `psql -f edbdata.sql`.
