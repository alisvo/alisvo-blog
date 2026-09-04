---
title: "Postgresql Config File Parameters"
description: "PostgreSQL 16 Server Configuration & Tuning Cheatsheet 1 · Parameter Fundamentals Case-insensitive names. Value types: boolean · integer · float · string ·..."
pubDate: 2025-05-09
tags: ["Config", "PostgreSQL"]
featured: false
readingTime: "3 dk okuma"
---

# PostgreSQL 16  
Server Configuration & Tuning Cheatsheet

* * *

## 1 · Parameter Fundamentals

  * **Case-insensitive** names.
  * Value types: boolean · integer · float · string · enum.
  * Precedence: `SET` (in-session) → `ALTER SYSTEM` (_postgresql.auto.conf_) → _postgresql.conf_ → internal defaults.

* * *

## 2 · Inspecting & Changing Parameters

Scope| Command| Effect  
---|---|---  
Session| `SET work_mem = '64MB';`| Lasts until disconnect or `RESET`.  
Database| `ALTER DATABASE mydb SET work_mem = '128MB';`| For every new session in _mydb_.  
Role| `ALTER ROLE analytics SET work_mem = '256MB';`| Overrides DB setting for that user.  
Cluster-wide| `ALTER SYSTEM SET work_mem = '512MB';`| Stored in _postgresql.auto.conf_.  
Reload| `SELECT pg_reload_conf();`| No downtime for most GUCs.  
  
* * *

## 3 · Core Categories & Quick Rules

### 3.1 Connection

GUC| Default| Note  
---|---|---  
`listen_addresses`| *| Bind address list.  
`port`| 5432| Postgres TCP port.  
`max_connections`| 100| Back-ends allowed.  
`superuser_reserved_connections`| 3| Always free for superuser.  
  
### 3.2 Security / SSL

  * `password_encryption` → keep `scram-sha-256`.
  * `ssl = on` plus `ssl_cert_file`, `ssl_key_file`, `ssl_ca_file`.

### 3.3 Memory

GUC| Scope| Thumb-rule  
---|---|---  
`shared_buffers`| Cluster| ~25–30 % RAM (dedicated).  
`work_mem`| Session| (RAM × 0.01) / active sorts.  
`maintenance_work_mem`| Session| 5-10 % RAM.  
  
* * *

## 4 · Query Planner & Parallelism

### 4.1 Cost Constants

  * `random_page_cost` (4 → often _1.1-1.5_ on SSD).
  * `seq_page_cost` (1).
  * `effective_cache_size` ≈ OS file-system cache (e.g. 75 % RAM).

### 4.2 Parallel Query

GUC| Default| Description  
---|---|---  
`max_parallel_workers_per_gather`| 2| Workers per _Gather_ node.  
`parallel_setup_cost`| 1000| Planner cost to launch workers.  
`min_parallel_table_scan_size`| 8 MB| Minimum table size for parallel seq-scan.  
  
### 4.3 Parallel Maintenance

`max_parallel_maintenance_workers` (default 2) speeds up `CREATE INDEX` on large b-trees.

* * *

## 5 · Background Writer & Checkpointer

  * `bgwriter_delay` (200 ms) → lower to smooth I/O spikes.
  * `bgwriter_lru_maxpages` (100) & `bgwriter_lru_multiplier` (2.0) control pages flushed.

* * *

## 6 · Vacuum / Autovacuum

### 6.1 Cost-Based Delay

GUC| Default| Meaning  
---|---|---  
`vacuum_cost_delay`| 0 ms| Sleep period once cost limit reached.  
`vacuum_cost_limit`| 200| Threshold before delay.  
  
### 6.2 Autovacuum Workers

  * `autovacuum` (on) — don’t disable in production.
  * `autovacuum_max_workers` (3) & `autovacuum_work_mem`.
  * Log long jobs with `log_autovacuum_min_duration`.

* * *

## 7 · Logging

### 7.1 Where to Log

  * `log_destination` → `stderr`, `csvlog`, `jsonlog`, `syslog`, `eventlog`.
  * `logging_collector = on` to redirect _stderr_ to files.
  * File rotation: `log_directory`, `log_filename`, `log_rotation_age`, `log_rotation_size`.

### 7.2 When / Sampling

GUC| Use  
---|---  
`log_min_messages`| Cluster severity floor.  
`log_min_duration_statement`| Log slow queries (ms).  
`log_statement_sample_rate`| Sample fraction of fast queries.  
  
### 7.3 What to Log

  * `log_connections`, `log_disconnections`.
  * `log_temp_files` (size KB).
  * `log_checkpoints`, `log_lock_waits`.
  * `log_line_prefix` e.g. `'%m [%p] %u@%d '`.

* * *

## 8 · Statement Behaviour

  * `search_path` order of schema resolution.
  * `statement_timeout` aborts long queries.
  * `idle_in_transaction_session_timeout` kills forgotten psql sessions.

* * *

## 9 · JIT Compilation

LLVM-based JIT is on by default (`jit = on`). Costs (`jit_above_cost`, `jit_inline_above_cost`) decide when to compile.

* * *

## 10 · Preset Read-Only Parameters

Build-time constants such as `block_size`, `wal_segment_size`, `max_function_args` appear in `SHOW ALL` but cannot be changed without recompiling.

* * *

## 11 · Configuration Includes

```text
# in postgresql.conf
include 'postgresql.local.conf'
include_dir 'conf.d'
```

 

Great for separating technology-specific overrides (_conf.d/timescaledb.conf_ , _conf.d/app_logging.conf_).

* * *

© 2025 Your Name — feel free to reuse with attribution.
