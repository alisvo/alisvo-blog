---
title: "Backup Recovery Scenarios"
description: "-----taking full backup (compressed) ------------ RUN { ALLOCATE CHANNEL ch1 DEVICE TYPE DISK FORMAT '/backup/%U'; ALLOCATE CHANNEL ch2 DEVICE TYPE DISK..."
pubDate: 2024-03-17
updatedDate: 2024-06-04
tags: ["Database", "DBA"]
featured: false
readingTime: "1 dk okuma"
---

**\-----taking full backup (compressed) ------------**

RUN

{

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

  

  

  

  

**\------- some datafiles are missing, full backup available -------**

rman target /

  

sql 'startup mount';

  

list backup of database summary;

  

\--Buradaki tag bilgisi alınır ve restore başlatılır.

  

RESTORE DATABASE from tag TAG20240317T180940;

  

RECOVER DATABASE;

  

\--

  

RMAN-06054: media recovery requesting unknown archived log for thread 1 with sequence 126 and starting SCN of 2605758

  

\--

If you get an error like above, run the command below:

  

recover database until sequence 126;

  

alter database open resetlogs;

  

  

**\------no datafile & control files, full backup exists---------**

  

rman target /

sql 'startup nomount';

  

\-- controlfile backup neredeyse oradan control file'lar restore edilir.

  

restore controlfile from '/fra/MYDB1/autobackup/2024_03_17/o1_mf_s_1163884939_lzgf6vmq_.bkp';

  

sql 'alter database mount';

list backup of database summary;

  

\--Get the tag info and initiate restore.

  

RESTORE DATABASE from tag TAG20240317T180940;

  

RECOVER DATABASE;

  

\--

RMAN-06054: media recovery requesting unknown archived log for thread 1 with sequence 126 and starting SCN of 2605758

\--

If you get an error like above, run the command below:

recover database until sequence 126;

  

alter database open resetlogs;
