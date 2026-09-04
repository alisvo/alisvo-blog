---
title: "Virtual IP Configuration for PostgreSQL (OEL8)"
description: "Step-by-step guide for configuring a virtual IP (VIP) for PostgreSQL on Oracle Enterprise Linux 8 (OEL8)."
pubDate: 2022-03-09
updatedDate: 2022-05-25
tags: ["Linux", "PostgreSQL", "Networking"]
featured: false
readingTime: "1 dk okuma"
---

Follow the steps below to configure a secondary Virtual IP (VIP) interface for PostgreSQL on Oracle Enterprise Linux 8:

### 1. Identify Network Interface
Check existing interface names:

```bash
ip addr
# or legacy: ifconfig -a
```

### 2. Create Virtual Interface Configuration
Copy your primary interface configuration file:

```bash
cd /etc/sysconfig/network-scripts
cp ifcfg-ens192 ifcfg-ens192:1
```

### 3. Edit Virtual Interface File
Edit `ifcfg-ens192:1` and configure the new IP:

```ini
DEVICE=ens192:1
NAME=ens192:1
IPADDR=<new_virtual_ip_address>
ONBOOT=yes
```

### 4. Update `postgresql.conf` Listen Address
Allow PostgreSQL to listen on the new virtual IP:

```ini
# /var/lib/pgsql/14/data/postgresql.conf
listen_addresses = '<new_virtual_ip_address>,localhost'
```

### 5. Update Systemd Service Unit
Ensure PostgreSQL only starts after the network interfaces are completely online:

```ini
# /usr/lib/systemd/system/postgresql-14.service
[Unit]
Wants=network-online.target
After=network-online.target
```

### 6. Apply & Verify
Reload the systemd daemon and restart the network and database services:

```bash
systemctl daemon-reload
systemctl restart NetworkManager
systemctl restart postgresql-14
```

Verify that the virtual IP is active and reachable with `ip addr show dev ens192`.
