---
title: "Oracle Database Gateway Setup On Linux (For MSSQL Connections)"
description: "Here are the steps for MSSQL Connections. Download the Compatible Oracle Gateway Version depending on your database version. Setup via GUI. Be sure that..."
pubDate: 2024-02-02
tags: ["Database", "Gateway", "Linux", "SQL Server", "Oracle"]
featured: false
readingTime: "2 dk okuma"
---

Here are the steps for MSSQL Connections.

  * Download the Compatible Oracle Gateway Version depending on your database version.
  * Setup via GUI. Be sure that ORACLE_BASE is as same as existing database, but ORACLE_HOME should be different than database's ORACLE_HOME. 

database oracle_home: /oracle/db/19/dbhome_1  

gateway oracle_home: /oracle/db/19/sql_gateway  

  

  * Specify only for SQL Server tools as that you'll need, ignore the rest. You can enter MSSQL Database ip, servername, port and databasename.
  * On the next step where you have to configure listener, assign different port than existing database port (for example, GATEWAY_LISTENER)
  * After GUI Setup has been finished, copy the init file like below and edit it. For the example, QADB is our remote MSSQL database name.

[root@testserver admin]# cd /oracle/db/19/sql_gateway/dg4msql/admin

[root@testserver admin]#cp initdg4msql.ora initQADB.ora

[root@testserver admin]# vi initQADB.ora

  
  

#

# HS init parameters

#

HS_FDS_CONNECT_INFO=[<targetserver>]:<targetport>//QADB

  

  * Insert lines below at Gateway's listener.ora file. Take care that there is already a second link example, thus you may only insert only the first one.

  
  

SID_LIST_LISTENER_GATEWAY =

(SID_LIST =

(SID_DESC =

(SID_NAME=QADB)

(ORACLE_HOME=/oracle/db/19/sql_gateway)

(ENVS=LD_LIBRARY_PATH=/oracle/db/19/sql_gateway/dg4msql/driver/lib:/oracle

/db/19/sql_gateway/lib)

(PROGRAM=/oracle/db/19/sql_gateway/bin/dg4msql)

)

(

SID_DESC =

(SID_NAME=MYDBLINK)

(ORACLE_HOME=/oracle/db/19/sql_gateway)

(ENVS=LD_LIBRARY_PATH=/oracle/db/19/sql_gateway/dg4msql/driver/lib:

/oracle/db/19/sql_gateway/lib)

(PROGRAM=/oracle/db/19/sql_gateway/bin/dg4msql)

)

)

  
  

  * Edit the database's tnsnames.ora file.

oracle@testserver admin]$ cd $ORACLE_HOME/network/admin

[oracle@testserver admin]$ vi tnsnames.ora

  
  

  
  

QADB =

(DESCRIPTION =

(ADDRESS_LIST =

(ADDRESS = (PROTOCOL = TCP)(HOST = testserver.sm.gov.tr)(PORT = 1528))

)

(CONNECT_DATA =

(SID = QADB)

)

(HS = OK)

)

  
  

  
  

MYDBLINK =

(DESCRIPTION =

(ADDRESS_LIST =

(ADDRESS = (PROTOCOL = TCP)(HOST = testserver.sm.gov.tr)(PORT = 1528))

)

(CONNECT_DATA =

(SID = MYDBLINK)

)

(HS = OK)

)

  * Restart the gateway listener service. Before restart, you need to set some variables in order to run command.

[oracle@testserver admin]$ export ORACLE_HOME=/oracle/db/19/sql_gateway

[oracle@testserver admin]$ export TNS_ADMIN=/oracle/db/19/sql_gateway/network/admin

[oracle@testserver admin]$ export PATH=/oracle/db/19/sql_gateway/bin:$PATH

[oracle@testserver admin]$ lsnrctl stop LISTENER**_** GATEWAY

[oracle@testserver admin]$ lsnrctl start LISTENER**_** GATEWAY

  

  * Create database link over sqlplus after setting database variables via applying correct path variables.

[oracle@testserver ~]$ cd

[oracle@testserver ~]$ . .bash_profile

[oracle@testserver ~]$ sql

  
  

SQL*Plus: Release 19.0.0.0.0 - Production on Mon Feb 28 14:11:46 2022

Version 19.13.0.0.0

  
  

Copyright (c) 1982, 2021, Oracle. All rights reserved.

  
  

  
  

Connected to:

Oracle Database 19c Enterprise Edition Release 19.0.0.0.0 - Production

Version 19.13.0.0.0

  
  

SQL> create database link MYDBLINK connect to "testuser" identified by

"123456" using 'MYDBLINK';

  
  

Database link created.

  
  

SQL> select count(*) from "testtable "@MYDBLINK;

  
  

COUNT(*)

\----------

2

  
  

SQL>

SQL> exit

Disconnected from Oracle Database 19c Enterprise Edition Release 19.0.0.0.0 - Production

Version 19.13.0.0.0 

  

  * If you wanna add another database, you can start over from 6th step (listener.ora configuration) and apply similar steps.
