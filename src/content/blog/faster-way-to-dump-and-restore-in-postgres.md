---
title: "Faster Way To Dump And Restore In Postgres"
description: "In general, people find dumping their whole databases in sever by pg_dumpall easily. But it takes too long since this tool is not utilized for using..."
pubDate: 2022-04-22
updatedDate: 2022-05-25
tags: ["PostgreSQL"]
featured: false
readingTime: "1 dk okuma"
---

In general, people find dumping their whole databases in sever by pg_dumpall easily. But it takes too long since this tool is not utilized for using resources efficiently. Thus, it's essential to uncompress and parallelize jobs while taking dumps in PostgreSQL databases via pg_dump. Example command:

```bash
pg_dump -Z0 -j 8 -Fd mydb -f dump_folder
```

```text
-Z0 means "no compress" and -j 8 means use 8 cores.
```

```text
When using pg_restore, similar approach is applied to maximize performance.
```

```bash
pg_restore -Fd -O -j 8  -d mydb dump_folder
```
