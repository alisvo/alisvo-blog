---
title: "PostgreSQL Cluster Commands"
description: "PostgreSQL Cluster Control Cheat-Sheet 1 · What Exactly Is a “Cluster”? In PostgreSQL terminology, a cluster is a self-contained instance: one data..."
pubDate: 2025-05-09
tags: ["Cluster", "PostgreSQL"]
featured: false
readingTime: "2 dk okuma"
---

# PostgreSQL Cluster Control Cheat-Sheet

* * *

## 1 · What Exactly Is a “Cluster”?

In PostgreSQL terminology, a **cluster** is a self-contained instance: one data directory, one listening port, one set of background processes. Multiple databases live inside, but they all share the same WAL stream and config files (_postgresql.conf_ , _pg_hba.conf_ , …).

* * *

## 2 · Starting a Cluster (`pg_ctl start`)

```bash

# basic invocation (foreground wait)
pg_ctl -D /pgdata -l /var/log/pg_start.log start

# common flags
   -l  logfile         # redirect server stdout/stderr
   -w / -W             # wait / don’t wait for startup confirmation
   -o  "-c port=5434"  # extra postmaster options (here: override port)
```

> **systemd users:** prefer `systemctl start postgresql-16`. But `pg_ctl` is still essential for ad-hoc clusters, containers, or single-user mode troubleshooting.

* * *

## 3 · Stopping a Cluster (`pg_ctl stop`)

Mode| Behaviour| When to Use
---|---|---
`smart`| Waits until all clients disconnect.| Graceful maintenance windows.
`fast` (default)| Sends `SIGTERM` to backends → rollback/commit → clean shutdown.| Most day-to-day stops.
`immediate`| `SIGQUIT`; no checkpoints — next start triggers crash-recovery.| Last-resort emergency (corrupted session, out-of-memory spiral).

```bash
pg_ctl -D /pgdata stop -m fast
```

* * *

## 4 · Reloading Configuration (`pg_ctl reload`)

Many GUCs (e.g. `log_* `, `shared_preload_libraries` *not*) can be applied without downtime.

```bash

# signal postmaster to reread configs
pg_ctl -D /pgdata reload

# SQL alternative, handy in scripts
SELECT pg_reload_conf();
```

> Check what was applied with `SHOW config_file;` · `SELECT name, setting, pending_restart FROM pg_settings WHERE pending_restart;`

* * *

## 5 · Cluster Status Quick-Checks

Command| Output
---|---
`pg_ctl -D /pgdata status`| PID, data dir, socket dir, and _running_ /_stopped_.
`pg_isready -h host -p 5432`| Simple “accepting connections” probe (ideal for load-balancers).

* * *

## 6 · `pg_controldata` — Digging into Control File

`pg_controldata /pgdata` reads `global/pg_control` and prints:

  * System identifier (64-bit unique ID).
  * Cluster state (in production, shutdown, in recovery).
  * Latest checkpoint & WAL pointer details.
  * Block sizes, checksum version, control-file format version.

```text
$ pg_controldata /pgdata
Database cluster state:     in production
Latest checkpoint location: 0/41A3AA40
WAL level setting:          replica
...
```

> **Tip ⏳** — Combine with `pg_waldump` to inspect recent WAL activity when diagnosing crash-recovery loops.

* * *

## 7 · Cheat-Sheet Summary

Task| pg_ctl Syntax| Notes
---|---|---
Start| `pg_ctl -D $PGDATA -l logfile start`| `-w` waits, `-o` passes extra postmaster args.
Stop| `pg_ctl -D $PGDATA stop -m fast`| Modes: smart | fast | immediate.
Restart| `pg_ctl -D $PGDATA restart -m fast`| Convenience wrapper for stop + start.
Reload| `pg_ctl -D $PGDATA reload`| No downtime; limited parameters.
Status| `pg_ctl -D $PGDATA status`| Exits 0 if running.

```bash

# one-liner: fast restart with confirmation
pg_ctl -D /pgdata stop -m fast -w && pg_ctl -D /pgdata start -w
```

* * *

© 2025 Your Name — free to share with attribution.
