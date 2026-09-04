---
title: "AUDIT Table Cleaning"
description: "1. Identify Large Segments in the SYSTEM Tablespace Before deleting records, you may want to identify which segments occupy the most space in the SYSTEM..."
pubDate: 2024-11-07
tags: ["Database", "DBA"]
featured: false
readingTime: "1 dk okuma"
---

## 1\. Identify Large Segments in the SYSTEM Tablespace

Before deleting records, you may want to identify which segments occupy the most space in the `SYSTEM` tablespace. Run the following SQL command:

```sql
SET PAGES 999
SET LINES 300
COL OWNER FOR A10 
COL SEGMENT_NAME FOR A20 
COL SEGMENT_TYPE FOR A15 
COL MB FOR 9999999

SELECT OWNER,
       SEGMENT_NAME,
       SEGMENT_TYPE,
       ROUND(BYTES/1024/1024) MB 
FROM
       DBA_SEGMENTS
WHERE
       TABLESPACE_NAME='SYSTEM' 
ORDER BY BYTES DESC
FETCH FIRST 5 ROWS ONLY;
```

 

## 2\. Count Audit Records Older Than 180 Days

To estimate the number of audit records that are older than 180 days, use this query:

```sql
SELECT COUNT(*) 
FROM SYS.AUD$ 
WHERE ntimestamp# < SYSDATE - 180;
```

 

## 3\. Delete Audit Records in Batches

To prevent undo tablespace issues during deletion, remove records in smaller batches. Use the following PL/SQL block:

```sql
DECLARE
    v_limit NUMBER := 10000; -- Define batch size
BEGIN
    LOOP
        DELETE FROM SYS.AUD$ 
        WHERE ntimestamp# < SYSDATE - 180 
        AND ROWNUM <= v_limit;
        EXIT WHEN SQL%ROWCOUNT = 0;
        COMMIT;
    END LOOP;
END;
/
```

 

## 4\. Notes and Recommendations

  * Always take a backup of the database before performing bulk deletions.
  * Monitor the undo tablespace during deletion to ensure it does not run out of space.
  * Adjust the `v_limit` variable based on your system's capacity and performance.
  * After cleaning up, consider purging or archiving old audit logs periodically to avoid similar issues in the future.

**Tip:** Regularly monitor the size of `SYS.AUD$` and implement an automated cleanup job to manage its growth.
