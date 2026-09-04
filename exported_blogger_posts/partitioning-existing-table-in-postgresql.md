---
title: "Partitioning existing table in PostgreSQL"
description: "Let's create a table with 20 millions of random data. Be sure to index data column for comparing performance results. CREATE TABLE not_partitioned_table (..."
pubDate: 2024-09-03
tags: ["Partitioning", "PostgreSQL"]
featured: false
readingTime: "2 dk okuma"
---

**Let's create a table with 20 millions of random data. Be sure to index data column for comparing performance results.**

  

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

  

\-- Create an index on the transaction_date column

CREATE INDEX idx_transaction_date ON not_partitioned_table(transaction_date);

  

DO $$ 

DECLARE 

i INT;

BEGIN

FOR i IN 1..20000000 LOOP

INSERT INTO partitioned_table (user_id, transaction_date, amount, status, description)

VALUES (

(RANDOM() * 100000)::INT, 

CURRENT_DATE - ((RANDOM() * 3650)::INT), -- Random date within the last 10 years

(RANDOM() * 1000)::DECIMAL(10,2), 

CASE WHEN RANDOM() < 0.5 THEN 'completed' ELSE 'pending' END,

md5(random()::text)

);

END LOOP;

END $$;

  

**It may take a while. After process is finished, let's create the partitioned new table and all partitions. We will partition the new table depending on transaction_date per year-month. Just check minimum and maximum date values and run the partitioning script depending on your fits. And we are going to index every partition's transaction_date column because we are querying database according to it.**

**  
**

  

  

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

  

**And now the final step. Add all datas from old table:**

  

INSERT INTO partitioned_table_new (user_id, transaction_date, amount, status, description, created_at, updated_at)

SELECT user_id, transaction_date, amount, status, description, created_at, updated_at FROM not_partitioned_table;

  

**  
**

**Then query same data from both to see the difference at heap blocks:**

  

  

select * from not_partitioned_table where transaction_date between '2024-01-01' and '2024-01-10';

  

[![](https://blogger.googleusercontent.com/img/a/AVvXsEhvSPJvyk6V7i4DAosaDnBy2UK-f9dDZacLJwMszCT7pAuaZhzSbRGPnx8y9J4QaoQol5S9g8I6tVPH8ofNL_oPZOFbJ3-zjFPQdJVq4GMfTeOGsN71x21G1ibxyquvW4WSMTF4x6ZrAXSTYSuHxEp7ewFD76ZnXQx0I-5sWj4ipWM9aTIQUczzYAMqSCrr=w709-h132)](<https://blogger.googleusercontent.com/img/a/AVvXsEhvSPJvyk6V7i4DAosaDnBy2UK-f9dDZacLJwMszCT7pAuaZhzSbRGPnx8y9J4QaoQol5S9g8I6tVPH8ofNL_oPZOFbJ3-zjFPQdJVq4GMfTeOGsN71x21G1ibxyquvW4WSMTF4x6ZrAXSTYSuHxEp7ewFD76ZnXQx0I-5sWj4ipWM9aTIQUczzYAMqSCrr>)

  
select * from partitioned_table_new where transaction_date between '2024-01-01' and '2024-01-10';

  

[![](https://blogger.googleusercontent.com/img/a/AVvXsEgniz9WYIGL4rXRwMmqhPs9uUNqPkOMiFpcydFBdWvM8At_IdqjcKAS6rIt9JIIksQUqj90zH5c_WAbOp8xlGSAKA4ft5ZJS-0K4PSTd_VHsS9xCL5MAai02YLT8Qd7HX-wD2qaj7XTO-4YwWQKm013mmvU_okD7CWDl_8ax06w4Y1g-FZDg2BcG0gsbVm8=w744-h111)](<https://blogger.googleusercontent.com/img/a/AVvXsEgniz9WYIGL4rXRwMmqhPs9uUNqPkOMiFpcydFBdWvM8At_IdqjcKAS6rIt9JIIksQUqj90zH5c_WAbOp8xlGSAKA4ft5ZJS-0K4PSTd_VHsS9xCL5MAai02YLT8Qd7HX-wD2qaj7XTO-4YwWQKm013mmvU_okD7CWDl_8ax06w4Y1g-FZDg2BcG0gsbVm8>)
