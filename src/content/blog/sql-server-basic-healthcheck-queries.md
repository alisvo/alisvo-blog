---
title: "SQL Server Basic Healthcheck Queries"
description: "This guide provides a suite of T‑SQL queries that give you a quick snapshot of your SQL Server’s health. The toolkit covers: Database Health Status Top 5..."
pubDate: 2025-02-10
tags: ["Healthcheck", "Query", "SQL Server"]
featured: false
readingTime: "1 dk okuma"
---

This guide provides a suite of T‑SQL queries that give you a quick snapshot of your SQL Server’s health. The toolkit covers:

  * Database Health Status
  * Top 5 Resource‑Intensive Queries (by CPU time, in seconds)
  * Top 5 Largest Objects (Tables) by Size
  * Backup Status – including full, differential (incremental), and transaction log backups
  * Database Size Summary
  * Memory (RAM) Usage

## 1. Database Health Status

This query returns basic state and configuration info for each database:

```sql
SELECT
    name,
    state_desc,             -- e.g. ONLINE, OFFLINE, RECOVERING, SUSPECT, etc.
    recovery_model_desc,    -- SIMPLE, FULL, or BULK_LOGGED
    user_access_desc,       -- MULTI_USER, SINGLE_USER, RESTRICTED_USER
    is_read_only,
    is_auto_close_on,
    is_auto_shrink_on
FROM sys.databases;
```

## 2. Top 5 Resource‑Intensive Queries (by CPU time)

This query lists the top 5 queries by cumulative CPU time. Note that the times (originally in microseconds) are now converted to seconds by dividing by 1,000,000:

```sql
SELECT TOP 5
    qs.total_worker_time / 1000000.0 AS Total_CPU_seconds,
    qs.execution_count,
    qs.total_elapsed_time / 1000000.0 AS Total_Elapsed_seconds,
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
        (
          (CASE
              WHEN qs.statement_end_offset = -1
              THEN LEN(CONVERT(nvarchar(max), st.text)) * 2
              ELSE qs.statement_end_offset
           END - qs.statement_start_offset) / 2 + 1
        )
    ) AS QueryText
FROM sys.dm_exec_query_stats AS qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) AS st
ORDER BY qs.total_worker_time DESC;
```

## 3. Top 5 Largest Objects (Tables) by Size

This query aggregates size information from system DMVs to list the 5 largest tables by allocated space:

```sql
SELECT TOP 5
    s.name AS SchemaName,
    t.name AS TableName,
    SUM(a.total_pages) * 8 / 1024.0 AS TotalSpaceMB,
    SUM(a.used_pages) * 8 / 1024.0 AS UsedSpaceMB,
    SUM(a.data_pages) * 8 / 1024.0 AS DataSpaceMB,
    SUM(p.rows) AS RowCounts
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
INNER JOIN sys.indexes i ON t.object_id = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
GROUP BY s.name, t.name
ORDER BY SUM(a.total_pages) DESC;
```

## 4. Backup Status (Full, Differential, and Log Backups)

This query returns the last backup date for each database for full backups, differential backups, and transaction log backups:

```sql
SELECT
    d.name AS DatabaseName,
    COALESCE(CONVERT(VARCHAR(20), full.LastBackupDate, 120), 'NEVER') AS LastFullBackup,
    COALESCE(CONVERT(VARCHAR(20), diff.LastBackupDate, 120), 'NEVER') AS LastDifferentialBackup,
    COALESCE(CONVERT(VARCHAR(20), log.LastBackupDate, 120), 'NEVER') AS LastLogBackup
FROM sys.databases d
LEFT JOIN (
    SELECT database_name, MAX(backup_finish_date) AS LastBackupDate
    FROM msdb.dbo.backupset
    WHERE type = 'D'
    GROUP BY database_name
) full ON d.name = full.database_name
LEFT JOIN (
    SELECT database_name, MAX(backup_finish_date) AS LastBackupDate
    FROM msdb.dbo.backupset
    WHERE type = 'I'
    GROUP BY database_name
) diff ON d.name = diff.database_name
LEFT JOIN (
    SELECT database_name, MAX(backup_finish_date) AS LastBackupDate
    FROM msdb.dbo.backupset
    WHERE type = 'L'
    GROUP BY database_name
) log ON d.name = log.database_name
ORDER BY d.name;
```

## 5. Database Size Summary

This query aggregates file sizes (each page is 8 KB) to show the overall size for each database:

```sql
SELECT
    d.name AS DatabaseName,
    SUM(mf.size) * 8 / 1024.0 AS TotalSizeMB,
    SUM(CASE WHEN mf.type_desc = 'LOG' THEN mf.size ELSE 0 END) * 8 / 1024.0 AS LogSizeMB,
    SUM(CASE WHEN mf.type_desc = 'ROWS' THEN mf.size ELSE 0 END) * 8 / 1024.0 AS DataSizeMB
FROM sys.databases d
INNER JOIN sys.master_files mf ON d.database_id = mf.database_id
GROUP BY d.name
ORDER BY TotalSizeMB DESC;
```

## 6. Memory (RAM) Usage

Use these queries to obtain an overview of system and SQL Server process memory usage:

```sql
-- Overall system memory as seen by SQL Server:
SELECT
    total_physical_memory_kb/1024 AS TotalPhysicalMemoryMB,
    available_physical_memory_kb/1024 AS AvailablePhysicalMemoryMB,
    total_page_file_kb/1024 AS TotalPageFileMB,
    available_page_file_kb/1024 AS AvailablePageFileMB,
    (100.0 * available_physical_memory_kb / total_physical_memory_kb) AS PercentMemoryAvailable
FROM sys.dm_os_sys_memory;

-- SQL Server process memory usage:
SELECT
    physical_memory_in_use_kb/1024.0 AS PhysicalMemoryInUseMB,
    locked_page_allocations_kb/1024.0 AS LockedPagesMB,
    virtual_address_space_committed_kb/1024.0 AS CommittedVirtualMemoryMB,
    available_commit_limit_kb/1024.0 AS AvailableCommitLimitMB
FROM sys.dm_os_process_memory;
```

## Conclusion

This toolkit of queries is designed to give you a quick snapshot of your SQL Server environment’s health—from overall database status and sizes to resource‑intensive queries, backup history, and memory usage. Customize and schedule these queries as needed to build your personal DBA toolkit.
