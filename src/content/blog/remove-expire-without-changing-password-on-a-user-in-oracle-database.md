---
title: "Remove Expire Without Changing Password on a User in Oracle Database"
description: "How to reset or unexpire an Oracle database user password without knowing or changing the current password."
pubDate: 2024-06-04
tags: ["Database", "Oracle", "Security"]
featured: false
readingTime: "1 dk okuma"
---

When an Oracle database user account expires, you can unexpire it without needing to know the user's plain-text password by reusing the existing password hash.

### 1. Extract Current Password Hash

First, retrieve the password hash from `sys.user$`:

```sql
SELECT 'ALTER USER ' || name || ' IDENTIFIED BY VALUES ''' || spare4 || ';' || password || ''';' 
FROM sys.user$ 
WHERE name = 'MYUSER';
```

### 2. Execute the Generated ALTER Statement

Run the statement returned from the previous query. For example:

```sql
ALTER USER MYUSER IDENTIFIED BY VALUES 'S:5F20FE3B04A699B37E5D68F20C597E411AF0E541A0315C7D20B3F56A37C1;T:CADDBF4C3A94AE641BE5EB56718E1F323EA39157FCBBD3511232EA54C7EBD52FCBD2061BFB6120E70A525FD08E2556ECC17878DFC581894C7169E64BF394AD82D57C2671F2C4AC5651D9AFA47DF58052;';
```

This resets the expiration timer while preserving the existing password.
