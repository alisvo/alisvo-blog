---
title: "Adjusting SGA & PGA In Oracle Databases"
description: "1. Check the Current Configuration Before making any changes, verify if memory_target is set: ___CODE_BLOCK_0___ If memory_target is not 0, follow these..."
pubDate: 2024-11-07
tags: ["Memory", "Oracle"]
featured: false
readingTime: "1 dk okuma"
---

## 1\. Check the Current Configuration

Before making any changes, verify if `memory_target` is set:

```text
SHOW PARAMETER memory_target;
```

 

If `memory_target` is not 0, follow these steps:

## 2\. Check Current SGA and PGA Values

Run the following commands to view the current configurations:

```text
SHOW PARAMETER sga_target;
SHOW PARAMETER sga_max_size;
SHOW PARAMETER pga_aggregate_target;
```

 

## 3\. Calculate and Set New Targets

To adjust the `SGA` and `PGA` sizes, use the following commands. Replace the values with your desired configuration if needed:

```sql
ALTER SYSTEM SET SGA_TARGET = 32G SCOPE = SPFILE;
ALTER SYSTEM SET SGA_MAX_SIZE = 32G SCOPE = SPFILE;
ALTER SYSTEM SET PGA_AGGREGATE_TARGET = 24G SCOPE = SPFILE;
```

 

**Note:** If Automatic Memory Management (AMM) is enabled (`memory_target` is not 0), adjust only `MEMORY_TARGET` instead of `SGA_TARGET` and `PGA_AGGREGATE_TARGET`. 

## 4\. Restart the Database

To apply the changes, restart the database:

```text
SHUTDOWN IMMEDIATE;
STARTUP;
```

 

## 5\. Verify the New Configuration

After restarting, check the new values to ensure the changes were applied correctly:

```text
SHOW PARAMETER sga_target;
SHOW PARAMETER sga_max_size;
SHOW PARAMETER pga_aggregate_target;
```

 

## 6\. Additional Tips

  * Adjust the `SGA_TARGET` and `PGA_AGGREGATE_TARGET` values based on your system's workload and available resources.
  * Always back up your database and SPFILE before making configuration changes.
