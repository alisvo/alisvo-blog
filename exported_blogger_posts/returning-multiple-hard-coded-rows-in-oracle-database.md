---
title: "Returning Multiple Hard-Coded Rows in Oracle Database"
description: "Sometimes dummy and hard-coded vales might be needed for testing or some other purposes. We can return single rows easily with 'select ...... from dual'...."
pubDate: 2022-05-25
tags: ["Oracle"]
featured: false
readingTime: "1 dk okuma"
---

Sometimes dummy and hard-coded vales might be needed for testing or some other purposes. We can return single rows easily with "select ...... from dual". But if we want several rows, special functions might be useful for it since "unioning" rows are not really useful and simple.

Simple example is below:

```sql
select column_value "mail" from table(sys.odcivarchar2list('alex@mymail.com','sally@mymail.com','campbell@mymail.com');
```

This will return a column with three rows as intended.
