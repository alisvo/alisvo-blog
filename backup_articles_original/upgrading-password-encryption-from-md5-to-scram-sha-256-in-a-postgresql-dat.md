---
title: "Upgrading Password Encryption from Md5 to Scram-sha-256 in a Postgresql Database"
description: "Check if application db drivers (e.g. postgresql jdbc ) support scram method. If not, replace with the newer version. In addition, Postgresql version should..."
pubDate: 2022-02-14
updatedDate: 2022-05-25
tags: ["PostgreSQL"]
featured: false
readingTime: "1 dk okuma"
---

>   * Check if application db drivers (e.g. postgresql jdbc ) support scram method. If not, replace with the newer version. In addition, Postgresql version should be above _10.0_.
  * Uncomment password_encyrption line if commented, and then set it to scram-sha-256. It should look like below: 

password_encryption = scram-sha-256 

  * All passwords in database should be re-entered so they can be encrypted with new method.
  * Before going further, check if all roles are encrypted with scram-sha-256 via running the query below:

select * from pg_authid;  

  * In order to disable logins of users with md5 encryption, pg_hba.conf also should be edited. Example entries are as below:

  
  
# TYPE DATABASE USER ADDRESS METHOD

host  all all 127.0.0.1/32 scram-sha-256

host all  all  192.168.1.23/32 scram-sha-256  

  * After editing all conf. files, log in to database via psql or some gui tool with superuser and run the command below:

select pg_reload_conf();

  * All done. As a side note, by running the sql below, you can check pg_hba_conf file rules:

select * from pg_hba_file_rules;  

>
