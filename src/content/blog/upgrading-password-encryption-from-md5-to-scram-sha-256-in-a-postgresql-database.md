---
title: "Upgrading Password Encryption from Md5 to Scram-sha-256 in a Postgresql Database"
description: "How to migrate PostgreSQL database password authentication from MD5 to SCRAM-SHA-256 securely."
pubDate: 2022-02-14
updatedDate: 2022-05-25
tags: ["PostgreSQL", "Security"]
featured: false
readingTime: "1 dk okuma"
---

> **Prerequisite:** Ensure application client drivers (e.g., PostgreSQL JDBC driver) support SCRAM-SHA-256. PostgreSQL version must be 10.0 or newer.

### 1. Update `postgresql.conf`
Uncomment and set `password_encryption` to `scram-sha-256`:

```ini
password_encryption = scram-sha-256
```

### 2. Reset Existing Passwords
Existing passwords must be re-entered by users or administrators so PostgreSQL can hash them with SCRAM-SHA-256.

### 3. Verify Role Encryption
Check if existing roles have upgraded password hashes:

```sql
SELECT rolname, rolpassword FROM pg_authid;
```

### 4. Update `pg_hba.conf`
To enforce SCRAM-SHA-256 and reject outdated MD5 connections, update `pg_hba.conf`:

```ini
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             192.168.1.23/32         scram-sha-256
```

### 5. Reload Configuration
Apply the changes without restarting the PostgreSQL service:

```sql
SELECT pg_reload_conf();
```

### 6. Verify HBA Rules
Confirm active rules from within PostgreSQL:

```sql
SELECT * FROM pg_hba_file_rules;
```
