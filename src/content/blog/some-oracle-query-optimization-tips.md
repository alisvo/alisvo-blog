---
title: "Some Oracle Query Optimization Tips"
description: "Practical query optimization tips for Oracle Database, including REGEXP_LIKE and table collection functions."
pubDate: 2023-06-14
tags: ["Oracle", "SQL", "Optimization"]
featured: false
readingTime: "1 dk okuma"
---

### Tip 1: Using `REGEXP_LIKE` (Oracle 11g+)

Instead of chaining multiple `LIKE` statements with `OR`:

**Before (Inefficient):**
```sql
SELECT * FROM table_name 
WHERE col LIKE '%x%' OR col LIKE '%y%' OR col LIKE '%z%';
```

**After (Optimized):**
```sql
SELECT * FROM table_name 
WHERE REGEXP_LIKE(col, 'x|y|z');
```

---

### Tip 2: Generating In-Memory Row Sets

Instead of chaining multiple `UNION ALL` statements:

**Before (Verbose):**
```sql
SELECT 'abc' FROM dual
UNION ALL
SELECT 'bcd' FROM dual
UNION ALL
SELECT 'xyz' FROM dual;
```

**After (Compact):**
```sql
SELECT COLUMN_VALUE 
FROM TABLE(sys.odcivarchar2tolist('abc', 'bcd', 'xyz'));
```
