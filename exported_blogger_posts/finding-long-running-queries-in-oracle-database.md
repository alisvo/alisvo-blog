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

select s.sql_text,sl.sid,sl.target||'-'||sl.opname Target,sl.totalwork,sl.sofar,sl.time_remaining Seconds_remaining,sl.elapsed_seconds,sl.sql_id,sl.username from v$session_longops sl,v$sql s,v$session se where s1.sid=se.sid and se.sql_id=s.sql_id and totalwork!=0 and sofar<>totalwork;
