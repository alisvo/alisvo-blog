---
title: "Creating A Script That Fixes Unusable Indexes"
description: "Oracle veritabanında UNUSABLE durumdaki indeksleri tespit eden ve otomatik olarak REBUILD eden pratik SQL scripti."
pubDate: 2022-08-22
tags: ["Index", "Oracle", "Rebuild"]
featured: false
readingTime: "1 dk okuma"
---

```sql
SELECT 'ALTER INDEX ' || OWNER || '.' ||INDEX_NAME || ' REBUILD ' ||' TABLESPACE ' || TABLESPACE_NAME || ';'FROM DBA_INDEXESWHERE STATUS='UNUSABLE'UNIONSELECT 'ALTER INDEX ' || INDEX_OWNER || '.' ||INDEX_NAME ||' REBUILD PARTITION ' || PARTITION_NAME ||' TABLESPACE ' || TABLESPACE_NAME || ';'FROM DBA_IND_PARTITIONSWHERE STATUS='UNUSABLE'UNIONSELECT 'ALTER INDEX ' || INDEX_OWNER || '.' ||INDEX_NAME ||' REBUILD SUBPARTITION '||SUBPARTITION_NAME||' TABLESPACE ' || TABLESPACE_NAME || ';'FROM DBA_IND_SUBPARTITIONSWHERE STATUS='UNUSABLE';
```
