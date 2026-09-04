---
title: "How To Move Datafiles In Oracle 11gR2"
description: "Oracle 11gR2 üzerinde kullanıcı veya sistem veri kütüklerini (datafiles) kontrol dosyası ile senkron şekilde yeni bir dizine taşıma rehberi."
pubDate: 2025-02-03
tags: ["Database", "Datafile", "Move", "Oracle"]
featured: false
readingTime: "2 dk okuma"
---

# How to Move (Rename) an Oracle Datafile to a New Folder in Oracle 11g

When you accidentally create a datafile in the wrong folder, you can move it to the intended location. Unlike a regular file move, this process in Oracle 11g involves both operating system commands and an update to Oracle’s control file. Follow these steps carefully.

**Important:**

- **Backup:** Before you begin, ensure you have a current backup of your database or at least the affected tablespace.
- **Privileges:** You must have the appropriate administrative privileges (`SYSDBA`) to perform these operations.
- **Environment:** The steps differ slightly based on whether you’re dealing with user tablespaces or system-critical tablespaces.

## Step 1: Identify the Datafile

Start by confirming the file name and its current location. Connect to SQL*Plus or your preferred Oracle client and run:

```sql
SELECT file_name, tablespace_name, ROUND(bytes/1024/1024) AS size_mb 
FROM dba_data_files;
```

Review the output to locate the datafile you want to move and note its current path.

## Step 2: Prepare the Database

### Option A: For Non-Critical (User) Tablespaces

You can take just the affected tablespace offline:

```sql
ALTER TABLESPACE users OFFLINE;
```

### Option B: For System or Critical Tablespaces

For files in the `SYSTEM`, `SYSAUX`, `UNDO`, or other critical tablespaces, you need to shut down the database and restart it in `MOUNT` mode:

```sql
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
```

## Step 3: Move the Datafile at the OS Level

Using your operating system’s file commands, move the datafile from the current location to the new folder. For example, on a UNIX/Linux system:

```bash
mv /u01/app/oracle/oradata/ORCL/users01.dbf /u02/app/oracle/oradata/ORCL/users01.dbf
```

**Note:**

- Ensure that the new folder has the proper permissions (e.g., owned by user `oracle:oinstall`) and enough disk space.
- On Windows, you can use the File Explorer or the `move` command in Command Prompt.

## Step 4: Update Oracle’s Control File

After physically moving the file, you must update Oracle’s control file so it knows where to find the datafile. Run the following command in SQL*Plus:

```sql
ALTER DATABASE RENAME FILE '/u01/app/oracle/oradata/ORCL/users01.dbf' 
TO '/u02/app/oracle/oradata/ORCL/users01.dbf';
```

This command tells Oracle that the file has been moved to the new location.

## Step 5: Bring the Database or Tablespace Online

### If You Took Only the Tablespace Offline:

```sql
ALTER TABLESPACE users ONLINE;
```

### If You Shut Down the Entire Database:

```sql
ALTER DATABASE OPEN;
```

## Step 6: Verify the Change

Finally, verify that Oracle recognizes the new location by running:

```sql
SELECT file_name, status, tablespace_name 
FROM dba_data_files 
WHERE tablespace_name = 'USERS';
```

The output should show the new path for the datafile with status `AVAILABLE` or `ONLINE`.

## Recap

1. **Identify the datafile:** Check the current location and tablespace.
2. **Prepare the database:**
   - For user tablespaces, take the tablespace offline.
   - For system-critical tablespaces, shut down the database and start it in `MOUNT` mode.
3. **Move the file at the OS level:** Use OS commands (`mv`) to relocate the file.
4. **Update the control file:** Use `ALTER DATABASE RENAME FILE` to inform Oracle of the new location.
5. **Bring the database or tablespace back online:** Open the tablespace or the entire database.
6. **Verify the move:** Confirm the new location with a query.
