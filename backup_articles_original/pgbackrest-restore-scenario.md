---
title: "PgBackRest Restore Scenario"
description: "Rescuing a Dropped PostgreSQL Database: Two pgBackRest Paths to Success That sinking feeling when a DROP DATABASE command slips through... we've all been..."
pubDate: 2025-05-31
tags: ["Backup & DR", "Pgbackrest", "PostgreSQL", "Restore"]
featured: false
readingTime: "5 dk okuma"
---

# Rescuing a Dropped PostgreSQL Database: Two pgBackRest Paths to Success

That sinking feeling when a `DROP DATABASE` command slips through... we've all been there, or at least dreaded it. The good news is that with robust tools like PostgreSQL and pgBackRest, recovery is often very achievable. I recently put this to the test after "accidentally" dropping a database named `NEWDB` and wanted to share two distinct, successful methods I used to bring it back.

## The Setup:

  1. A PostgreSQL cluster with several databases, including one I created called `NEWDB`.
  2. Data was added to `NEWDB`.
  3. A **full backup** was taken using pgBackRest _while`NEWDB` existed_.
  4. Then, the fateful command: `DROP DATABASE "NEWDB";`

The mission: Restore `NEWDB` without impacting the other live databases.

* * *

## Method 1: The Classic & Controlled - Restore to Temporary, then `pg_dump`/`pg_restore`

This is a well-trodden and highly reliable path for surgically extracting specific data from a full backup. It offers maximum control and isolates the recovery process until the very end.

### The Core Idea:

You restore the entire cluster from a backup (taken _before_ the drop) to a completely separate, temporary location. From this temporary, running instance, you then use `pg_dump` to export just the database you need (`NEWDB`), and finally, `pg_restore` to load it into your live production cluster.

### Key Steps to Success:

  1. **Identify the "Golden" Backup:** Use `pgbackrest --stanza=mydb info` to find the label of the backup set that was taken _before_ `NEWDB` was dropped. This backup contains `NEWDB`.
  2. **Prepare a Temporary Restore Zone:** Create new, empty directories for the temporary instance's data directory and its WAL files (especially if your main setup uses a symlinked `pg_wal`). Ensure the `postgres` user has ownership. 

```bash
# Example paths
sudo mkdir -p /mnt/pg_temp_restore/data
sudo mkdir -p /mnt/pg_temp_restore/wal # If using symlinked WALs
sudo chown -R postgres:postgres /mnt/pg_temp_restore
sudo chmod -R 700 /mnt/pg_temp_restore
```

 
  3. **Perform a Point-In-Time Restore (PITR) to the Temporary Zone:**  
This is crucial. You want to restore the state of the cluster _just before_ `NEWDB` was dropped. 

```text
pgbackrest --stanza=mydb \
           --pg1-path=/mnt/pg_temp_restore/data \
           --set=[LABEL_OF_BACKUP_WITH_NEWDB] \
           --type=time \
           --target="[YYYY-MM-DD HH:MM:SS_JUST_BEFORE_NEWDB_DROP]" \
           --target-action=promote \
           restore
```

 

_(Replace bracketed placeholders with your actual values. If you use a symlinked`pg_wal` in your main setup, after the restore command completes and _before_ starting the temporary instance, go into `/mnt/pg_temp_restore/data`, remove the `pg_wal` directory pgBackRest created, and create a symlink named `pg_wal` pointing to `/mnt/pg_temp_restore/wal`)._

  4. **Configure & Start the Temporary PostgreSQL Instance:**  
Edit the `postgresql.conf` in `/mnt/pg_temp_restore/data` to use a port different from your live cluster (e.g., `port = 5433`). Then, start this temporary instance: 

```bash
pg_ctl -D /mnt/pg_temp_restore/data -o "-p 5433" -l /mnt/pg_temp_restore/logfile start
```

 

Check its logfile for successful startup and recovery. `NEWDB` should be present here!

  5. **Dump`NEWDB` from the Temporary Instance:** 

```bash
pg_dump -p 5433 -U postgres -Fc -f /tmp/NEWDB_rescue.dump NEWDB
```

 
  6. **Shutdown & Clean Up the Temporary Instance:** 

```bash
pg_ctl -D /mnt/pg_temp_restore/data -m fast stop
sudo rm -rf /mnt/pg_temp_restore # Free up the temporary space
```

 
  7. **Restore`NEWDB` into Your Live Cluster:**  
First, connect to your live PostgreSQL cluster and create an empty placeholder for the database: 

```bash
-- In psql connected to your live cluster
CREATE DATABASE "NEWDB";
```

 Then, from your server's command line, use `pg_restore`: 

```bash
pg_restore -U postgres -d NEWDB -v /tmp/NEWDB_rescue.dump
rm /tmp/NEWDB_rescue.dump # Clean up the dump file
```

 

### Why this method shines:

  * **Safety:** Your live cluster isn't touched directly until the final, controlled `pg_restore` step.
  * **Predictability:** You know exactly what you're getting by isolating the restore.
  * **Universality:** Works regardless of special backup flags or specific PostgreSQL/pgBackRest versions.

* * *

## Method 2: The In-Place PITR with `--delta` \- A Surprising Shortcut

Sometimes, a more direct approach can work, especially when the scope of the "damage" (the dropped database) is well understood and you have a precise target time. In my experiments, this method also successfully brought `NEWDB` back.

### The Core Idea:

Use pgBackRest to perform a Point-In-Time Recovery (PITR) directly onto your existing data directory using the `--delta` flag. The `--delta` flag tells pgBackRest to update the target directory rather than requiring it to be empty. The magic lies in setting a PITR target time _before_ the database drop was committed to the WALs.

### Key Steps to Success:

  1. **Identify a Suitable Backup and Target Time:** pgBackRest will choose the latest backup that can satisfy the PITR target. You need to specify a `--target` timestamp that is _just before_ `NEWDB` was dropped. 

```text
# Example: If NEWDB was dropped around 2025-05-31 20:35:00
# Target time could be "2025-05-31 20:32:00" as in my successful test
```

 
  2. **Perform the Delta PITR Restore:**  
_(Ensure your live PostgreSQL cluster is stopped before running this if it directly modifies the primary PGDATA)._ 

```text
pgbackrest --stanza=mydb \
           --log-level-console=info \
           --type=time \
           --target="[YYYY-MM-DD HH:MM:SS_JUST_BEFORE_NEWDB_DROP]" \
           restore --delta
```

 
     * pgBackRest will compare your live `/pgdata/mydb/data` (where `NEWDB`'s files are now missing) with the chosen backup (where `NEWDB`'s files exist).
     * It will copy the "missing" files for `NEWDB` back into your live data directory.
     * It will also set up `postgresql.auto.conf` for PITR to your specified `--target` time.
  3. **Handle Symlinked`pg_wal` (If Applicable):**  
The restore might replace your `pg_wal` symlink with a real directory. _Before_ starting PostgreSQL, `cd` into your data directory, `sudo rm -rf pg_wal`, and recreate your symlink: `sudo ln -s /your/custom/wal_location/pg_wal pg_wal`.
  4. **Start PostgreSQL & Promote:**  
Start your PostgreSQL server. It will enter recovery mode. 

```bash
sudo systemctl start postgresql-17 # Or your service name
```

 Connect via `psql` and monitor recovery: 

```sql
SELECT pg_is_in_recovery();
-- Once logs indicate it has reached the target or is ready:
SELECT pg_promote();
```

 
  5. **Verify:** `NEWDB` should now be back in your `\l` list!

### Why this method can work (and did for me):

  * The `--delta` restore put the physical files for `NEWDB` back.
  * The precise `--target` time for PITR ensured that the WAL replay stopped _before_ replaying the `DROP DATABASE "NEWDB";` command.

**Important Note on the Delta Method:**  
While this worked in my controlled experiment, it's a more "expert" maneuver. It directly modifies your live data directory. Success hinges on a very accurate target time and a clear understanding of the state of your live data versus the backup. For critical production data, the isolation of Method 1 often provides greater peace of mind.

* * *

## Conclusion:

pgBackRest, combined with PostgreSQL's robust Point-In-Time Recovery, offers powerful ways to recover from data loss. Whether you choose the meticulous control of a temporary restore and `pg_dump`, or a carefully targeted in-place delta PITR, the key is understanding your tools, your backups, and the timeline of events.

And remember, no matter how good your recovery tools are, nothing beats regularly testing your restore procedures!
