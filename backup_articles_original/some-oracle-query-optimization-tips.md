---
title: "Some Oracle Query Optimization Tips"
description: "Tip 1: Using REGEXP_LIKE (Oracle 11g+) Worse: select * from table where a like '%x%' or a like '%y%' or a like '%z%'; Better: select * from table where..."
pubDate: 2023-06-14
tags: ["Oracle"]
featured: false
readingTime: "1 dk okuma"
---

**Tip 1: Using REGEXP_LIKE (Oracle 11g+)**

Worse:

select * from table where a like '%x%' or a like '%y%' or a like '%z%';

Better:

select * from table where regexp_like('x|y|z');

**Tip 2: Generating Multiple Columns**

Worse:

select 'abc' from dual

union all

select 'bcd' from dual 

union all 

select 'xyz' from dual;

Better:

select column_value from table(sys.odcivarchar2tolist('abc','bcd','xyz'));
