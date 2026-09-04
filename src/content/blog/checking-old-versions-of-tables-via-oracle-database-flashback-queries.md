---
title: "Checking Old Versions Of Tables Via Oracle Database Flashback Queries"
description: "Sometimes in production servers, you might need to check specific record(s) in order get older versions. Oracle has Flashback technology to revert your..."
pubDate: 2022-08-22
tags: ["Database", "Flashback", "Oracle"]
featured: false
readingTime: "1 dk okuma"
---

Sometimes in production servers, you might need to check specific record(s) in order get older versions. Oracle has Flashback technology to revert your datas to a specific SCN or timestamp. In order to use it, Flashback option should be enabled. After enabling, Oracle will start to save tables at specific times.

```sql
SELECT * FROM <table_name> AS OF TIMESTAMP(SYSDATE - INTERVAL '10' MINUTE);
```

The query above shows you the table's older version. You can also narrow results with a `WHERE` clause:

```sql
SELECT * FROM <table_name> AS OF TIMESTAMP(SYSDATE - INTERVAL '10' MINUTE) WHERE proc_id = 3843;
```
