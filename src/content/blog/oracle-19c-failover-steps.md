---
title: "Oracle 19c Failover Steps"
description: "Oracle 19c Data Guard ortamlarında felaket anında standby veritabanını primary moda geçirme (Failover) operasyon adımları."
pubDate: 2024-11-11
tags: ["Data Guard", "Failover", "Oracle"]
featured: false
readingTime: "1 dk okuma"
---

* **Check the standby server:**

```sql
SQL> SELECT database_role FROM v$database;
```

  * **Stop the MRP process and switch to primary mode:**

```sql
SQL> RECOVER MANAGED STANDBY DATABASE CANCEL;
SQL> ALTER DATABASE RECOVER MANAGED STANDBY DATABASE FINISH;
SQL> ALTER DATABASE ACTIVATE STANDBY DATABASE;
SQL> ALTER SYSTEM SET LOG_ARCHIVE_DEST_STATE_2=DEFER SCOPE=BOTH SID='*';
```

  * **Restart the standby database and verify it is in primary mode:**

```sql
SQL> SHUTDOWN IMMEDIATE;
SQL> STARTUP;
SQL> SELECT database_role FROM v$database;
```

  * **For setups with two or more standby servers:**

Check the data flow between standby servers. If an issue occurs with `redirect_dml` mode, restart the standby servers to resolve the problem.

**Note:** Ensure the failover process is monitored carefully to avoid data inconsistencies.
