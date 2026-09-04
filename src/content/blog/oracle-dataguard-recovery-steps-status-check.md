---
title: "Oracle Dataguard Recovery Steps & Status Check"
description: "Steps and status checking queries to recover disconnected and unrecoverable standby databases in Oracle Data Guard."
pubDate: 2024-02-27
tags: ["Database", "Data Guard", "Oracle"]
featured: false
readingTime: "2 dk okuma"
---

The steps below can be used to recover disconnected and unrecoverable standby databases. All commands below should be executed on the **standby server**.

### 1) Create PFILE

```sql
CREATE PFILE='/tmp/pfile.ora' FROM SPFILE;
```

### 2) Drop the Old Standby Database

```sql
RMAN> STARTUP MOUNT;
RMAN> SQL 'ALTER SYSTEM ENABLE RESTRICTED SESSION';
RMAN> DROP DATABASE INCLUDING BACKUPS NOPROMPT;
```

### 3) Recreate SPFILE and Start in `NOMOUNT`

```bash
sqlplus / as sysdba
```

```sql
CREATE SPFILE FROM PFILE='/tmp/pfile.ora';
STARTUP NOMOUNT;
```

### 4) Duplicate Database for Standby

```bash
# Connection strings coming from tnsnames.ora
rman target sys@primarydb auxiliary sys@stbydb
```

```text
DUPLICATE TARGET DATABASE FOR STANDBY FROM ACTIVE DATABASE DORECOVER NOFILENAMECHECK;
```

### 5) Start Managed Recovery

After recovery completes, start the MRP process:

```sql
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT FROM SESSION;
```

> **Note:** If you encounter an error, shut down the database and remount it (`STARTUP MOUNT;`), then retry.

### 6) Check Gap Status

Verify the archive gap status. If `GAP_STATUS` displays **`NO GAP`**, proceed:

```sql
SELECT * FROM gv$archive_dest_status WHERE dest_id IN (1, 2);
```

### 7) Finalize Standby Mode

Once synchronized:

```sql
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;
ALTER DATABASE OPEN READ ONLY;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE USING CURRENT LOGFILE DISCONNECT FROM SESSION;
```

---

### Archive Lag & Sequence Status Query

Run the query below to compare generated vs. applied archive log sequences across nodes:

```sql
SELECT 
    a.name,
    a.resetlogs_id, 
    DECODE(a.thread#, 1, 'PRI NODE1', 'PRI NODE2') AS host, 
    b.last_seq AS son_olusan,
    a.applied_seq AS son_uygulanan, 
    TO_CHAR(a.uygulanan_son_zaman, 'dd/mm/yyyy hh24:mi:ss') AS son_uygulama_zamani
FROM 
    (SELECT 
         name, 
         resetlogs_id, 
         thread#, 
         MAX(sequence#) AS applied_seq, 
         MAX(next_time) AS uygulanan_son_zaman
     FROM gv$archived_log
     WHERE applied = 'YES' 
       AND name IN ('stby1', 'stby2') 
       AND resetlogs_id = (SELECT MAX(resetlogs_id) FROM gv$archived_log)
       AND thread# = 1 -- Single-node specific filter; remove if running multi-instance RAC
     GROUP BY name, resetlogs_id, thread#
    ) a,
    (SELECT 
         name, 
         resetlogs_id, 
         thread#, 
         MAX(sequence#) AS last_seq
     FROM gv$archived_log 
     WHERE name IN ('stby1', 'stby2') 
       AND resetlogs_id = (SELECT MAX(resetlogs_id) FROM gv$archived_log)
     GROUP BY name, resetlogs_id, thread#
    ) b
WHERE 
    a.thread# = b.thread#
    AND a.name = b.name;
```
