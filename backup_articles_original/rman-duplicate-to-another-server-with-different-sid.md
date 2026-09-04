---
title: "RMAN Duplicate To Another Server With Different SID"
description: "Cloning MYDBPROD → MYDBTEST with RMAN DUPLICATE Sometimes we need a quick, up‑to‑date copy of production for troubleshooting or functional testing. The..."
pubDate: 2025-04-29
updatedDate: 2025-05-12
tags: ["Backup & DR", "Oracle", "Restore", "RMAN"]
featured: false
readingTime: "1 dk okuma"
---

## Cloning MYDBPROD → MYDBTEST with `RMAN DUPLICATE`

Sometimes we need a quick, up‑to‑date copy of production for troubleshooting or functional testing. The fastest route is **RMAN duplicate from active database** , which streams the data files over the network—no backup & restore cycle required.

**Environment snapshot**  
oracle1 → **production** server (SID **MYDBPROD**)  
oracle2 → **test** server (SID **MYDBTEST**)  
Database names: `MYDBP` (prod) → `MYDBT` (test)  
OS: **Oracle Linux 8**  
SELinux Permissive, firewalld disabled.  
Only the Oracle binaries are installed on the test host—no database.

### 1 Configure the listener on the _test_ server

```text
LISTENER =
  (DESCRIPTION_LIST =
    (DESCRIPTION =
      (ADDRESS = (PROTOCOL = TCP)(HOST = oracle2.localdomain)(PORT = 1521))
    )
  )

SID_LIST_LISTENER =
  (SID_LIST =
    (SID_DESC =
      (ORACLE_HOME = /u01/app/oracle/product/19.0.0/dbhome_1)
      (SID_NAME    = MYDBTEST)
    )
  )
```

 

Start (or reload) it:

```text
lsnrctl start listener
```

 

### 2 Add `tnsnames.ora` entries on _prod_

```text
# ── MYDBPROD ───────────────────────────
MYDBPROD =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = oracle1.localdomain)(PORT = 1521))
    (CONNECT_DATA =
      (SERVER = DEDICATED)
      (SERVICE_NAME = MYDBPROD)
    )
  )

# ── MYDBTEST ───────────────────────────
MYDBTEST =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = oracle2.localdomain)(PORT = 1521))
    (CONNECT_DATA =
      (SERVER = DEDICATED)
      (SERVICE_NAME = MYDBTEST)
    )
  )
```

 

Verify connectivity:

```text
tnsping MYDBTEST
```

 

### 3 Ship `pfile` and password file to the test host

```sql
-- on oracle1 (prod)
CREATE PFILE='/tmp/pfile_mydbp.ora' FROM SPFILE;
EXIT;
```

 

```sql
scp /tmp/pfile_mydbp.ora oracle@oracle2:$ORACLE_HOME/dbs
scp $ORACLE_HOME/dbs/orapwMYDBPROD \
    oracle@oracle2:$ORACLE_HOME/dbs/orapwMYDBTEST

# (or create a fresh file if none exists)
orapwd file=$ORACLE_HOME/dbs/orapwMYDBTEST force=y
```

 

### 4 Edit the copied `pfile` on oracle2

Change `MYDBP` → `MYDBT`, adjust paths, and add the name‑conversion rules:

```text
MYDBT.__oracle_base = '/u01/app/oracle'
...
*.control_files         = '/u02/oradatatest/MYDBTEST/control01.ctl','/u02/oradatatest/MYDBTEST/control02.ctl'
*.db_name               = 'MYDBT'
*.db_unique_name        = 'MYDBTEST'
...
*.db_file_name_convert  = '/u02/oradata/MYDBPROD','/u02/oradatatest/MYDBTEST'
*.log_file_name_convert = '/u02/oradata/MYDBPROD','/u02/oradatatest/MYDBTEST'
```

 

### 5 Create the required directories

```text
mkdir -p /u01/app/oracle/admin/MYDBTEST/adump
mkdir -p /u02/oradatatest/MYDBTEST
```

 

### 6 Start the auxiliary instance in `NOMOUNT`

```bash
export ORACLE_SID=MYDBTEST
sqlplus / as sysdba
STARTUP NOMOUNT pfile='$ORACLE_HOME/dbs/pfile_mydbt.ora';
CREATE SPFILE FROM PFILE='$ORACLE_HOME/dbs/pfile_mydbt.ora';
SHUTDOWN IMMEDIATE;
STARTUP NOMOUNT;
```

 

### 7 Kick off the duplicate from the production host

```sql
rman target sys auxiliary sys@MYDBTEST
```

 

Provide the same SYS password for both prompts, then at the `RMAN>` prompt run:

```text
DUPLICATE TARGET DATABASE TO 'MYDBT'
  FROM ACTIVE DATABASE
  NOFILENAMECHECK;
```

 

RMAN streams the control file, datafiles, and redo, adjusts the `DBID`, and finally opens the new test database.

* * *

© 2025 Your‑Name‑or‑Company. Feel free to share or adapt with attribution.
