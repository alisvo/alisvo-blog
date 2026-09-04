---
title: "Streaming Replication Without Archiving (Linux)"
description: "Initial Steps Summary Let’s sum up the initial steps, then dive into key points: Ensure that the primary and replica servers have proper firewall..."
pubDate: 2022-09-29
updatedDate: 2024-11-07
tags: ["Linux", "Pg_Basebackup", "PostgreSQL", "Replication", "Standby", "Streaming Replication"]
featured: false
readingTime: "1 dk okuma"
---

## Initial Steps Summary

Let’s sum up the initial steps, then dive into key points:

  1. Ensure that the primary and replica servers have proper firewall configurations. Both servers should be able to communicate over PostgreSQL service ports (default: `5432`).
  2. Edit `pg_hba.conf` on the Primary Database by adding the following line to allow the replica server to connect:

```text
host    replication    rep_user    /32    scram-sha-256
```

  3. Create a replica user on the Primary Database with the following command:

```text
createuser -U postgres rep_user -P --replication -p
```

  4. Edit the `postgresql.conf` file on the Primary Database:

```ini
wal_keep_size = 10000 MB
max_slot_wal_keep_size = 10000 MB
```

**Note:** Adjust these values based on your needs. For a high data load, increase the value. For a low data load, decrease it. The above values assume that, at most, 10GB of data might fail to be sent during an outage.

## Key Points

### 1. Handling Large Databases

For large databases, replication may take hours. To avoid waiting for hours in front of the computer, use a background process like the `nohup` command in Linux.

#### Create a `pgpass` File

To avoid being prompted for a password during the `pg_basebackup` command, create a `pgpass` file:

```bash
echo "::*::" > /var/lib/pgsql/.pgpass
chmod 0600 /var/lib/pgsql/.pgpass
chown postgres.postgres /var/lib/pgsql/.pgpass
```

### 2. Create a Bash Script

Create a script to automate the replication process. Here’s an example script:

```bash

# basebackup.sh
/usr/pgsql-14/bin/pg_basebackup -D /pgdata/14/data/ -Fp -R -X stream -c fast -C -S ourdb_standby -h 192.168.1.90 -p 5432 -U rep_user -P
systemctl enable --now postgresql-14.service
```

Before running the script, give it execute permission:

```bash
chmod +x basebackup.sh
```

Run the script using the `nohup` command:

```text
nohup sh basebackup.sh > basebackup.log 2>&1 & disown
```

### 3. Verify Replication

After the process finishes, verify that replication is working correctly with the following `psql` command:

```sql
select * from pg_stat_replication;
```

## Conclusion

By following these steps, you can set up streaming replication in PostgreSQL without enabling the archiving feature. This approach ensures resilience to network outages while keeping the replication process efficient and manageable.
