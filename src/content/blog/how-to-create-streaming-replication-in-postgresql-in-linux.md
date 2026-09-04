---
title: "How To Create Streaming Replication In PostgreSQL in Linux?"
description: "A step-by-step guide to setting up streaming replication in PostgreSQL on Linux servers, including configuration, backup automation, and replication monitoring."
pubDate: 2023-12-22
tags: ["PostgreSQL", "Replication", "Streaming"]
featured: false
readingTime: "2 dk okuma"
---

> **Note:** Before starting, make sure that PostgreSQL is installed on both the primary and standby servers. If you do not have a primary server running yet, initialize and start it first. Do **not** initialize any database cluster on the standby side.

### 1. Firewall Policies
Ensure the primary and replica database servers can communicate with each other over the PostgreSQL port (default: `5432`).

### 2. Configure `pg_hba.conf` on Primary
On the primary server, add an entry to allow the replication user to connect from the replica server IP:

```ini
host  replication  rep_user  <replica_ip>/32  scram-sha-256
```

### 3. Create the Replication User
On the primary server, create the replication user with replication privileges:

```bash
createuser -U postgres rep_user -P --replication -p <port>
```

### 4. Edit `postgresql.conf` on Primary
Find and adjust the following parameters in `postgresql.conf`:

```ini
max_wal_senders = 10
max_replication_slots = 10
wal_keep_size = 50000MB
max_slot_wal_keep_size = 50000MB
wal_level = replica
```

> **Note:** Adjust `wal_keep_size` to your workload. WAL files are retained up to this size threshold.

### 5. Configure `.pgpass` on Standby
To avoid password prompts during automated scripts, create a `.pgpass` file on the standby server:

```bash
echo "<primary_ip>:<port>:*:<rep_user>:<rep_passwd>" > /var/lib/pgsql/.pgpass
chmod 0600 /var/lib/pgsql/.pgpass
chown postgres.postgres /var/lib/pgsql/.pgpass
```

### 6. Create `basebackup.sh` on Standby Server
Create a shell script named `basebackup.sh` to manage long-running replication setup in the background:

```bash
#!/bin/bash
/usr/pgsql-14/bin/pg_basebackup \
  -D <postgre_data_folder> \
  -Fp -R -X stream -c fast \
  -C -S <replica_slot_name> \
  -h <primary_ip> -p <port> \
  -U rep_user -P

# Copy pre-configured pg_hba.conf if needed
cp /tmp/pg_hba.conf /pgdata/14/data

# Enable and start the service
systemctl enable --now postgresql.service
```

### 7. Run the Script in Background
Execute the base backup in the background:

```bash
nohup sh basebackup.sh > basebackup.log 2>&1 & disown
```

### 8. Monitor Replication Status
Once completed, check the replication status by running this query on the primary database:

```sql
SELECT * FROM pg_stat_replication;
```

Status interpretations:
- **`streaming`**: Replication is healthy, no delay.
- **`catchup`**: Lag detected; replica is currently catching up to primary.
- **`dead`**: Replication is broken or desynchronized.

> **Troubleshooting:** If an error occurs during setup, ensure all files in the replica PostgreSQL data folder are removed before retrying. Then drop the replication slot on the primary:

```sql
SELECT pg_drop_replication_slot('<replica_slot_name>');
```
