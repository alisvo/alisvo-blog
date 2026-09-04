---
title: "Oracle 19c Dataguard Installation with DG Broker"
description: "Oracle 19c Physical Standby Creation & Management (RMAN Duplicate + Data Guard Broker) This article walks through building a physical standby using RMAN..."
pubDate: 2025-05-04
updatedDate: 2025-06-16
tags: ["Data Guard", "Oracle", "RMAN"]
featured: false
readingTime: "2 dk okuma"
---

# Oracle 19c Physical Standby Creation & Management (RMAN Duplicate + Data Guard Broker)

This article walks through building a **physical standby** using RMAN `DUPLICATE FROM ACTIVE DATABASE`, then managing switchover / failover with the Data Guard Broker. The commands were tested on _Oracle Linux 8_ with _Oracle Database 19c_.

* * *

## Assumptions

  * Two hosts (`oracle1.localdomain` & `oracle2.localdomain`) with Oracle 19c installed.
  * Primary instance runs on **oracle1** ; standby will be created on **oracle2**.
  * Listener port `1521` is reachable in both directions (check firewalls).
  * Primary DB name `MYDBPROD`; standby unique name `MYDBDG`.

## 1 – Primary Server Preparation

### 1.1 Switch to ARCHIVELOG & Force Logging

```sql
-- Check mode
SELECT log_mode FROM v$database;

-- If NOARCHIVELOG:
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;

-- Force logging
ALTER DATABASE FORCE LOGGING;
ALTER SYSTEM SWITCH LOGFILE;
```

 

### 1.2 Create Standby Redo Logs (SRLs)

Create _online redo groups + 1_ SRL per thread & size ≥ largest ORL.

```text
-- OMF environment
ALTER DATABASE ADD STANDBY LOGFILE THREAD 1 GROUP 10 SIZE 200M;
ALTER DATABASE ADD STANDBY LOGFILE THREAD 1 GROUP 11 SIZE 200M;
ALTER DATABASE ADD STANDBY LOGFILE THREAD 1 GROUP 12 SIZE 200M;
ALTER DATABASE ADD STANDBY LOGFILE THREAD 1 GROUP 13 SIZE 200M;

-- Non‑OMF (explicit paths)
ALTER DATABASE ADD STANDBY LOGFILE THREAD 1 GROUP 10 ('/u01/oradata/cdb1/standby_redo01.log') SIZE 200M;
...
```

 

### 1.3 Key Initialization Parameters

```sql
SHOW PARAMETER db_name;         -- MYDBPROD
SHOW PARAMETER db_unique_name; -- MYDBPROD

ALTER SYSTEM SET standby_file_management = AUTO;
```

 

## 2 – Network Configuration

### 2.1 TNS Entries (both servers)

```text
MYDBPROD =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = oracle1.localdomain)(PORT = 1521))
    (CONNECT_DATA = (SID = MYDBPROD))
  )

MYDBDG =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = oracle2.localdomain)(PORT = 1521))
    (CONNECT_DATA = (SID = MYDBPROD))
  )
```

 

### 2.2 Listener Configuration

Add a static SID entry for the broker (`_DGMGRL`) on both servers, then restart the listener.

```text
lsnrctl stop
lsnrctl start
```

 

## 3 – Standby Server Preparation

  1. Create `/tmp/initMYDBDG.ora` with:  
`*.db_name='MYDBPROD'`
  2. Create directories:

```text
mkdir -p /u02/oradatatest/MYDBDG
mkdir -p /u02/archivelog/MYDBDG
mkdir -p /u01/app/oracle/admin/MYDBDG/adump
mkdir -p /u02/fra
```

  3. Copy (or create) password file:  
`orapwd file=$ORACLE_HOME/dbs/orapwMYDBPROD password=<pwd> entries=10`

## 4 – RMAN Duplicate (Active)

### 4.1 Start Auxiliary Instance

```bash
export ORACLE_SID=MYDBPROD
sqlplus / as sysdba <<EOF
  STARTUP NOMOUNT PFILE='/tmp/initMYDBDG.ora';
EOF
```

 

### 4.2 Run Duplicate

```sql
rman TARGET sys@MYDBPROD AUXILIARY sys@MYDBDG

RUN {
DUPLICATE TARGET DATABASE
  FOR STANDBY
  FROM ACTIVE DATABASE
  DORECOVER
  SPFILE
    SET db_unique_name='MYDBDG'
    SET audit_file_dest='/u01/app/oracle/admin/MYDBDG/adump'
    SET db_file_name_convert='/u02/oradata/MYDBPROD','/u02/oradatatest/MYDBDG'
    SET log_file_name_convert='/u02/oradata/MYDBPROD','/u02/oradatatest/MYDBDG'
    SET log_archive_dest_1='LOCATION=USE_DB_RECOVERY_FILE_DEST VALID_FOR=(ALL_LOGFILES,ALL_ROLES) DB_UNIQUE_NAME=MYDBDG'
    SET db_recovery_file_dest='/u02/fra'
    SET db_recovery_file_dest_size='100G'
    SET job_queue_processes='0'
  NOFILENAMECHECK;
}
```

 

## 5 – Enable Data Guard Broker

```sql
-- On both databases
ALTER SYSTEM SET dg_broker_start = TRUE;

-- On primary
DGMGRL sys@MYDBPROD
CREATE CONFIGURATION my_dg_config AS
  PRIMARY DATABASE IS MYDBPROD \
  CONNECT IDENTIFIER IS MYDBPROD;
ADD DATABASE MYDBDG AS CONNECT IDENTIFIER IS MYDBDG;
ENABLE CONFIGURATION;

-- Quick status
SHOW CONFIGURATION;
SHOW DATABASE MYDBDG;
```

 

## 6 – Broker Operations

### 6.1 Start / Stop Apply & Transport

```text
-- Apply (standby)
EDIT DATABASE 'MYDBDG' SET STATE='APPLY-OFF';
EDIT DATABASE 'MYDBDG' SET STATE='APPLY-ON';

-- Transport (primary)
EDIT DATABASE 'MYDBPROD' SET STATE='TRANSPORT-OFF';
EDIT DATABASE 'MYDBPROD' SET STATE='TRANSPORT-ON';
```

 

Classic SQL equivalents:

```text
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE USING CURRENT LOGFILE DISCONNECT;
```

 

### 6.2 Switchover Example

```text
DGMGRL> SWITCHOVER TO MYDBDG;  -- make standby primary
DGMGRL> SWITCHOVER TO MYDBPROD; -- switch back
```

 

### 6.3 Failover & Re‑instate

```text
DGMGRL> FAILOVER TO MYDBDG;
-- New primary: MYDBDG

DGMGRL> REINSTATE DATABASE MYDBPROD;  -- requires Flashback ON
```

 

## 7 – Flashback Database

Ensure FRA is configured (`db_recovery_file_dest` & `_size`) then:

```text
ALTER DATABASE FLASHBACK ON;           -- primary
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;
ALTER DATABASE FLASHBACK ON;           -- standby
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE USING CURRENT LOGFILE DISCONNECT;
```

 

## 7 – Preventing Timeouts Because Of Firewall

Ensure that your sqlnet.ora file does include SQL_NET.EXPIRE_TIME parameter to a couple of minutes just to keep the connection alive. Some enviornments might cause timeouts.

* * *

🎉 **That’s it!** Your Oracle 19c Data Guard environment is ready for real‑time apply, switchover & failover testing.
