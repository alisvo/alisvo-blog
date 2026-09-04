---
title: "Psql Commands"
description: "psql Cheat-Sheet & Power User Guide 1 · Startup Sequence Environment – PGHOST , PGPORT , PGUSER , PGDATABASE are honoured. User profile – reads..."
pubDate: 2025-05-08
tags: ["Linux", "PostgreSQL", "Psql"]
featured: false
readingTime: "2 dk okuma"
---

# psql Cheat-Sheet & Power User Guide

* * *

## 1 · Startup Sequence

  * **Environment** – `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE` are honoured.
  * **User profile** – reads `$HOME/.psqlrc` (skip with `-X`).
  * **Single-shot execution**
    * `-f FILE` – run file then quit
    * `-c "COMMAND"` – inline SQL / meta cmd then quit
  * `--help` prints all options · `--version` shows build info.

## 2 · Line Editing & History

  * Arrow-up / down cycles past commands (libreadline).
  * Tab completion on Unix (SQL keywords, objects, filenames).

History & Buffer| Description  
---|---  
`\s`| Show command history (same as `~/.psql_history`)  
`\s FILE`| Save history to _FILE_  
`\e`| Edit current query buffer in `$EDITOR`, then execute  
`\e FILE`| Open _FILE_ in editor, then execute contents  
`\w FILE`| Write current buffer to _FILE_ (do _not_ execute)  
  
## 3 · Controlling Output

Command| Effect  
---|---  
`-o FILE` or `\o FILE`| Redirect query STDOUT → FILE (append with `\o >>FILE`)  
`\g FILE`| Execute buffer, send results to FILE  
`\watch <secs>`| Re-run the previous query every _n_ seconds (handy for monitoring)  
  
## 4 · Variables & Substitution

  * `\set name value` creates a variable.
  * Reference via `:name` in SQL _or_ `\echo :name`.
  * `\unset name` removes it.

Special Variable| Meaning  
---|---  
`AUTOCOMMIT`| `off` → wrap every stmt in an open transaction ; must `COMMIT`/`ROLLBACK` manually.  
`ENCODING`| Client encoding override (`UTF8`, `WIN1254`…)  
`HISTFILE`| Alternate history path  
`ON_ERROR_STOP`| Abort batch/pipe on first error (good for scripts)  
`PROMPT1/2`| Custom interactive prompt strings  
`VERBOSITY`| Error message detail (`default`|`verbose`|`terse`)  
  
## 5 · Conditional Blocks (for scripts)

```sql
\if :city = 'Edmonton'
  SELECT 'Hello YEG';
\elif :city = 'Calgary'
  SELECT 'Hello YYC';
\else
  \echo 'Unknown city'
\endif
```

 

## 6 · Information-Lookup Commands

Meta Cmd| Shortcut| What it Lists / Describes  
---|---|---  
`\d`| (none)| Tables, views, sequences, indexes  
`\d+`| | …with size & extra details  
`\dt`| | Tables only (`i s t v I S` flags per pattern)  
`\d mytable`| | Describe columns & constraints  
`\l`| `\list`| Databases in the cluster (`\l+` adds size)  
`\dn+`| | Schemas with ACL & comments  
`\df+`| | Functions with owner, language, source  
  
## 7 · Every-Day Meta Commands

Meta Cmd| Purpose  
---|---  
`\conninfo`| Show current host · port · DB · user  
`\q` / `Ctrl-D`| Quit psql  
`\cd [dir]`| Change working directory (`\! pwd` to view)  
`\!`_shellcmd_|  Run OS command without leaving psql  
  
## 8 · Putting It Together — Sample Session

```bash
$ psql               # env picks up PGHOST/PORT/USER
psql (16.2)
Type "help" for help.

postgres=# \set city Edmonton
postgres=# \if :city = 'Edmonton'
postgres-#   SELECT current_time;
postgres-# \endif
   current_time    
-------------------
 13:37:42.152643-06
(1 row)

postgres=# \o result.txt        -- redirect following output
postgres=# SELECT pg_size_pretty(pg_database_size(current_database()));
postgres=# \o                    -- back to stdout
postgres=# \watch 5             -- refresh every 5 s
```

 

> **Pro tip 🛠️** — Add 

```text
alias pglog="tail -f /var/lib/pgsql/16/data
```


