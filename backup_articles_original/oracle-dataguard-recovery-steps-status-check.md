---
title: "Oracle Dataguard Recovery Steps & Status Check"
description: "Steps below can be used to recover disconnected & unrecoverable standby databases. The commands below should be run on standby server. 1) Create pfile:..."
pubDate: 2024-02-27
tags: ["Database", "Data Guard", "Oracle"]
featured: false
readingTime: "2 dk okuma"
---

Steps below can be used to recover disconnected & unrecoverable standby databases. The commands below should be run on standby server.

  

  

1) Create pfile:

  

create pfile='/tmp/pfile.ora' from spfile;

  

  

2) Drop old database.

  

RMAN> startup mount;

RMAN> sql 'alter system enable restricted session';

RMAN> drop database including backups noprompt;

  

  

3) Create spfile from pfile.

  

sqlplus / as sysdba

  

create spfile from pfile='/tmp/pfile.ora';

  

startup nomount;

  

  

4) Start database recover operation.

  

rman target sys@primarydb auxiliary sys@stbydb (names coming from tnsnames.ora)

  

duplicate target database for standby from active database dorecover nofilenamecheck;

  

  

5) After recovery completed, run the command below:

alter database recover managed standby database disconnect from session;

  

Note: If you get an error, shutdown the database and re-mount it. (startup mount) 

  

  

6) Run the select below, if GAP_STATUS column equals to "NO GAP" then recover the database and start it . If not, wait until you see "NO GAP" .

  

select * from gv$archive_dest_status where dest_id in (1,2);

  

  

After all steps completed successfully, run the comands below.

  

alter database recover managed standby database cancel;

  

alter database open read only;

  

alter database recover managed standby database using current logfile disconnect from session;

  

\-------------------------------------

  

SELECT a.name,a.resetlogs_id, DECODE (a.thread#, 1, 'PRI NODE1', 'PRI NODE2') HOST, b.last_seq son_olusan,

a.applied_seq son_uygulanan, TO_CHAR (a.uygulanan_son_zaman, 'dd/mm/yyyy hh24:mi:ss') son_uygulama_zamani

FROM (SELECT name,resetlogs_id, thread#, MAX (sequence#) applied_seq, MAX (next_time) uygulanan_son_zaman

FROM gv$archived_log

WHERE applied = 'YES' and name in ('stby1','stby2') and resetlogs_id=(select max(resetlogs_id) from gv$archived_log)

and thread#=1 ----rac yapıdan çıkarıldığı için bu eklendi ##RAC e geçirilse bu kaldırılmalı

GROUP BY name,resetlogs_id, thread# ) a,

(SELECT name,resetlogs_id, thread#, MAX (sequence#) last_seq

FROM gv$archived_log where name in ('stby1','stby2') and resetlogs_id=(select max(resetlogs_id) from gv$archived_log)

GROUP BY name,resetlogs_id, thread# ) b

WHERE a.thread# = b.thread#

and a.name = b.name;
