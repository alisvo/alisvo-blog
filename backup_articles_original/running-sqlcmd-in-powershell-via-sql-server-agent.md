---
title: "Running SQLCMD in PowerShell via SQL Server Agent"
description: "Learn how to execute a SQL query via SQL Server Agent using PowerShell and sqlcmd . This method ensures UTF-8 compatibility and proper handling of..."
pubDate: 2025-01-29
tags: ["Csv", "SQL", "Windows"]
featured: false
readingTime: "1 dk okuma"
---

Learn how to execute a SQL query via **SQL Server Agent** using **PowerShell** and `sqlcmd`. This method ensures UTF-8 compatibility and proper handling of non-English characters.

## 1️⃣ Save Your SQL Query in a File

First, create a SQL file with the query you want to execute. Save it as `C:\Scripts\ExportQuery.sql`.

```sql
SET NOCOUNT ON;

SELECT TOP 100 * FROM [YourDatabase].[dbo].[YourTable];
```

 

## 2️⃣ Create a PowerShell Script

Now, create a PowerShell script to execute the query and export the results as a CSV file.

```text
sqlcmd -S YourServer -E -i "C:\Scripts\ExportQuery.sql" -s "," -W -h -1 | Out-File "C:\Exports\ExportedData.csv" -Encoding UTF8
```

 

## 3️⃣ Configure SQL Server Agent

Follow these steps to create a SQL Server Agent job:

  1. Open SQL Server Management Studio (SSMS).
  2. Go to **SQL Server Agent** → **Jobs** → Right-click **New Job**.
  3. Under **Steps** , click **New** → Set **Type** to `PowerShell`.
  4. Paste the PowerShell script into the command box.
  5. Click **OK** and schedule the job as needed.

## 4️⃣ Run and Verify

Execute the job manually or wait for the scheduled execution. Check the output file at `C:\Exports\ExportedData.csv`.

**💡 Troubleshooting:**

  * If SQL Server Agent cannot find `sqlcmd`, use the full path: `C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\sqlcmd.exe`
  * Ensure SQL Agent has permissions to access the script and output folder.

Now your SQL query executes seamlessly via PowerShell inside SQL Server Agent! 🚀
