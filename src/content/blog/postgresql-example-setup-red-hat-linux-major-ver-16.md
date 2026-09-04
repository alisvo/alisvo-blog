---
title: "Postgresql Example Setup (Red Hat Linux - Major Ver. 16)"
description: "PostgreSQL 16 Enterprise‑Grade Installation Guide RHEL 8/9 Edition 1 · Preparation Checklist 64‑bit RHEL 8/9 minimal install, fully patched. Dedicated LVM..."
pubDate: 2025-05-07
tags: ["Linux", "PostgreSQL", "Setup"]
featured: false
readingTime: "2 dk okuma"
---

# PostgreSQL 16
Enterprise‑Grade Installation Guide
RHEL 8/9 Edition

* * *

## 1 · Preparation Checklist

  * 64‑bit **RHEL 8/9** minimal install, fully patched.
  * Dedicated LVM volume:
    * `/pgdata` → data files (XFS, noatime)
    * `/pgwal` → WAL (optional, SSD / NVMe for low latency)
  * Outbound HTTPS for the official PostgreSQL YUM repository.
  * Root (or sudo) access for initial setup; thereafter run the service as a locked `postgres` OS user.

## 2 · Create the `postgres` Service Account

```bash

# groupadd --system postgres

# useradd  --system --gid postgres --home-dir /pgdata --shell /bin/bash postgres

# passwd -l postgres         # lock password (SSH key / sudo only)
```

> **Why?** Running the server under an unprivileged user isolates the cluster and its files from the rest of the OS—exactly as recommended in the EDB training.

## 3 · Kernel & System Tuning

```ini
cat >/etc/sysctl.d/99-postgresql-tuning.conf <<EOF

# Increase shared memory & semaphores for DB loads
kernel.shmmax = 68719476736        # 64 GB, adjust to 75‑80 % of RAM
kernel.shmall = 16777216           # shmmax / 4 kB
kernel.sem    = 4096 524288 4096 512
vm.swappiness = 10

# Allow enough pending connections
net.core.somaxconn = 1024
EOF

sysctl --system
```

### SELinux

If you run SELinux _enforcing_ , add the supplied policy module from `postgresql-server` RPM.
Otherwise set it to `permissive` during install, then back to enforcing:

```text

# setenforce 0   # permissive
...

# setenforce 1   # enforcing
```

## 4 · Add the Official PGDG YUM Repository

```bash

# dnf -y install https://download.postgresql.org/pub/repos/yum/reporpms/EL-$(rpm -E %{rhel})-x86_64/\
postgresql16-libs-16.2-1PGDG.rhel$(rpm -E %{rhel}).x86_64.rpm
```

The above command installs a small “hook” RPM; it configures `/etc/yum.repos.d/pgdg-redhat-all.repo`.

## 5 · Install Server & Contrib Packages

```bash

# dnf -y groupinstall "PostgreSQL Server 16"

# dnf -y install postgresql16-contrib postgresql16-devel
```

## 6 · Initialise a Custom Data Directory

```bash

# mkdir /pgdata /pgwal

# chown postgres:postgres /pgdata /pgwal

# su - postgres
$ /usr/pgsql-16/bin/initdb -D /pgdata \
    --waldir=/pgwal \
    --encoding=UTF8 \
    --locale=en_US.UTF-8
```

## 7 · Environment Variables (User Profile)

```bash
$ vi ~/.bash_profile

# ---- PostgreSQL env ----
export PATH=/usr/pgsql-16/bin:$PATH
export PGDATA=/pgdata
export PGPORT=5432
export PGUSER=postgres
export PGDATABASE=postgres
```

Log off / back on to load them, or `source ~/.bash_profile`.

## 8 · First‑Cut  _postgresql.conf_ Tweaks

```sql

# /pgdata/postgresql.conf
listen_addresses = '*'               # allow remote access (firewall permitting)
max_connections  = 200
shared_buffers   = 8GB               # ≈25 % RAM (assumes 32 GB machine)
effective_cache_size = 24GB          # ≈75 % RAM
work_mem        = 32MB               # × active sorts
maintenance_work_mem = 2GB
wal_level       = replica
wal_compression = on
wal_buffers     = -1                 # auto (≈16 MB)
checkpoint_timeout = 15min
max_wal_size    = 8GB
checkpoint_completion_target = 0.9
archive_mode    = on
archive_command = 'rsync -a %p /archived_wal/%f'
log_destination = 'stderr'
log_directory   = 'log'
log_filename    = 'postgresql-%a.log'
log_rotation_age = 1d
log_min_duration_statement = 1000    # ms
autovacuum_vacuum_cost_limit = 2000
```

> **Tip:** Revisit these values after load testing; use `pg_test_timing` and `pgbench` for baselines.

## 9 · Systemd Service Unit

The `postgresql-16` RPM provides `/usr/lib/systemd/system/postgresql-16.service`. Override it to use our custom directories & add hardening:

```bash

# systemctl edit postgresql-16

# (creates /etc/systemd/system/postgresql-16.service.d/override.conf)

[Service]
Environment=PGDATA=/pgdata
OOMScoreAdjust=-500
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true
```

### Enable & Start

```bash

# systemctl daemon-reload

# systemctl enable --now postgresql-16

# systemctl status postgresql-16
```

## 10 · Firewall / SELinux Ports

```bash

# firewall-cmd --permanent --add-service=postgresql

# firewall-cmd --reload

# semanage port -a -t postgresql_port_t -p tcp 5432  # if using non‑default port
```

## 11 · Secure the Cluster

  * Replace the default DB superuser password:

```sql
ALTER USER postgres WITH PASSWORD '********';
```

  * Edit `pg_hba.conf` to use `scram-sha-256` or `md5` authentication, not `trust`.
  * Restrict replication connections to known hosts.

## 12 · Health‑Check & Monitoring Hooks

Tool| Install| Purpose
---|---|---
`postgres_exporter`| Prometheus / Grafana| Metrics
`pgBackRest`| YUM repo| Incremental, compressed backups
`pgaudit`| `dnf install pgaudit16*`| Detailed audit logs

* * *

## Quick Validation Script

```bash
#!/bin/bash
echo "== Version =="; psql -c "SELECT version();" -qt
echo "== Shared Buffers =="; psql -c "SHOW shared_buffers;" -qt
echo "== Conn Check =="; pg_isready
echo "== WAL Dir =="; ls -lh /pgwal | head
```

If all checks pass, your PostgreSQL 16 instance is production‑ready—tuned, secured, and laid out on enterprise‑grade storage.

* * *

© 2025 Your Name – feel free to adapt & share with attribution.
