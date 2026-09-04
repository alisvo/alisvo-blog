---
title: "Postgresql Restore Command Reference"
description: "PostgreSQL Restore Commands Reference This guide covers the three primary methods to restore PostgreSQL data: using psql for plain‐text dumps, pg_restore..."
pubDate: 2025-07-14
tags: ["Backup & DR", "PostgreSQL", "Restore"]
featured: false
readingTime: "1 dk okuma"
---

# PostgreSQL Restore Commands Reference

This guide covers the three primary methods to restore PostgreSQL data: using `psql` for plain‐text dumps, `pg_restore` for archive-format dumps, and `pg_dumpall` for full-cluster plain‐text restores. Copy & paste these one-liner commands into your shell and adjust connection or file paths as needed.

## 1\. Restore Plain‐Text Dump with `psql`

**Basic command:**

```bash
psql -U <user> -h <host> -p <port> -d <target_db> -f <dumpfile.sql>
```

 

  * `-d <target_db>`: database to restore into.
  * `-f <dumpfile.sql>`: path to the SQL dump.
  * `-1` (optional): wrap in a single transaction to abort on first error.

## 2\. Restore Archive‐Format Dump with `pg_restore`

**Basic command:**

```bash
pg_restore -U <user> -h <host> -p <port> -d <target_db> <archive-file>
```

 

  * `-Fc` / `-Fd` / `-Ft`: custom, directory, or tar formats (auto-detected).
  * `-C` (optional): include `CREATE DATABASE` in the restore script.
  * `-c` / `--clean`: drop existing objects before recreating them.
  * `-j <n>`: run parallel restore jobs (only for custom or directory formats).
  * `-O` / `--no-owner`: skip setting original object owners.
  * `-e` / `--exit-on-error`: stop on first error.

**Example: drop & recreate DB then restore:**

```bash
dropdb edbstore
pg_restore -U postgres -C -d postgres edbstore_full_fc.dmp
```

 

## 4\. Additional Options & Best Practices

  * **\--single-transaction** (`psql -1`): wrap restores in one transaction to ensure all-or-nothing.
  * **\--no-owner** (`pg_restore -O`): useful if you can’t connect as the original owner.
  * **\--exit-on-error** (`pg_restore -e`, `psql --set ON_ERROR_STOP=on`): halt on first failure.
  * **Parallel restores** (`pg_restore -j`): speeds up large restores on multi-CPU machines.
  * Always restore new databases from `template0` to avoid unwanted template1 objects.
  * After restore, run `ANALYZE` on large tables to update planner statistics.
