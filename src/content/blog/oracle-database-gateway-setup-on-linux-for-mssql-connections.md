---
title: "Oracle Database Gateway Setup On Linux (For MSSQL Connections)"
description: "Step-by-step setup and configuration guide for Oracle Database Gateway for SQL Server (dg4msql) on Linux."
pubDate: 2024-02-02
tags: ["Database", "Gateway", "Linux", "SQL Server", "Oracle"]
featured: false
readingTime: "2 dk okuma"
---

Follow these steps to connect Oracle Database to a remote Microsoft SQL Server via Oracle Database Gateway (`dg4msql`).

### 1. Download & Run Installer
Download the Oracle Database Gateway version matching your database release. Run the GUI installer:
- Ensure `ORACLE_BASE` matches your existing database base.
- `ORACLE_HOME` must be in a distinct directory from the database engine:

```text
Database ORACLE_HOME: /oracle/db/19/dbhome_1
Gateway  ORACLE_HOME: /oracle/db/19/sql_gateway
```

### 2. Configure Gateway Port & Instance
During GUI setup, assign a dedicated port for the gateway listener (e.g. `1528`). Enter the target MSSQL server IP, port, and database name.

### 3. Configure `init<SID>.ora`
Navigate to the gateway admin directory, copy the template init file, and configure it for your target MSSQL database (e.g., `QADB`):

```bash
cd /oracle/db/19/sql_gateway/dg4msql/admin
cp initdg4msql.ora initQADB.ora
vi initQADB.ora
```

Add your connection details:

```ini
# HS init parameters
HS_FDS_CONNECT_INFO=[<targetserver>]:<targetport>//QADB
```

### 4. Configure Gateway `listener.ora`
In the gateway's `listener.ora`, add the SID description:

```ini
SID_LIST_LISTENER_GATEWAY =
  (SID_LIST =
    (SID_DESC =
      (SID_NAME = QADB)
      (ORACLE_HOME = /oracle/db/19/sql_gateway)
      (ENVS = "LD_LIBRARY_PATH=/oracle/db/19/sql_gateway/dg4msql/driver/lib:/oracle/db/19/sql_gateway/lib")
      (PROGRAM = /oracle/db/19/sql_gateway/bin/dg4msql)
    )
    (SID_DESC =
      (SID_NAME = MYDBLINK)
      (ORACLE_HOME = /oracle/db/19/sql_gateway)
      (ENVS = "LD_LIBRARY_PATH=/oracle/db/19/sql_gateway/dg4msql/driver/lib:/oracle/db/19/sql_gateway/lib")
      (PROGRAM = /oracle/db/19/sql_gateway/bin/dg4msql)
    )
  )
```

### 5. Configure Database `tnsnames.ora`
On the Oracle database host, edit `$ORACLE_HOME/network/admin/tnsnames.ora`:

```bash
cd $ORACLE_HOME/network/admin
vi tnsnames.ora
```

Append the TNS entry pointing to the gateway listener:

```ini
QADB =
  (DESCRIPTION =
    (ADDRESS_LIST =
      (ADDRESS = (PROTOCOL = TCP)(HOST = testserver.domain.local)(PORT = 1528))
    )
    (CONNECT_DATA =
      (SID = QADB)
    )
    (HS = OK)
  )

MYDBLINK =
  (DESCRIPTION =
    (ADDRESS_LIST =
      (ADDRESS = (PROTOCOL = TCP)(HOST = testserver.domain.local)(PORT = 1528))
    )
    (CONNECT_DATA =
      (SID = MYDBLINK)
    )
    (HS = OK)
  )
```

### 6. Restart the Gateway Listener
Export the gateway environment variables and restart the listener:

```bash
export ORACLE_HOME=/oracle/db/19/sql_gateway
export TNS_ADMIN=/oracle/db/19/sql_gateway/network/admin
export PATH=/oracle/db/19/sql_gateway/bin:$PATH

lsnrctl stop LISTENER_GATEWAY
lsnrctl start LISTENER_GATEWAY
```

### 7. Create Database Link & Test Query
Switch back to your Oracle Database environment, connect via SQL*Plus, and create the database link:

```sql
CREATE DATABASE LINK MYDBLINK 
CONNECT TO "testuser" IDENTIFIED BY "123456" 
USING 'MYDBLINK';
```

Test the remote table query:

```sql
SELECT COUNT(*) FROM "testtable"@MYDBLINK;
```
