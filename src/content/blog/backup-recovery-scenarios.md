---
title: "Oracle Backup & Recovery Scenarios with RMAN"
description: "Common Oracle RMAN backup and disaster recovery scenarios: compressed full backup, missing datafiles, and lost control files."
pubDate: 2024-03-17
updatedDate: 2024-06-04
tags: ["Database", "DBA", "Oracle", "RMAN"]
featured: false
readingTime: "2 dk okuma"
---

### Scenario 1: Taking a Compressed Full Backup

Using 4 parallel channels to take a compressed full database backup including archivelogs:

```sql
RUN {
    ALLOCATE CHANNEL ch1 DEVICE TYPE DISK FORMAT '/backup/%U';
    ALLOCATE CHANNEL ch2 DEVICE TYPE DISK FORMAT '/backup/%U';
    ALLOCATE CHANNEL ch3 DEVICE TYPE DISK FORMAT '/backup/%U';
    ALLOCATE CHANNEL ch4 DEVICE TYPE DISK FORMAT '/backup/%U';

    BACKUP AS COMPRESSED BACKUPSET DATABASE PLUS ARCHIVELOG;

    RELEASE CHANNEL ch1;
    RELEASE CHANNEL ch2;
    RELEASE CHANNEL ch3;
    RELEASE CHANNEL ch4;
}
```

---

### Scenario 2: Missing Datafiles (Full Backup Available)

When specific datafiles are lost or corrupted but the control files are intact:

```bash
rman target /
```

```sql
SQL 'STARTUP MOUNT';

-- List available backups to get the tag name:
LIST BACKUP OF DATABASE SUMMARY;

-- Restore using the backup tag:
RESTORE DATABASE FROM TAG TAG20240317T180940;
RECOVER DATABASE;
```

If RMAN returns error:
```text
RMAN-06054: media recovery requesting unknown archived log for thread 1 with sequence 126 and starting SCN of 2605758
```

Recover until the available sequence number and open with `resetlogs`:

```sql
RECOVER DATABASE UNTIL SEQUENCE 126;
ALTER DATABASE OPEN RESETLOGS;
```

---

### Scenario 3: Lost Datafiles & Control Files (Full Backup Available)

When both datafiles and control files are missing:

```bash
rman target /
```

```sql
SQL 'STARTUP NOMOUNT';

-- Restore control file from autobackup:
RESTORE CONTROLFILE FROM '/fra/MYDB1/autobackup/2024_03_17/o1_mf_s_1163884939_lzgf6vmq_.bkp';

-- Mount the database with restored control file:
SQL 'ALTER DATABASE MOUNT';

-- Locate backup tag:
LIST BACKUP OF DATABASE SUMMARY;

-- Restore and recover:
RESTORE DATABASE FROM TAG TAG20240317T180940;
RECOVER DATABASE;
```

If you encounter `RMAN-06054` sequence error:

```sql
RECOVER DATABASE UNTIL SEQUENCE 126;
ALTER DATABASE OPEN RESETLOGS;
```
