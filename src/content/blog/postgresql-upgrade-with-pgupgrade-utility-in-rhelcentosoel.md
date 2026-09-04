---
title: "POSTGRESQL UPGRADE WITH PG_UPGRADE UTILITY IN RHEL/CENTOS/OEL"
description: "Upgrading PostgreSQL can be a smooth process if you follow the necessary steps carefully. Below is a comprehensive guide to help you through the upgrade...."
pubDate: 2022-02-12
updatedDate: 2024-11-07
tags: ["PostgreSQL"]
featured: false
readingTime: "2 dk okuma"
---

Upgrading PostgreSQL can be a smooth process if you follow the necessary steps carefully. Below is a comprehensive guide to help you through the upgrade.

## Table of Contents

  1. Prerequisites
  2. Install the New PostgreSQL Version
  3. Set Up New Directories and Permissions
  4. Initialize the New Database
  5. Configure PostgreSQL Settings
  6. Stop and Disable Old PostgreSQL Services
  7. Run the Upgrade Process
  8. Finalize the Upgrade
  9. Post-Upgrade Tasks

## Prerequisites

Before initiating the upgrade, ensure the following prerequisites are met:

  * **Internet Connection:** Required for downloading packages.
  * **PostgreSQL RPM Packages:** Necessary for installation.
  * **Free Disk Space:** Ensure you have more free space than the current database size.
  * **Compatibility Checks:** Verify PostgreSQL extension compatibility.
  * **Crontab Jobs:** Identify any cron jobs related to PostgreSQL.

_Note:_ Skipping these checks may result in errors during the upgrade process.

## Install the New PostgreSQL Version

Use the `yum` command to install the new PostgreSQL version:

```bash
[root@desktop-e53bh56 ~]# yum install postgresql14-server
```

## Set Up New Directories and Permissions

Create new directories and set the appropriate permissions:

```bash
[root@desktop-e53bh56 ~]# mkdir -p /pgdata/14/data
[root@desktop-e53bh56 ~]# chown postgres.postgres -R /pgdata/14
[root@desktop-e53bh56 ~]# chmod 0700 -R /pgdata/14
```

_Note:_ Creating your own folder is optional but recommended for better organization.

## Initialize the New Database

Switch to the `postgres` user and initialize the database in the new location:

```text
[postgres@desktop-e53bh56 ~]$ /usr/pgsql-14/bin/initdb -D /pgdata/14/data
```

## Configure PostgreSQL Settings

Edit the `postgresql.conf` and `pg_hba.conf` files to migrate your old configurations to the new version. Additionally, review any new features introduced in the upgraded version.

## Stop and Disable Old PostgreSQL Services

Before proceeding, stop and disable the services of the old PostgreSQL version:

```bash
[root@desktop-e53bh56 ~]# systemctl stop postgresql-12.service
[root@desktop-e53bh56 ~]# systemctl disable postgresql-12.service
```

## Run the Upgrade Process

Execute the `pg_upgrade` command with the appropriate parameters:

```text
[postgres@desktop-e53bh56 ~]$ /usr/pgsql-14/bin/pg_upgrade \
  --old-datadir=/pgdata/12/data \
  --new-datadir=/pgdata/14/data \
  --old-bindir=/usr/pgsql-12/bin \
  --new-bindir=/usr/pgsql-14/bin \
  --old-options -v
```

**Parameters Explained:**

  * `--old-datadir`: Path to the old data directory.
  * `--new-datadir`: Path to the new data directory.
  * `--old-bindir`: Path to the old PostgreSQL binaries.
  * `--new-bindir`: Path to the new PostgreSQL binaries.
  * `--old-options`: Additional options for the old binaries.
  * `-v`: Verbose output.

_Tip:_ Monitor the upgrade process for any errors.

## Finalize the Upgrade

Update the service file to ensure the new version uses the correct data directory:

```text
[root@desktop-e53bh56 ~]# vi /usr/lib/systemd/system/postgresql-14.service
```

Update the `PGDATA` environment variable:

```ini
Environment=PGDATA=/pgdata/14/data/
```

Reload the daemon and start the new service:

```bash
[root@desktop-e53bh56 ~]# systemctl daemon-reload
[root@desktop-e53bh56 ~]# systemctl start postgresql-14.service
[root@desktop-e53bh56 ~]# systemctl enable postgresql-14.service
```

## Post-Upgrade Tasks

After successfully upgrading, execute any recommended scripts:

  * **Update Extensions:** Ensure all PostgreSQL extensions are up-to-date.
  * **Vacuum Database:** Run `vacuumdb` to analyze and clean the database.

Example:

```sql
[postgres@desktop-e53bh56 ~]$ vacuumdb --all --analyze
```

## Conclusion

Upgrading PostgreSQL involves several critical steps, from preparing your environment to finalizing the new setup. By following this guide meticulously, you can ensure a seamless transition to the latest PostgreSQL version.
