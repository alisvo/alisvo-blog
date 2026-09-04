---
title: "Finding User Objects with Tablespaces in Oracle Database"
description: "The query below shows what tablespaces does user have files and what are the total sizes of their objects in there: SELECT o.owner, s.tablespace_name,..."
pubDate: 2024-06-26
tags: ["Database", "Oracle"]
featured: false
readingTime: "1 dk okuma"
---

The query below shows what tablespaces does user have files and what are the total sizes of their objects in there:

  

SELECT o.owner,

s.tablespace_name, FLOOR(SUM(s.bytes) / (1024 * 1024)) AS size_mb 

FROM 

dba_objects o

JOIN 

dba_segments s

ON 

o.object_name = s.segment_name

AND o.owner = s.owner

group by o.owner,

s.tablespace_name

order by owner;
