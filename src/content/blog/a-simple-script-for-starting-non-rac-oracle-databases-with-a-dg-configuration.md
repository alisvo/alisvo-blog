---
title: "A Simple Script for Starting NON-RAC Oracle Databases with a DG configuration"
description: "Oracle Auto-Startup via Cron Use one of these two options to have both your primary and standby databases come up automatically on reboot. Paste the entire..."
pubDate: 2025-08-01
tags: ["Data Guard", "Oracle", "Startup"]
featured: true
readingTime: "1 dk okuma"
---

## Oracle Auto-Startup via Cron

Use one of these two options to have both your primary and standby databases come up automatically on reboot. Paste the entire snippet into your Blogger HTML editor.

## Option 1: Listener + Data Guard Broker Only

### Prerequisites

  * **Broker Start Enabled**
In each database as SYSDBA:

```sql
ALTER SYSTEM SET DG_BROKER_START=TRUE SCOPE=SPFILE;
```

 Then restart so the Broker daemon comes up with the instance.
  * **Listener Configuration**
Make sure your `listener.ora` has the proper service entries for both primary and standby. Verify it can be started manually:

```bash
lsnrctl status
lsnrctl start
```

### Crontab Entry

```bash

# As user oracle (`sudo crontab -u oracle -e`)
@reboot /home/oracle/scripts/start_all.sh >> /home/oracle/scripts/start_all.log 2>&1
```

### Startup Script /home/oracle/scripts/start_all.sh

```bash
#!/bin/bash
. /home/oracle/scripts/setEnv.sh

# 1) Ensure listener is running
lsnrctl start

# 2) Use Data Guard Broker to start in the correct role
dgmgrl / <<EOF
STARTUP;
EXIT;
EOF
```

_Why it works:_
- The listener is up so DGMGRL can connect.
- `STARTUP;` at the Broker prompt opens the primary read-write, or the standby read-only with apply (if Active Data Guard is enabled).

## Option 2: Oracle’s `dbstart` Script

### Prerequisites

  * **`/etc/oratab` Entries**
Add each SID you want auto-started, ending with `:Y`. For example:

```text
ORCL:/u01/app/oracle/product/19.0.0/dbhome_1:Y
      DGSTBY:/u01/app/oracle/product/19.0.0/dbhome_1:Y
```

### Crontab Entry

```bash

# As user oracle (`sudo crontab -u oracle -e`)
@reboot /home/oracle/scripts/start_all.sh >> /home/oracle/scripts/start_all.log 2>&1
```

### Startup Script /home/oracle/scripts/start_all.sh

```bash
#!/bin/bash
. /home/oracle/scripts/setEnv.sh

export ORAENV_ASK=NO
. oraenv
export ORAENV_ASK=YES

# dbstart reads /etc/oratab and starts instances & listeners
dbstart $ORACLE_HOME
```

_Why it works:_
- `oraenv` sets up environment variables.
- `dbstart` opens the primary read-write and the standby in read-only apply mode (if ADG is on) based on your `/etc/oratab` configuration.

## Verification & Logging

After reboot, run:

```bash
tail -n 50 /home/oracle/scripts/start_all.log
dgmgrl / "SHOW CONFIGURATION;"
dgmgrl / "SHOW DATABASE <STANDBY_DB_UNQNAME> STATUS;"
```
