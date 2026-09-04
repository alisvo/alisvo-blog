---
title: "PostgreSQL Password File"
description: "When we need to connect somewhere via cron job, batch script etc. , .pgpass file can be really useful for authorization. Connection information is saved..."
pubDate: 2022-06-14
tags: ["Linux", "Pg_Basebackup", "PostgreSQL"]
featured: false
readingTime: "1 dk okuma"
---

When we need to connect somewhere via cron job, batch script etc. , .pgpass file can be really useful for authorization. Connection information is saved within the .pgpass file, allowing us to connect to database without password prompts.

General text format:

```text
host:port:db_name:user_name:password
```

You can also put asterisk(*) to first 3 parameters to match anything.

Example .pgpass file content:

```text
192.168.1.40:5432:postgres:myadmin:On3GoodP@ssW0rD
```

Running commands to activate for pg_basebackup (Linux Environment):

$ echo "192.168.1.40:5432:*:rep_user:V3ryStr0ngP4ss" > /var/lib/pgsql/.pgpass

$ chown postgres.postgres /var/lib/pgsql/.pgpass

$ chmod 0600 /var/lib/pgsql/.pgpass

$ su - postgres

$ /usr/pgsql-14/bin/pg_basebackup -h 192.168.1.40 -D /pgdata/14/data/ -U rep_user -p 5432 -v -P --wall-method=stream --write-recovery-conf
