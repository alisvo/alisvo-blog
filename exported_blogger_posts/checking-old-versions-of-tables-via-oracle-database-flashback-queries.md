---
title: "Checking Old Versions Of Tables Via Oracle Database Flashback Queries"
description: "Sometimes in production servers, you might need to check specific record(s) in order get older versions. Oracle has Flashback technology to revert your..."
pubDate: 2022-08-22
tags: ["Database", "Flashback", "Oracle"]
featured: false
readingTime: "1 dk okuma"
---

Sometimes in production servers, you might need to check specific record(s) in order get older versions. Oracle has Flashback technology to revert your datas to a specific SCN or timestamp. In order to use it, Flashback option should be enabled. After enabling, Oracle will start to save tables at specific times.

select * from <table_name> as of timestamp(sysdate - interval '10' minute)

The query above shows you the table's older version. You can also narrow results with WHERE clause:

select * from <table_name> as of timestamp(sysdate - interval '10' minute) where proc_id=3843
