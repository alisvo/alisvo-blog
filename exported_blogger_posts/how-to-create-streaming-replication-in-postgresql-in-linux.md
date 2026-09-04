---
title: "How To Create Streaming Replication In PostgreSQL in Linux?"
description: "Note: Before all steps, make sure that postgreSQL is installed to both primary and standby servers. If you don't have any primary server yet, make sure to..."
pubDate: 2023-12-22
tags: ["PostgreSQL", "Replication", "Streaming"]
featured: false
readingTime: "2 dk okuma"
---

Note: Before all steps, make sure that postgreSQL is installed to both primary and standby servers. If you don't have any primary server yet, make sure to initialize and put into running state. Do not initialize any database on standby side.

  

1- Be sure about primary and replica database server's firewall policies. They should have access to each other through postgreSQL port.

2- On the primary side, add a line as below in order to replication user access:

host replication rep_user <replica_ip>/32 scram-sha-256

3- Create replication user on primary server with postgres user.

createuser -U postgres rep_user -P --replication -p <port>

4- Find the relevant lines in postgresql.conf below and edit:

max_wal_senders=10

max_replication_slots=10

wal_keep_size=50000MB

max_slot_wal_keep_size=50000MB

wal_level=replica

Note: Adjust wal_keep_size for your needs. Wal files will override when they reach size.

5- In order to bypass password prompt on your replication script, create a .pgpass file.

echo "<primary_ip>:<port>:*:<rep_user>:<rep_passwd>" > /var/lib/pgsql/.pgpass

chmod 0600 /var/lib/pgsql/.pgpass

chown postgres.postgres /var/lib/pgsql/.pgpass

6- Create an sh script named "basebackup.sh" in standby server in order to write replication process. Creating a script helps us to manage longer replication processes via running it from background process. 

  

> /usr/pgsql-14/bin/pg_basebackup -D <postgre_data_folder> -Fp -R -X stream -c fast -C -S <replica_slot_name> -h <primary_ip> -p <port> -U repuser -P
> 
>   
> 
> 
> cp /tmp/pg_hba.conf /pgdata/14/data # comment this if you dont want to configure it.
> 
>   
> 
> 
> systemctl enable --now postgresql.service #you can comment this if you don't want to start it immediately.

7- Start script as background process like below:

nohup sh basebackup.sh > basebackup.log 2>&1 & disown

  

8- After finishing, check if it works. Use the command on primary database in order to get status:

select * from pg_stat_replication;

streaming: replication is healthy, no delay

catchup: there is lag but replica server is trying to catch up to the primary.

dead: replication is not working, it's desynchronized.

Note: If any errors occur during the steps, before starting again make sure to delete all files in replica postgresql data folder. After that, drop replication slot via running comand on primary database like below:

select pg_drop_replication_slot('<replica_slot_name>');
