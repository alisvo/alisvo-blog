---
title: "ORA-00980 Synonym Translation is not Valid"
description: "Sometimes if the base object of a synonym is dropped without dropping the synonym, ORA-00980 error may occur. Here is how to detect broken synonyms."
pubDate: 2023-05-26
tags: ["Database", "Oracle", "Pl/Sql"]
featured: false
readingTime: "1 dk okuma"
---

Sometimes when the base object of a synonym is dropped or renamed without updating or dropping the synonym itself, you will encounter the **`ORA-00980: synonym translation is no longer valid`** error.

To identify all synonyms within a schema whose underlying target objects no longer exist, you can execute the following PL/SQL block:

```sql
DECLARE
    v_schema VARCHAR2(30) := 'YOUR_SCHEMA_NAME_HERE';  -- Replace with your schema name
    v_cnt NUMBER;
BEGIN
    DBMS_OUTPUT.ENABLE(1000000);

    FOR syn IN (SELECT owner, synonym_name, table_owner, table_name 
                FROM dba_synonyms 
                WHERE owner = v_schema AND table_owner IS NOT NULL) LOOP
        BEGIN
            EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM dba_objects 
                               WHERE owner = :1 AND object_name = :2' 
            INTO v_cnt 
            USING syn.table_owner, syn.table_name;

            IF v_cnt = 0 THEN
                DBMS_OUTPUT.PUT_LINE('Broken synonym: ' || syn.owner || '.' || syn.synonym_name || ' -> ' || syn.table_owner || '.' || syn.table_name);
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE('Error checking synonym: ' || syn.owner || '.' || syn.synonym_name);
        END;
    END LOOP;
END;
/
```
