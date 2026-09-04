---
title: "Unlock Oracle Users and Make Their Password Unexpirable"
description: "When an Oracle database user account expires, it needs to be unlocked and assigned to a profile that ensures password expiration does not occur. Follow..."
pubDate: 2025-02-07
tags: ["Oracle", "Password", "Security"]
featured: false
readingTime: "1 dk okuma"
---

When an Oracle database user account expires, it needs to be unlocked and assigned to a profile that ensures password expiration does not occur. Follow these steps to handle expired Oracle users.

## Step 1: Create a Profile with Unlimited Password Lifetime

To prevent password expiration, create a profile with unlimited password lifetime:

```text
CREATE PROFILE APP_PROFILE LIMIT PASSWORD_LIFE_TIME UNLIMITED;
```

 

## Step 2: Assign the Profile to the User

Assign the newly created profile to the affected user:

```text
ALTER USER APP_USER PROFILE APP_PROFILE;
```

 

## Step 3: Reset Password for Expired Users

If a user is already expired, their password must be reset:

```text
ALTER USER APP_USER IDENTIFIED BY same_password;
```

 

## Step 4: Retrieve the Existing Password (If Necessary)

If the current password is unknown and must remain unchanged, use the following query to retrieve it:

```sql
SELECT 'ALTER USER ' || name || ' IDENTIFIED BY VALUES ''' || spare4 || ';' || password || ''';'
            FROM sys.user$
            WHERE name = 'MYUSER';
```

 

This query extracts the existing password hash, which can be used to reassign the same password without modifying it.

## Conclusion

By following these steps, you can ensure that users do not face unexpected expirations and that applications continue running smoothly without password-related disruptions.
