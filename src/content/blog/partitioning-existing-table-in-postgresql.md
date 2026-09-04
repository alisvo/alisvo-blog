---
title: "Partitioning existing table in PostgreSQL"
description: "How to partition an existing large table in PostgreSQL with range partitioning, automated partition creation, and indexing."
pubDate: 2024-09-03
tags: ["Partitioning", "PostgreSQL"]
featured: false
readingTime: "2 dk okuma"
---

### 1. Create Sample Unpartitioned Table

Let's create a table with 20 million random rows and add an index to compare performance:

```sql
CREATE TABLE not_partitioned_table (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(10, 2),
    status VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on the transaction_date column
CREATE INDEX idx_transaction_date ON not_partitioned_table(transaction_date);
```

### 2. Populate 20 Million Sample Records

```sql
DO $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..20000000 LOOP
        INSERT INTO not_partitioned_table (user_id, transaction_date, amount, status, description)
        VALUES (
            (RANDOM() * 100000)::INT,
            CURRENT_DATE - ((RANDOM() * 3650)::INT), -- Random date within the last 10 years
            (RANDOM() * 1000)::DECIMAL(10,2),
            CASE WHEN RANDOM() < 0.5 THEN 'completed' ELSE 'pending' END,
            md5(random()::text)
        );
    END LOOP;
END $$;
```

### 3. Create the Partitioned Table

After data generation completes, create the new partitioned table structure partitioned by range on `transaction_date`:

```sql
CREATE TABLE partitioned_table_new (
    id SERIAL,
    user_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(10, 2),
    status VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, transaction_date) -- Include transaction_date in the primary key
) PARTITION BY RANGE (transaction_date);
```

### 4. Automatically Generate Monthly Partitions

Create monthly partitions between your required minimum and maximum dates:

```sql
DO $$
DECLARE
    start_date DATE := '2014-09-01';
    end_date DATE := '2024-10-01';
    partition_end DATE;
    partition_name TEXT;
BEGIN
    WHILE start_date < end_date LOOP
        partition_end := start_date + INTERVAL '1 month';
        partition_name := 'partition_' || TO_CHAR(start_date, 'YYYY_MM');

        EXECUTE format(
            'CREATE TABLE %I PARTITION OF partitioned_table_new FOR VALUES FROM (%L) TO (%L);',
            partition_name,
            start_date,
            partition_end
        );

        start_date := partition_end;
    END LOOP;
END $$;
```

### 5. Create Indexes on All Partitions

```sql
DO $$
DECLARE
    partition_name RECORD;
BEGIN
    FOR partition_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename LIKE 'partition_%'
    LOOP
        EXECUTE format('CREATE INDEX idx_%I_transaction_date ON %I (transaction_date);', partition_name.tablename, partition_name.tablename);
    END LOOP;
END $$;
```

### 6. Migrate Data from Old Table

Copy the existing rows into the partitioned table:

```sql
INSERT INTO partitioned_table_new (user_id, transaction_date, amount, status, description, created_at, updated_at)
SELECT user_id, transaction_date, amount, status, description, created_at, updated_at 
FROM not_partitioned_table;
```

### 7. Performance Comparison

Now query the same date range from both tables to inspect heap block reads and execution performance:

**Unpartitioned Table Query:**
```sql
SELECT * FROM not_partitioned_table WHERE transaction_date BETWEEN '2024-01-01' AND '2024-01-10';
```

[![Unpartitioned Execution Plan](https://blogger.googleusercontent.com/img/a/AVvXsEhvSPJvyk6V7i4DAosaDnBy2UK-f9dDZacLJwMszCT7pAuaZhzSbRGPnx8y9J4QaoQol5S9g8I6tVPH8ofNL_oPZOFbJ3-zjFPQdJVq4GMfTeOGsN71x21G1ibxyquvW4WSMTF4x6ZrAXSTYSuHxEp7ewFD76ZnXQx0I-5sWj4ipWM9aTIQUczzYAMqSCrr=w709-h132)](https://blogger.googleusercontent.com/img/a/AVvXsEhvSPJvyk6V7i4DAosaDnBy2UK-f9dDZacLJwMszCT7pAuaZhzSbRGPnx8y9J4QaoQol5S9g8I6tVPH8ofNL_oPZOFbJ3-zjFPQdJVq4GMfTeOGsN71x21G1ibxyquvW4WSMTF4x6ZrAXSTYSuHxEp7ewFD76ZnXQx0I-5sWj4ipWM9aTIQUczzYAMqSCrr)

**Partitioned Table Query:**
```sql
SELECT * FROM partitioned_table_new WHERE transaction_date BETWEEN '2024-01-01' AND '2024-01-10';
```

[![Partitioned Execution Plan](https://blogger.googleusercontent.com/img/a/AVvXsEgniz9WYIGL4rXRwMmqhPs9uUNqPkOMiFpcydFBdWvM8At_IdqjcKAS6rIt9JIIksQUqj90zH5c_WAbOp8xlGSAKA4ft5ZJS-0K4PSTd_VHsS9xCL5MAai02YLT8Qd7HX-wD2qaj7XTO-4YwWQKm013mmvU_okD7CWDl_8ax06w4Y1g-FZDg2BcG0gsbVm8=w744-h111)](https://blogger.googleusercontent.com/img/a/AVvXsEgniz9WYIGL4rXRwMmqhPs9uUNqPkOMiFpcydFBdWvM8At_IdqjcKAS6rIt9JIIksQUqj90zH5c_WAbOp8xlGSAKA4ft5ZJS-0K4PSTd_VHsS9xCL5MAai02YLT8Qd7HX-wD2qaj7XTO-4YwWQKm013mmvU_okD7CWDl_8ax06w4Y1g-FZDg2BcG0gsbVm8)
