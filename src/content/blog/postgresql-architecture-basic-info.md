---
title: "Postgresql Architecture, Basic Info"
description: "PostgreSQL Reference Guide General Database Limits Maximum Database Size: Unlimited Maximum Table Size: 32 TB Maximum Row Size: 1.6 TB Maximum Field Size: 1..."
pubDate: 2025-05-07
tags: ["Architecture", "PostgreSQL"]
featured: false
readingTime: "4 dk okuma"
---

# PostgreSQL Reference Guide

## General Database Limits

  * **Maximum Database Size:** Unlimited
  * **Maximum Table Size:** 32 TB
  * **Maximum Row Size:** 1.6 TB
  * **Maximum Field Size:** 1 GB
  * **Maximum Rows per Table:** Unlimited
  * **Maximum Columns per Table:** 250–1600 _(depends on column types)_
  * **Maximum Indexes per Table:** Unlimited

* * *

## Common Database Object Names

Industry Term| PostgreSQL Term
---|---
Table or Index| Relation
Row| Tuple
Column| Attribute
Data Block| Page _(on disk)_
Page| Buffer _(in memory)_

* * *

## Process & Memory Architecture

### 1. Top‑Level Process

**postmaster** (also `postgres`) is the parent daemon. It listens on `5432` (by default), accepts client connections, and forks a dedicated backend for each session.

### 2. Shared Memory Areas

Component| Purpose
---|---
**Shared Buffers**|  Main buffer cache holding data pages read from disk.
**WAL Buffers**|  Staging area for write‑ahead log (WAL) records before flushing.
**Process Array**|  Metadata slot for every active backend process.

### 3. Background & Utility Processes

Process| Key Function
---|---
Background writer| Trickle‑writes dirty buffers to disk, smoothing I/O.
WAL writer| Flushes WAL buffers to segment files.
Checkpointer| Creates periodic checkpoints for crash recovery.
Logging collector| Routes server logs to `syslog`, Event Log, or files.
Autovacuum launcher / workers| VACUUM & ANALYZE tables automatically.
Archiver| Copies completed WAL segments (`archive_command`).
Logical replication launcher| Spawns workers that stream changes to subscribers.

### 4. Disk Structures

  * **Data files:** Heap & index storage.
  * **WAL segments:** Default 16 MB sequential log files.
  * **Archived WAL:** Off‑site copies for PITR & standby sync.
  * **Error logs:** Text diagnostics.

* * *

## Backend Connection & Session Lifecycle

Phase| What Happens
---|---
Connection request| Client contacts `postmaster`.
Process fork| `postmaster` forks a backend (`postgres`).
Authentication| Evaluated via `pg_hba.conf`.
Authorization| Catalog privilege checks on every stmt.
IPC| Shared memory, semaphores, LWLocks.
Per‑query memory| Each backend uses its own `work_mem`.
Termination| Backend exits, PID freed.

* * *

## Shared Buffer Read & Write Path

### Read Buffering

The first access triggers a disk read into `shared_buffers`; subsequent reads hit RAM only.

### Write Buffering

  * Backends modify cached blocks (marking them _dirty_).
  * **bgwriter** flushes dirty pages gradually.
  * **Checkpointer** forces all older dirty pages to disk at a checkpoint.

> **Tuning tip:** Raise `shared_buffers`; balance `checkpoint_timeout`, `max_wal_size`, and `bgwriter_*`.

* * *

## Background Writer Cleaning Scan

`bgwriter` keeps a pool of clean pages ready; governed by `bgwriter_lru_maxpages` & related settings.

## Write‑Ahead Logging (WAL) Mechanics

  1. **Modify page** → WAL record generated.
  2. **Group commit** collects commits into one `fsync`.
  3. **Flush** via WAL writer, `COMMIT`, or buffer wrap‑around.

_Key GUCs:_ `wal_buffers`, `wal_writer_delay`, `commit_delay`, `synchronous_commit`.

## Transaction Log Archiving

With `archive_mode = on`, `archiver` executes `archive_command` for each completed WAL segment to enable PITR and replica creation.

## Commit & Checkpoint Sequence

  1. **Pre‑commit:** Dirty buffers only in memory.
  2. **Commit:** WAL `fsync` → durable; buffers flagged committed.
  3. **Checkpoint:** Checkpointer flushes all dirty pages ≤ current LSN.

_Tune:_ lower `checkpoint_timeout` for faster recovery; raise `max_wal_size` to reduce checkpoint frequency.

* * *

## SQL Statement Processing Pipeline

  1. **Parse** – syntax check, tokenise, traffic‑cop accepts or rejects.
  2. **Optimise** – planner explores candidate plans, estimates cost via stats, chooses best.
  3. **Execute** – executor walks plan tree, produces tuples to client.

Prepared statements skip parse/plan on reuse; planner can re‑optimise with parameter sniffing.

* * *

## Physical Database Architecture

  * One **cluster** = data directory + unique port + background procs.
  * Multiple **databases** live in a single cluster, sharing WAL.

### Installation Layout (RPM example)

  * `/usr/pgsql‑16/bin` – executables
  * `/usr/pgsql‑16/lib` – shared libraries
  * `/usr/pgsql‑16/share` – extension / tzdata
  * **Data dir:** `/var/lib/pgsql/16/data`

### Key Sub‑directories

  * `global/` – cluster‑wide catalogs
  * `base/` – one subdir per database OID
  * `pg_tblspc/` – symlinks to external tablespaces
  * `pg_wal/` – active WAL
  * `pg_xact/`, `pg_multixact/` – commit status
  * … plus numerous runtime & config files

* * *

## Tablespaces & File‑per‑Relation Storage

Every table or index lives in its own file. When it grows beyond **1 GB** , PostgreSQL appends `.1`, `.2`, … segment files (each another 1 GB). Auxiliary files (__fsm_ , __vm_) track free & visibility info.

```sql
-- Locate the physical files for a given relation
SELECT pg_relation_filepath('public.my_table');
```

## Sample Data‑Directory Tree (OID Walk‑Through)

```text
$PGDATA/
├─ base/14307/14297        -- first 0‑1 GB of a relation
├─ base/14307/14297.1      -- second GB
├─ pg_tblspc/16650 → /storage/pg_tab
└─ …
```

* * *

## Heap / Index Page Layout (8 kB)

Section| Size| Purpose
---|---|---
Page header| 24 B| Flags, LSN, checksum, free‑space pointers
Line‑pointer array| 4 B × n| Offsets to tuples / index items (grows downward)
Free space| variable| Unallocated bytes
Tuple / Index entries| variable| Actual row or index data (grows upward)
Special area| AM‑specific| Index metadata; empty for heap pages

_Note:_ Custom builds can use 4–32 kB pages; the 1 GB segment limit scales proportionally.
