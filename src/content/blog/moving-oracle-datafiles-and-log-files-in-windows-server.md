---
title: "Moving Oracle Datafiles and Log Files in Windows Server"
description: "Consolidating Oracle 19c Datafiles & Redo Logs onto a Single Drive Contents 0 · Executive Summary 1 · Pre‑Start Requirements 2 · Inventory & Duplicate‑Name..."
pubDate: 2025-04-22
tags: ["Consolidation", "Datafile", "Oracle"]
featured: false
readingTime: "3 dk okuma"
---

# Consolidating Oracle 19c Datafiles & Redo Logs onto a Single Drive

**Contents**

  * 0 · Executive Summary
  * 1 · Pre‑Start Requirements
  * 2 · Inventory & Duplicate‑Name Audit
  * 3 · Dry‑Run on a Test Tablespace
  * 4 · Generate Rename Scripts
  * 5 · Shutdown & Robocopy
  * 6 · Update Controlfile Pointers
  * 7 · Temp Tablespace Plan
  * 8 · (Option) Moving Controlfiles
  * 9 · Post‑Migration Checks
  * 10 · Rollback Plan
  * Appendix A · FAQ

## 0 · Executive Summary

We will shut down the Oracle instance, _move_ every datafile and redo‑log file from drives `D:`, `E:` and `G:` to the new drive `H:` using `ROBOCOPY /MOV`, then update the controlfile pointers and reopen the database. A quick test with a disposable tablespace proves the commands before the real move.

## 1 · Pre‑Start Requirements

  * ✔️ **New drive ready:** `H:` must have enough free space for _all_ datafiles + redo logs + ≈10 % head‑room.
  * ✔️ **Label & ACLs:** volume labelled (e.g. “ORADATA”) and _Full Control_ granted to the Oracle OS user/group.
  * ✔️ **Test tablespace:** create `TEMP_TST` with a 10 MB datafile on the old drive and relocate it first as a proof‑of‑concept.
  * ✔️ **Check duplicate filenames** for both datafiles & redo logs; rename any clashes before the main run.
  * ✔️ **Control file strategy** decided (stay or move – see § 8).

## 2 · Inventory & Duplicate‑Name Audit

**List every file location** :

```sql
SELECT file_name, tablespace_name, file_id, status
FROM   dba_data_files
ORDER  BY file_name;

SELECT member AS redo_file, group#
FROM   v$logfile
ORDER  BY group#, member;
```

**Detect same basenames** (case‑insensitive):

```sql
WITH f AS (
  SELECT file_name,
         LOWER(REGEXP_SUBSTR(file_name,'[^/\\]+$')) AS base
  FROM   dba_data_files
)
SELECT file_name,
       base,
       COUNT(*) OVER (PARTITION BY base) AS occurrences
FROM   f
WHERE  occurrences > 1
ORDER  BY base, file_name;
```

> If duplicates appear, plan to give at least one of the files a unique name before relocation.

## 3 · Dry‑Run on a Disposable Tablespace

Create the test tablespace:

```sql
CREATE TABLESPACE temp_tst
DATAFILE 'D:\ORACLE\ORADATA\SKY\TEMP_TST01.DBF' SIZE 10M;
```

Offline, move, rename, bring online:

```sql
ALTER TABLESPACE temp_tst OFFLINE NORMAL;
HOST MOVE "D:\ORACLE\ORADATA\SKY\TEMP_TST01.DBF" "H:\ORADATA\TEMP_TST01.DBF"
ALTER TABLESPACE temp_tst
  RENAME DATAFILE 'D:\ORACLE\ORADATA\SKY\TEMP_TST01.DBF'
                 TO 'H:\ORADATA\TEMP_TST01.DBF';
ALTER TABLESPACE temp_tst ONLINE;
```

If successful, you may later drop it:

```sql
DROP TABLESPACE temp_tst INCLUDING CONTENTS AND DATAFILES;
```

## 4 · Generate Rename Scripts

Run while DB is _OPEN_ , spool to a file:

```sql
-- Datafiles
SELECT 'ALTER DATABASE RENAME FILE '''||file_name||
       ''' TO ''H:\ORADATA\'||
       REGEXP_SUBSTR(file_name,'[^\\]+$')||''';'
FROM   dba_data_files
ORDER  BY file_id;

-- Redo log members
SELECT 'ALTER DATABASE RENAME FILE '''||member||
       ''' TO ''H:\ORADATA\'||
       REGEXP_SUBSTR(member,'[^\\]+$')||''';'
FROM   v$logfile
ORDER  BY group#, member;
```

These scripts will be executed later while the instance is mounted.

## 5 · Shutdown Oracle & Move Files

### 5.1 Stop services (Windows)

```text
net stop OracleTNSListener
net stop OracleServiceSKY
```

### 5.2 Robocopy commands

```text
ROBOCOPY "E:\ORACLE\ORADATA\SKY" "H:\ORADATA" "*.DBF" /MOV /MT:8 /J /R:1 /W:1 /ETA
ROBOCOPY "G:\ORADATA"           "H:\ORADATA" "*.DBF" /MOV /MT:8 /J /R:1 /W:1 /ETA
ROBOCOPY "D:\ORACLE\ORADATA\SKY" "H:\ORADATA" "*.*"  /MOV /MT:8 /J /R:1 /W:1 /ETA
```

> **Note** : `/MOV` performs copy + delete and includes hidden/system files.

## 6 · Update Controlfile Pointers

  1. Restart the instance but leave it in NOMOUNT:

```text
net start OracleServiceSKY
```

  2. Mount the database:

```sql
sqlplus / as sysdba
STARTUP MOUNT;
```

  3. Run the _datafile_ and _redo_ rename scripts generated in § 4.
  4. Open the database:

```sql
ALTER DATABASE OPEN;
```

  5. Restart the listener:

```text
net start OracleTNSListener
```

  6. Immediately back up the controlfile:

```sql
ALTER DATABASE BACKUP CONTROLFILE TO
  'H:\ORADATA\CONTROL_POSTMOVE.CTL';
```

## 7 · Temp Tablespace Strategy (Simplest = Recreate)

```sql
CREATE TEMPORARY TABLESPACE temp_new
TEMPFILE 'H:\ORADATA\TEMP01.DBF' SIZE 1G AUTOEXTEND ON NEXT 100M;
ALTER DATABASE DEFAULT TEMPORARY TABLESPACE temp_new;
DROP TABLESPACE temp INCLUDING CONTENTS AND DATAFILES;
ALTER TABLESPACE temp_new RENAME TO temp;
```

## 8 · Optional – Moving Controlfiles to `H:`

  1. Query current locations:

```sql
SHOW PARAMETER control_files;
```

  2. Copy one controlfile to the new drive as `CONTROL01.CTL`.
  3. Edit the spfile:

```sql
ALTER SYSTEM SET control_files='H:\ORADATA\CONTROL01.CTL' SCOPE=SPFILE;
```

  4. Shutdown and restart to MOUNT, then OPEN.
  5. Remove old copies after a fresh backup.

## 9 · Post‑Migration Checks

  * **All files on H:**

```sql
SELECT name FROM v$datafile UNION SELECT member FROM v$logfile;
```

  * **Temp online:**

```sql
SELECT tablespace_name,status
FROM   dba_tablespaces
WHERE  contents='TEMPORARY';
```

  * **Backup test:** run `RMAN BACKUP DATABASE PLUS ARCHIVELOG;`
  * **ACL review:** `icacls H:\ORADATA` shows no _DENY_ entries.

## 10 · Rollback Plan (if needed)

  1. Shutdown services again.
  2. Robocopy files back to original drives (reverse of § 5).
  3. Mount and execute the original rename scripts pointing to `D:`, `E:`, `G:`, then open the DB.

## Appendix A · FAQ

  * **Does`/J` hurt?** No—un‑buffered I/O speeds large file moves on SSDs.
  * **Can I move SYSTEM, UNDO, TEMP while DB open?** SYSTEM & UNDO require MOUNT phase; others can be offline/online one‑by‑one.
  * **Can I multiplex redo again?** Yes—`ALTER DATABASE ADD LOGFILE MEMBER ...`
