---
title: "How to Find Similar Records in Oracle/Postgresql Database?"
description: "Sometimes we may need to find some similar data (not exact one) regarding to our needs. For example, one digit of the phone number may have been registered..."
pubDate: 2022-05-25
tags: ["Oracle", "PostgreSQL"]
featured: false
readingTime: "1 dk okuma"
---

Sometimes we may need to find some similar data (not exact one) regarding to our needs. For example, one digit of the phone number may have been registered incorrectly.So how can we find it? From the classical point of view, we need to combine all possibilities. But we don't have to. But RDBMS' have some solutions for it.

\- For Oracle, you can use util_match.EDIT_DISTANCE function. Here is an example:

```sql
select name,surname,utl_match.EDIT_DISTANCE('5822182911',phone) from HR.PERSONEL where utl_match.EDIT_DISTANCE('5822182911',phone)<=2
```

This looks for phone records that has only 2 different numbers (in the right order of course) from the original value (5822182911). Some other kind of functions are available at Oracle, according to your needs.

\- PostgreSQL has also a useful extension, named **fuzzystrmatch.** It also has some useful functions for detecting similar records. An example is below:

```sql
SELECT levenshtein('FRANCE', 'FRANCOL'); --This returns "2" as an int value
```


