---
title: "Finding Long Running Queries in Oracle Database"
description: "It could be tricky to detect when your database slows down for no reason. At first, you should check system resources (CPU - RAM usage, network etc.) and if..."
pubDate: 2022-04-28
tags: ["Addm", "Oracle", "Query", "SQL"]
featured: false
readingTime: "1 dk okuma"
---

It could be tricky to detect when your database slows down for no reason. At first, you should check system resources (CPU - RAM usage, network etc.) and if find some bottlenecks, then go deeper. ADDM report should be useful for detecting most problem causes.

But it is also probable that some queries may be using server resources excessively. How to detect them? Well, there is one simple query to check that:

```sql
SELECT 
    s.sql_text,
    sl.sid,
    sl.target || '-' || sl.opname AS target,
    sl.totalwork,
    sl.sofar,
    sl.time_remaining AS seconds_remaining,
    sl.elapsed_seconds,
    sl.sql_id,
    sl.username
FROM 
    v$session_longops sl,
    v$sql s,
    v$session se
WHERE 
    sl.sid = se.sid
    AND se.sql_id = s.sql_id
    AND sl.totalwork != 0
    AND sl.sofar <> sl.totalwork;
```
