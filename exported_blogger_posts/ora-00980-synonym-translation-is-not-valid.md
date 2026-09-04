---
title: "ORA-00980 Synonym Translation is not Valid"
description: "Sometimes if base object of a synonym is dropped without dropping synonym, ORA-00980 error may occur. For the fix, you can search related SCHEMA for..."
pubDate: 2023-05-26
tags: ["Database", "Oracle", "Pl/Sql"]
featured: false
readingTime: "1 dk okuma"
---

Sometimes if base object of a synonym is dropped without dropping synonym, ORA-00980 error may occur. For the fix, you can search related SCHEMA for synonyms that doesn't have its base objects with the PL/SQL codeblock below:

DECLARE

```sql
v_schema VARCHAR2(30) := 'YOUR_SCHEMA_NAME_HERE';  -- Replace with your schema name
    v_cnt NUMBER;
BEGIN
    DBMS_OUTPUT.ENABLE(1000000);  -- Increase the buffer size

    FOR syn IN (SELECT owner, synonym_name, table_owner, table_name 
                FROM dba_synonyms 
                WHERE owner = v_schema AND table_owner IS NOT NULL) LOOP
        BEGIN
            EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM dba_objects 
                               WHERE owner = :1 AND object_name = :2' 
            INTO v_cnt 
            USING syn.table_owner, syn.table;
```


