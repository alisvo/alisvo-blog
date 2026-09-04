---
title: "Practical RMAN Restore Scenario For Linux on Different Server"
description: "Practical RMAN Restore Guide This guide shows how to restore and relocate an Oracle database via RMAN. We’ll assume you want all datafiles in a new folder (..."
pubDate: 2025-01-31
updatedDate: 2025-09-23
tags: ["Oracle", "Restore", "RMAN"]
featured: false
readingTime: "2 dk okuma"
---

# Practical RMAN Restore Guide

This guide shows how to restore and relocate an Oracle database via RMAN. We’ll assume you want all datafiles in a new folder (`/newpath` instead of `/oldpath`), and possibly handle redo logs in a new location as well. Steps include restoring SPFILE, cataloging backups, restoring archived logs, and point-in-time recovery.

* * *

## 1. Copy RMAN Backups to the New Server

```bash
mkdir -p /u01/backup/test_restore
cp /oldserver/backups/*.bkp /u01/backup/test_restore
```

Copy _all_ backup pieces (datafiles, control file, SPFILE, archivelogs) to a directory the new server can access.

* * *

## 2. Create Required Oracle Directories

```bash
mkdir -p /u01/app/oracle/admin/MYDB/adump
mkdir -p /u01/app/oracle/oradata/MYDB
mkdir -p /u01/app/oracle/fast_recovery_area/MYDB
mkdir -p /newpath/onlinelog
```

Ensure directories exist for diagnostic files (`adump`), datafiles, FRA, and redo logs before proceeding.

* * *

## 3. Startup NOMOUNT with a Minimal PFILE

```sql
sqlplus / as sysdba

-- Create a basic init file with just DB_NAME and diagnostic_dest:
STARTUP NOMOUNT PFILE='/u01/app/oracle/product/19.0.0/dbhome_1/dbs/initMYDB.ora';
```

A minimal PFILE is required to get the instance into NOMOUNT.

* * *

## 4. Restore the SPFILE (Optional but Recommended)

```sql
rman target /

-- From autobackup:
RESTORE SPFILE FROM AUTOBACKUP;

-- Or from a known backup piece:
RESTORE SPFILE TO '/u01/app/oracle/product/19.0.0/dbhome_1/dbs/spfileMYDB.ora'
  FROM '/u01/backup/test_restore/spfile_backup.bkp';

-- Restart with the restored SPFILE:
SHUTDOWN IMMEDIATE;
STARTUP NOMOUNT;
```

Restoring the SPFILE ensures the database uses the original initialization parameters.

* * *

## 5. Catalog Backup Pieces in RMAN

```text
CATALOG START WITH '/u01/backup/test_restore' NOPROMPT;
```

Cataloging makes RMAN aware of the backup sets you copied.

* * *

## 6. Restore the Control File & Mount the Database

```sql
RESTORE CONTROLFILE FROM '/u01/backup/test_restore/controlfile_backup.bkp';
ALTER DATABASE MOUNT;
```

* * *

## 7. Redirect and Restore Datafiles

```text
RUN {
  SET NEWNAME FOR DATABASE TO '/newpath/%b';
  RESTORE DATABASE;
  SWITCH DATAFILE ALL;
}
```

At this point datafiles are restored to the new path.

* * *

## 8. Restore Archived Logs (For Recovery)

```text
RUN {
  ALLOCATE CHANNEL c1 DEVICE TYPE DISK;
  RESTORE ARCHIVELOG ALL;
  RELEASE CHANNEL c1;
}
```

Archived logs are needed to roll forward your datafiles. You can restore all logs, or restrict by `FROM TIME`, `FROM SEQUENCE`, or SCN.

* * *

## 9. Recover Database (Point-in-Time if Needed)

Choose recovery type:

### a) Full Recovery to Latest

```text
RECOVER DATABASE;
```

### b) Point-in-Time Recovery

```text
-- Example: Recover until a specific time
RUN {
  SET UNTIL TIME "to_date('2025-09-19 20:30:00','YYYY-MM-DD HH24:MI:SS')";
  RESTORE DATABASE;
  RECOVER DATABASE;
}
```

This allows you to roll forward only up to a certain time, SCN, or log sequence.

* * *

## 10. Handle Redo Logs in a New Location (Optional)

```sql
ALTER DATABASE RENAME FILE
  '/oldpath/onlinelog/o1_mf_3_abc.log'
TO
  '/newpath/onlinelog/o1_mf_3_abc.log';

-- If needed:
touch /newpath/onlinelog/o1_mf_3_abc.log
```

* * *

## 11. Open the Database with RESETLOGS

```sql
ALTER DATABASE OPEN RESETLOGS;
```

* * *

## 12. Verify Everything

```sql
SELECT name FROM v$datafile;
SELECT group#, member FROM v$logfile;
```

* * *

## Summary

  1. Copy backups to the new server.
  2. Create required folders (adump, datafiles, FRA, redo logs).
  3. Startup NOMOUNT with a minimal PFILE.
  4. Restore the SPFILE and restart NOMOUNT.
  5. Catalog backup files in RMAN.
  6. Restore the control file and MOUNT the database.
  7. Redirect and restore datafiles.
  8. Restore archived logs.
  9. Recover database (full or point-in-time).
  10. Handle redo logs if needed.
  11. Open with `RESETLOGS`.
  12. Verify datafile and log paths.
