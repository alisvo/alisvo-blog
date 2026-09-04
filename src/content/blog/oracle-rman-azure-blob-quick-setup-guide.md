---
title: "Oracle RMAN → Azure Blob: Quick Setup Guide"
description: "Oracle RMAN → Azure Blob Backup to Azure, the clean way Minimal steps, Oracle JDK only, and the recommended oracle.azure library alias. What you’ll need..."
pubDate: 2025-10-09
tags: ["Azure", "Backup & DR", "Oracle"]
featured: true
readingTime: "2 dk okuma"
---

Oracle RMAN → Azure Blob

# Backup to Azure, the clean way

Minimal steps, Oracle JDK only, and the recommended `oracle.azure` library alias.

## What you’ll need

  * Azure Storage account: `storageaccount`, `sharedkey`, `container`
  * Oracle Database **19c RU ≥ 19.28** (or **23ai RU ≥ 23.8**)
  * Use the Java in `$ORACLE_HOME/jdk/bin/java`
  * Outbound access from DB host to Azure Blob

**Tip:** Prefer a dedicated wallet directory (mode `700`) that survives Oracle Home patching.

## At a glance

✅ Supported Works on on-prem or Azure VMs.

Reference: Oracle Database Cloud Backup Module for Azure

## 1) Prepare the module

```bash

# Unpack the Azure setup tool inside your Oracle Home
mkdir -p $ORACLE_HOME/lib/azmodule
cd $ORACLE_HOME/lib/azmodule
unzip -q $ORACLE_HOME/lib/az_setup.zip
```

## 2) Create wallet dir (secure)

```bash
mkdir -p /u01/app/oracle/az_wallet
chmod 700 /u01/app/oracle/az_wallet
```

**Why:** The setup writes Azure credentials into this wallet directory.

## 3) Run setup with Oracle JDK

```text

# Use the Java that ships with your Oracle Home
$ORACLE_HOME/jdk/bin/java -jar $ORACLE_HOME/lib/azmodule/az_setup.jar \
  -storageaccount "YOUR_STORAGE_ACCOUNT" \
  -sharedkey "YOUR_ACCOUNT_KEY" \
  -container "YOUR_CONTAINER" \
  -walletDir "/u01/app/oracle/az_wallet"
```

Outputs:

  * Wallet with Azure credentials
  * Config file: `$ORACLE_HOME/dbs/az<ORACLE_SID>.ora`

**Optional flags** (click to expand)

  * `-immutable-container <name>` · enable immutable backups
  * `-proxyHost`, `-proxyPort`, `-proxyId`, `-proxyPass` · behind a proxy
  * `-configFile /path/az.ora` · custom config location/name
  * `-argFile arguments.txt` · keep params in a file

## 4) Configure RMAN channel (recommended alias)

```sql
RMAN> CONFIGURE DEFAULT DEVICE TYPE TO 'SBT_TAPE';
RMAN> CONFIGURE DEVICE TYPE 'SBT_TAPE' PARALLELISM 3 BACKUP TYPE TO BACKUPSET;
RMAN> CONFIGURE CHANNEL DEVICE TYPE 'SBT_TAPE'
      PARMS 'SBT_LIBRARY=oracle.azure, ENV=(AZ_PFILE=$ORACLE_HOME/dbs/az<ORACLE_SID>.ora)';
```

**Note:** Using `SBT_LIBRARY=oracle.azure` avoids platform-specific paths and is the Oracle-recommended method.

## 5) Verify

```text
RMAN> SHOW ALL CHANGED;
```

You should see:

```text
CONFIGURE DEFAULT DEVICE TYPE TO 'SBT_TAPE';
CONFIGURE CHANNEL DEVICE TYPE 'SBT_TAPE' PARMS 'SBT_LIBRARY=oracle.azure, ...';
```

## 6) Test backup

```text
RMAN> BACKUP DATABASE;
```

Expected lines in output:

```text
using target database control file instead of recovery catalog
channel ORA_SBT_TAPE_1: Oracle Database Azure Backup Service Library VER 19.xx
```

## 7) (Optional) Test restore

```text
RMAN> RESTORE DATABASE;
RMAN> RECOVER DATABASE;
```

## FAQ & Gotchas

  * **Direct library path?** Don’t. Use `oracle.azure` alias instead of pointing to `libaz.so`.
  * **Java version?** Run the setup using `$ORACLE_HOME/jdk/bin/java` for best compatibility.
  * **Multiple DBs on same host?** Each DB should have its own `az<ORACLE_SID>.ora` or a custom `-configFile`.
  * **Immutability?** Configure an immutable container and add `-immutable-container` to the setup if required by policy.

© Your Team • Adjust paths/SIDs as needed. Safe travels to the cloud ☁️
