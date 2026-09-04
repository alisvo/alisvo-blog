---
title: "Postgresql Data Dictionaries & Functions"
description: "PostgreSQL 16 Data Dictionary & Catalog Cheat-Sheet PostgreSQL ships with a rich “data dictionary” — a collection of catalog tables , views and utility..."
pubDate: 2025-05-09
tags: ["Configuration", "PostgreSQL"]
featured: false
readingTime: "2 dk okuma"
---

## PostgreSQL 16 Data Dictionary & Catalog Cheat-Sheet

PostgreSQL ships with a rich “data dictionary” — a collection of _catalog tables_ , _views_ and _utility functions_ stored in the builtin `pg_catalog` schema. They let you inspect almost every aspect of a running cluster without touching the on-disk files. All catalog names in this guide are **lower-case** and live in `pg_catalog` unless noted otherwise.

### 1 · The `pg_catalog` schema

  * Automatically created for every database
  * Always implicitly included at the front of `search_path`
  * Contains: system **tables** (e.g. `pg_class`), builtin **functions** (e.g. `pg_database_size()`), and handy **views** (e.g. `pg_stat_activity`)

### 2 · High-Value Catalog Tables

Table| What you get
---|---
`pg_tables` view| All user tables visible in current database
`pg_indexes` view| Index list plus definition (handy for DDL generators)
`pg_constraints`| CHECK, PK, FK & UNIQUE definitions
`pg_trigger`| All triggers & their firing rules
`pg_file_settings` view| Parsed contents of `postgresql.conf`/`include` files

### 3 · Server-Wide Insight — `pg_stat_*` views

View| Purpose / Typical use-case
---|---
`pg_stat_activity`| Current sessions, running queries & wait events (great for live troubleshooting)
`pg_stat_database`| Per-DB commits, rollbacks, tuples read/changed, deadlocks, temp files
`pg_stat_user_tables`| Seq scans vs. index scans, vacuum/analyze stats per table
`pg_stat_progress_vacuum`| Live progress of long-running VACUUM jobs
`pg_stat_archiver`| WAL archiving success/failure counters

### 4 · Key System Functions

Function| Return value
---|---
`current_database()`| Name of active database
`pg_postmaster_start_time()`| Server start timestamp — uptime calculator
`pg_size_pretty(pg_database_size('db'))`| Human-readable database size
`pg_conf_load_time()`| When `postgresql.conf` was last reloaded
`pg_current_logfile()`| Absolute path of the active server log
`pg_blocking_pids(pid)`| Array of PIDs currently blocking pid

### 5 · Essential Admin Helpers

Function| Why you care
---|---
`current_setting('name')`, `set_config()`| Read/modify GUCs without editing files
`pg_reload_conf()`| SIGHUP equivalent — rereads config without restart
`pg_cancel_backend(pid)`| Abort _query_ running in backend pid
`pg_terminate_backend(pid)`| Terminate entire backend connection
`pg_rotate_logfile()`| Force log-rotation immediately (e.g. before log shipping)

### 6 · Quick Usage Patterns

```sql
-- List every bloat-suspect table (>20 % dead tuples)
SELECT relname, n_dead_tup, n_live_tup
FROM   pg_stat_user_tables
WHERE  n_dead_tup > n_live_tup * 0.20
ORDER  BY n_dead_tup DESC;

-- Who is blocking whom?
SELECT a.pid blocker, a.query block_q,
       b.pid waiting, b.query wait_q
FROM   pg_stat_activity a
JOIN   pg_stat_activity b
  ON   b.wait_event_type = 'Lock'
 AND   pg_blocking_pids(b.pid) @> ARRAY[a.pid];
```

### 7 · Self-Inspection of Build Parameters

Need to know if your binaries were compiled with checksums or which WAL segment size they use? Query the preset _read-only_ GUCs:

```sql
SELECT name, setting
FROM   pg_settings
WHERE  name IN ('block_size','wal_segment_size','data_checksums');
```

### 8 · Expanding `postgresql.conf` with `include`

Add this once and keep separate per-topic files under `/etc/pg16/conf.d/`:

```text

# postgresql.conf
include_dir 'conf.d'
```

### 9 · Safety Tips

  * Stick to `pg_catalog` views whenever possible (future-proof, version-safe).
  * `SET search_path TO ''` before running maintenance scripts to avoid name clashes.
  * Grant SELECT on catalog views to read-only roles instead of superuser access.

* * *

_Happy catalog hacking!_
