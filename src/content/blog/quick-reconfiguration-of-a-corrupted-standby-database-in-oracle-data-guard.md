---
title: "Quick Reconfiguration of a Corrupted Standby Database in Oracle Data Guard"
description: "The following steps can be used to quickly reconfigure a corrupted standby database in Oracle Data Guard. These steps assume the configurations are already..."
pubDate: 2024-11-07
tags: ["Data Guard", "Oracle", "RMAN"]
featured: false
readingTime: "1 dk okuma"
---

The following steps can be used to quickly reconfigure a corrupted standby database in Oracle Data Guard. These steps assume the configurations are already in place, and the commands below should be executed on the standby server.

## 1. Create a PFILE

Create a PFILE from the current SPFILE:

```sql
create pfile='/tmp/pfile.ora' from spfile;
```

## 2. Drop the Old Standby Database

Use RMAN to drop the old standby database:

```sql
RMAN> startup mount;
RMAN> sql 'alter system enable restricted session';
RMAN> drop database including backups noprompt;
```

## 3. Create SPFILE from the PFILE

After dropping the database, recreate the SPFILE from the previously created PFILE:

```sql
sqlplus / as sysdba

create spfile from pfile='/tmp/pfile.ora';
startup nomount;
```

## 4. Start Database Recovery

Use RMAN to duplicate the database for standby:

```sql
rman target sys@DWHPRI auxiliary sys@DWHDG

duplicate target database for standby from active database dorecover nofilenamecheck;
```

## 5. Manage Standby Recovery

Once the recovery process is complete, start managed recovery mode:

```sql
alter database recover managed standby database disconnect from session;
```

**Note:** If you encounter errors, try shutting down the database and restarting it in mount mode before retrying.

## 6. Verify Archive Log Synchronization

Run the following query to check if the standby database is synchronized with the primary:

```sql
select * from gv$archive_dest_status where dest_id in (1,2);
```

If the `GAP_STATUS` column displays **"NO GAP"** , the database is synchronized and ready for use. Otherwise, wait until the **"NO GAP"** status is achieved.

## Warning

Do not proceed with the steps below until the conditions above are satisfied.

## 7. Final Standby Commands

Once synchronization is confirmed, execute the following commands:

```sql
alter database recover managed standby database cancel;
alter database open read only;
alter database recover managed standby database using current logfile disconnect from session;
```
