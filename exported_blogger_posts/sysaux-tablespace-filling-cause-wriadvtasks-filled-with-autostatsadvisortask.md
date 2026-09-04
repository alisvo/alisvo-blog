---
title: "SYSAUX Tablespace Filling , Cause: WRI$_ADV_TASKS filled with AUTO__STATS_ADVISOR_TASK"
description: "The SYSAUX tablespace might fill up with records from advisor tasks. Use the following steps to identify and resolve the issue. Step 1: Check SYSAUX Usage..."
pubDate: 2024-12-18
tags: ["Oracle", "Sysaux", "Tablespace"]
featured: false
readingTime: "2 dk okuma"
---

The SYSAUX tablespace might fill up with records from advisor tasks. Use the following steps to identify and resolve the issue.

## Step 1: Check SYSAUX Usage

```sql SELECT OCCUPANT_NAME, SPACE_USAGE_KBYTES FROM V$SYSAUX_OCCUPANTS ORDER BY SPACE_USAGE_KBYTES DESC; ``` ```sql SELECT TASK_NAME, COUNT(*) CNT FROM DBA_ADVISOR_OBJECTS GROUP BY TASK_NAME ORDER BY CNT DESC; ``` 

## Step 2: Backup and Clean Up

If the record numbers are too large, directly deleting from `WRI$_ADV_TASKS` can impact the UNDO tablespace. Follow these steps:

  1. **Check rows in`WRI$_ADV_OBJECTS` not related to Auto Stats Advisor Task:** ```sql SELECT * FROM WRI$_ADV_OBJECTS WHERE TASK_ID != (SELECT DISTINCT ID FROM WRI$_ADV_TASKS WHERE NAME='AUTO_STATS_ADVISOR_TASK'); ``` 
  2. **Create a backup table:** ```sql CREATE TABLE WRI$_ADV_OBJECTS_NEW AS SELECT * FROM WRI$_ADV_OBJECTS WHERE TASK_ID != (SELECT DISTINCT ID FROM WRI$_ADV_TASKS WHERE NAME='AUTO_STATS_ADVISOR_TASK'); ``` 
  3. **Truncate the table:** ```text TRUNCATE TABLE WRI$_ADV_OBJECTS; ``` 
  4. **Reinsert rows:** ```sql INSERT INTO WRI$_ADV_OBJECTS( "ID", "TYPE", "TASK_ID", "EXEC_NAME", "ATTR1", "ATTR2", "ATTR3", "ATTR4", "ATTR5", "ATTR6", "ATTR7", "ATTR8", "ATTR9", "ATTR10", "ATTR11", "ATTR12", "ATTR13", "ATTR14", "ATTR15", "ATTR16", "ATTR17", "ATTR18", "ATTR19", "ATTR20", "OTHER", "SPARE_N1", "SPARE_N2", "SPARE_N3", "SPARE_N4", "SPARE_C1", "SPARE_C2", "SPARE_C3", "SPARE_C4") SELECT "ID", "TYPE", "TASK_ID", "EXEC_NAME", "ATTR1", "ATTR2", "ATTR3", "ATTR4", "ATTR5", "ATTR6", "ATTR7", "ATTR8", "ATTR9", "ATTR10", "ATTR11", "ATTR12", "ATTR13", "ATTR14", "ATTR15", "ATTR16", "ATTR17", "ATTR18", "ATTR19", "ATTR20", "OTHER", "SPARE_N1", "SPARE_N2", "SPARE_N3", "SPARE_N4", "SPARE_C1", "SPARE_C2", "SPARE_C3", "SPARE_C4" FROM WRI$_ADV_OBJECTS_NEW; COMMIT; ``` 
  5. **Rebuild the indexes:** ```text ALTER INDEX WRI$_ADV_OBJECTS_IDX_02 REBUILD; ALTER INDEX WRI$_ADV_OBJECTS_IDX_01 REBUILD; ALTER INDEX WRI$_ADV_OBJECTS_PK REBUILD; ``` 

## Optional Steps

  1. **Drop the task if needed:** ```sql DECLARE v_tname VARCHAR2(32767); BEGIN v_tname := 'AUTO_STATS_ADVISOR_TASK'; DBMS_STATS.DROP_ADVISOR_TASK(v_tname); END; / ``` 
  2. **Reinitialize for future needs:** ```sql EXEC DBMS_STATS.INIT_PACKAGE(); ``` 
  3. **Adjust retention days:** ```text EXEC DBMS_ADVISOR.SET_TASK_PARAMETER( task_name => 'AUTO_STATS_ADVISOR_TASK', parameter => 'EXECUTION_DAYS_TO_EXPIRE', value => 20); ```
