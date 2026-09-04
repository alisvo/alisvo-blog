---
title: "Oracle Database 19c Switchover Steps"
description: "Database Switchover Steps 1. Pre-operation Steps Check archive logs on both the primary and standby servers: Primary: ___CODE_BLOCK_0___ Standby:..."
pubDate: 2024-11-11
tags: ["Data Guard", "Oracle", "Switchover"]
featured: false
readingTime: "1 dk okuma"
---

# Database Switchover Steps

## 1\. Pre-operation Steps

  * Check archive logs on both the primary and standby servers:
    * **Primary:**

```sql
SELECT thread#, MAX(sequence#) "Last Primary Seq Generated"
FROM gv$archived_log val, gv$database vdb
WHERE val.resetlogs_change# = vdb.resetlogs_change#
GROUP BY thread# ORDER BY 1;
```

 
    * **Standby:**

```sql
SELECT thread#, MAX(sequence#) "Last Standby Seq Received"
FROM gv$archived_log val, gv$database vdb
WHERE val.resetlogs_change# = vdb.resetlogs_change#
GROUP BY thread# ORDER BY 1;
```

 
  * Verify the last applied log sequence:

```sql
SELECT thread#, MAX(sequence#) "Last Standby Seq Applied"
FROM gv$archived_log val, gv$database vdb
WHERE val.resetlogs_change# = vdb.resetlogs_change#
AND val.applied IN ('YES', 'IN-MEMORY')
GROUP BY thread# ORDER BY 1;
```

 
  * Verify initialization parameters:

Ensure the following parameters are correctly configured:

```sql
SELECT name, value
FROM v$parameter
WHERE UPPER(name) IN ('DB_NAME', 'DB_UNIQUE_NAME', 'FAL_CLIENT', 
                      'FAL_SERVER', 'LOG_ARCHIVE_CONFIG', 
                      'LOG_ARCHIVE_DEST_2', 'LOG_ARCHIVE_DEST_STATE_2', 
                      'LOG_ARCHIVE_DEST_3', 'LOG_ARCHIVE_DEST_STATE_3',
                      'REMOTE_LOGIN_PASSWORDFILE')
ORDER BY name;
```

 
    * `DB_NAME`: The name of the database instance.
    * `DB_UNIQUE_NAME`: A unique identifier for the database, ensuring differentiation between primary and standby databases.
    * `FAL_CLIENT`: Specifies the database requesting archive log gaps to be resolved.
    * `FAL_SERVER`: Identifies the server providing missing archive logs.
    * `LOG_ARCHIVE_CONFIG`: Defines the Data Guard configuration, including primary and standby roles.
    * `LOG_ARCHIVE_DEST_2`: Specifies the archive destination for the standby database.
    * `LOG_ARCHIVE_DEST_STATE_2`: Controls the state (enabled/disabled) of the second archive destination.
    * `LOG_ARCHIVE_DEST_3`: Additional archive destination for multi-standby setups.
    * `LOG_ARCHIVE_DEST_STATE_3`: Controls the state of the third archive destination.
    * `REMOTE_LOGIN_PASSWORDFILE`: Ensures password file authentication is used for remote connections.

**Note:** Ensure Data Guard is functioning. If logs are not being written, restart standby: 

```text
SQL> ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;
SQL> ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT;
```

 

## 2\. Switchover Steps

    * Verify switchover readiness on the primary database:

```text
ALTER DATABASE SWITCHOVER TO <standby db_name> VERIFY;
```

 
    * Perform the switchover:

```text
ALTER DATABASE SWITCHOVER TO <standby db_name>;
```

 
    * Open the new primary database:

```text
ALTER DATABASE OPEN;
```

 

## 3\. Post-switchover Steps

    * On the primary, verify logs and create an archive log:

```sql
ALTER SYSTEM ARCHIVE LOG CURRENT;
SELECT dest_id, error, status FROM v$archive_dest WHERE dest_id=2;
```

 
    * On the standby, verify logs and processes:

```sql
SELECT MAX(sequence#), thread# FROM v$archived_log GROUP BY thread#;
```

 

**Tip:** Test data flow by inserting data into a test table to confirm proper replication.
