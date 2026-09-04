---
title: "Finding User Objects with Tablespaces in Oracle Database"
description: "The query below shows what tablespaces does user have files and what are the total sizes of their objects in there."
pubDate: 2024-06-26
tags: ["Database", "Oracle", "SQL"]
featured: false
readingTime: "1 dk okuma"
---

The query below shows which tablespaces a user has objects in, along with their total sizes:

```sql
SELECT 
    o.owner,
    s.tablespace_name,
    FLOOR(SUM(s.bytes) / (1024 * 1024)) AS size_mb
FROM 
    dba_objects o
JOIN 
    dba_segments s
    ON o.object_name = s.segment_name
    AND o.owner = s.owner
GROUP BY 
    o.owner,
    s.tablespace_name
ORDER BY 
    owner;
```
