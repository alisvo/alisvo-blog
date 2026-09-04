---
title: "Virtual IP Configuration for PostgreSQL (OEL8)"
description: "1-) Check network interface name with the command below: 2-) Go to network interface file location and copy & rename interface config file: ifcfg -a cd..."
pubDate: 2022-03-09
updatedDate: 2022-05-25
tags: ["Linux", "PostgreSQL"]
featured: false
readingTime: "1 dk okuma"
---

**1-) Check network interface name with the command below:**

  

**2-) Go to network interface file location and copy & rename interface config file:**

  

ifcfg -a 

cd /etc/sysconfig/network-scripts

cp ifcfg-ens192 ifcfg-ens192:1

  

**3-) Edit newly copied file, change the parameters below:**

  

IPADDR= (new ip address) 

DEVICE=ens192:1

NAME=ens192:1 

  

**4-) Edit postgresql.conf for new listen address:**

  

vi /<postgresqlfolder>/14/data/postgresql.conf

listen_address='(new ip address)'

  

**5-) Edit postgresql service file and add the parameters below at [Unit] section:**

  

vi /usr/lib/systemd/system/postgresql-14.service

  

Wants=network-online.target

After=network-online.target

  

**6-) Reboot the server if possible. Otherwise, reload all services. Since you need to be sure everything will work after a planned/unplanned reboot, restarting the server is guaranteed way. After the process, check if service working and virtual ip is up and running.**
