---
title: "Creating Jobs With Different Users via pg_cron in Azure Postgresql Flexible Server"
description: "PostgreSQL pg_cron: Scheduling Materialized View Refresh Across Databases In this tutorial, I’ll walk you through the process of scheduling a Materialized..."
pubDate: 2025-01-21
tags: ["Azure", "Cron", "Flexible", "PostgreSQL", "Server"]
featured: false
readingTime: "2 dk okuma"
---

# PostgreSQL pg_cron: Scheduling Materialized View Refresh Across Databases

In this tutorial, I’ll walk you through the process of scheduling a Materialized View refresh using the `pg_cron` extension in PostgreSQL. Specifically, we’ll cover how to execute a scheduled SQL command in a different database using `cron.schedule_in_database`.

## Step 1: Enable the `pg_cron` Extension in Azure Portal

On Azure PostgreSQL Flexible Server, the `pg_cron` extension is managed directly through the Azure portal. Follow these steps:

  1. Go to the Azure portal and navigate to your PostgreSQL Flexible Server instance.
  2. Under the Server Parameters section, locate the `azure.extensions` parameter.
  3. Add `PG_CRON` to the list of allowed extensions (as shown in the screenshot).

Once enabled, the extension is automatically installed in the default `postgres` database. If you need to schedule jobs in other databases, you’ll use `cron.schedule_in_database`, which we’ll cover in Step 3.

## Step 2: Create a SECURITY DEFINER Function

Since `REFRESH MATERIALIZED VIEW` requires ownership of the materialized view, we’ll create a SECURITY DEFINER function. This ensures the function runs with the privileges of the view owner, regardless of who calls it.

Log in as the owner of the materialized view (e.g., `data_user`) and create the function:

```sql
CREATE OR REPLACE FUNCTION refresh_user_view()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_materialized_view;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Secure the function by revoking unnecessary access:

```sql
REVOKE ALL ON FUNCTION refresh_user_view() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_user_view() TO admin_user;
```

## Step 3: Schedule the Job Using `cron.schedule_in_database`

To schedule a job that refreshes the materialized view in a different database, use the `cron.schedule_in_database` function. Run the following SQL command as the admin user:

```sql
SELECT cron.schedule_in_database(
    'refresh_user_view_daily',               -- job_name
    '00 17 * * *',                           -- schedule: every day at 17:00
    'SELECT refresh_user_view();',           -- SQL command to run
    'user_database'                          -- target database
);
```

In this example:

  * `refresh_user_view_daily` is the job name.
  * `00 17 * * *` specifies the schedule (every day at 17:00).
  * `SELECT refresh_user_view();` is the SQL command to execute.
  * `user_database` is the database where the materialized view resides.

## Step 4: Verify the Job

Check if the job was successfully created by querying the `cron.job` table in the postgres database (where `pg_cron` is installed):

```sql
SELECT * FROM cron.job;
```

You can also monitor job execution using the `cron.job_run_details` table:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh_user_view_daily');
```

## Step 5: Test the Setup

Manually trigger the job to verify it works as expected:

```sql
SELECT refresh_user_view();
```

Ensure the materialized view is refreshed successfully by querying it after execution.

## Conclusion

By following these steps, you can schedule and execute a `REFRESH MATERIALIZED VIEW` command across databases using `pg_cron`. The use of a SECURITY DEFINER function ensures that the job runs with the required permissions, even if ownership restrictions exist. This approach is particularly useful in managed environments like Azure PostgreSQL Flexible Server.

**Note:** Ensure that you test the entire setup in a staging environment before deploying it in production.

Have any questions or feedback? Let me know in the comments!
