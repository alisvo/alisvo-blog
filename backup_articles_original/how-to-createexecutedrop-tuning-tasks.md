---
title: "How to Create/Execute/Drop Tuning Tasks"
description: "Oracle Tuning Advisor is a tool that can help DBA's to improve certain SQL queries. Here how you can use them: CREATE ___CODE_BLOCK_0___ EXECUTE..."
pubDate: 2023-08-24
tags: ["Advisor", "Oracle", "Performance", "Tuning"]
featured: false
readingTime: "1 dk okuma"
---

Oracle Tuning Advisor is a tool that can help DBA's to improve certain SQL queries. Here how you can use them:

  

**CREATE**

```sql
DECLARE
l_sql_tune_task_id VARCHAR2(100);
BEGIN
l_sql_tune_task_id := DBMS_SQLTUNE.create_tuning_task (
sql_id => '238djik018ja1',
scope => DBMS_SQLTUNE.scope_comprehensive,
time_limit => 600,
task_name => '238djik018ja1_tuning_task', description => 'Tuning task for sql id 238djik018ja1'); DBMS_OUTPUT.put_line('l_sql_tune_task_id: ' || l_sql_tune_task_id);
END;
/
```

**EXECUTE**

```text
EXEC DBMS_SQLTUNE.execute_tuning_task(task_name => '238djik018ja1_tuning_task');
```

  

##### GETTING REPORT

```sql
select dbms_sqltune.report_tuning_task('238djik018ja1_tuning_task') from dual;
```

  

**QUERY TASKS**

```sql
SELECT TASK_NAME, STATUS FROM DBA_ADVISOR_LOG;
```

#####   

##### DROP

```text
execute dbms_sqltune.drop_tuning_task('238djik018ja1_tuning_task');
```


