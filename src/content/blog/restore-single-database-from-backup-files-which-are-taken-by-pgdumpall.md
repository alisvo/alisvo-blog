---
title: "Restore Single Database from Backup Files Which Are Taken by Pg_Dumpall"
description: "Normally, you can't restore a single database from a cluster backup that are taken via pg_dumpall.In order to achieve that, you can follow the steps below:..."
pubDate: 2023-09-15
tags: ["Backup & DR", "Pg_Dumpall", "PostgreSQL", "Restore"]
featured: false
readingTime: "1 dk okuma"
---

Normally, you can't restore a single database from a cluster backup that are taken via pg_dumpall.In order to achieve that, you can follow the steps below:

1- Create a script that greps specific database portion of the dump:

```bash
#!/bin/bash

    [ $# -lt 2 ] && { echo "Usage: $0 <postgresql dump> <dbname>"; exit 1; }

    sed  "/connect.*$2/,\$!d" $1 | sed "/PostgreSQL database dump complete/,\$d"
```

```text
2- Extract the portion  via example command below:
```

```text
sh onedbscript.sh full_dump.dmp MY_DATABASE > onlyonedatabase.dmp
```

```text
3- You may restore and test if it worked if you want:
```

```bash
psql -p <portnumber> -d MY_DATABASE < onlyonedatabase.dmp
```
