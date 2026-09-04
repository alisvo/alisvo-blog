---
title: "Oracle Database Upgrade With OPatch Tool (RHEL/Centos/OEL)"
description: "Follow these steps to upgrade an Oracle Database using the OPatch tool: 1. Download and Prepare Files Download the patch you want to install along with the..."
pubDate: 2022-02-14
updatedDate: 2024-12-18
tags: ["Database", "Opatch", "Oracle"]
featured: false
readingTime: "1 dk okuma"
---

Follow these steps to upgrade an Oracle Database using the OPatch tool:

## 1. Download and Prepare Files

Download the patch you want to install along with the latest OPatch tool from Oracle's website. Transfer all downloaded files to the `/tmp/` directory, and unzip them. Ensure the correct permissions and ownership are set:

```bash
chown -R oracle:oinstall p26710464_122010_Linux-x86-64.zip
chown -R oracle:oinstall p6880880_122010_Linux-x86-64.zip
unzip p26710464_122010_Linux-x86-64.zip
unzip p6880880_122010_Linux-x86-64.zip
```

## 2. Replace the OPatch Folder

Replace the current OPatch folder inside the Oracle database files with the new one:

```bash
cd $ORACLE_HOME
cp -R OPatch OPatch_yedek # Backup current OPatch folder.
rm -rf OPatch
cp -R /tmp/Opatch .
```

Verify the OPatch version and list applied patches:

```bash
cd OPatch
./opatch lspatches
```

## 3. Check for Conflicts

Navigate to the patch folder and run the following command to check for conflicts before starting the upgrade:

```bash
cd /tmp/26710464/
$ORACLE_HOME/OPatch/opatch prereq CheckConflictAgainstOHWithDetail -ph .
```

## 4. Shutdown Services

Shutdown the database and listener services before applying the patch. Follow the steps based on your setup:

### a) Without Standby

```sql
sqlplus / as sysdba
shutdown immediate;
exit;
lsnrctl stop
```

### b) With Standby

#### b1) Primary Database

  * Stop log shipping:

```sql
ALTER SYSTEM SET log_archive_dest_state_2='DEFER';
```

  * Shutdown database services and stop all listeners:

```bash
SHU IMMEDIATE;
lsnrctl stop
lsnrctl stop
```

#### b2) Standby Database

  * Stop MRP services:

```sql
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;
```

  * Shutdown database services and stop all listeners:

```bash
SHU IMMEDIATE;
lsnrctl stop
lsnrctl stop
```

## 5. Apply the Patch

Run the following command to apply the patch:

```bash
cd /tmp/26710464/
$ORACLE_HOME/OPatch/opatch apply
```

## 6. Restart Services

### a) Without Standby

```sql
sqlplus / as sysdba
startup;
exit;
lsnrctl start
```

### b) With Standby

#### b1) Standby Database

  * Start listeners and database services:

```sql
lsnrctl start
lsnrctl start
sqlplus / as sysdba
startup nomount;
alter database mount standby database;
alter database open read only;
alter database recover managed standby database disconnect from session;
```

  * To enable real-time apply:

```sql
alter database recover managed standby database using current logfile disconnect from session;
```

#### b2) Primary Database

  * Start listeners and database services:

```sql
lsnrctl start
lsnrctl start
sqlplus / as sysdba
startup;
ALTER SYSTEM SET log_archive_dest_state_2='ENABLE';
exit;
```

## 7. Apply Datapatch

Run the `datapatch` command on the primary database. (No need to apply `datapatch` on the standby server.)

```text
cd /tmp/26710464/
$ORACLE_HOME/OPatch/datapatch -verbose
```

## 8. Verify the Patch

Finally, verify the applied patches:

```bash
cd $ORACLE_HOME/OPatch/
./opatch lspatches
```

You can be sure of datapatches applied:

```sql
SELECT * FROM dba_registry_sqlpatch;
```

 - --

## Conclusion

By following these steps, you can safely and efficiently upgrade your Oracle database using the OPatch tool.
