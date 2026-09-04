---
title: "Postgresql Change Data Directory in the service"
description: "1. Create the Override Drop-In Open the drop-in editor for the service: ___CODE_BLOCK_0___ In the editor that appears, paste the following above the “###..."
pubDate: 2025-07-14
tags: ["Pgdata", "PostgreSQL", "Setup"]
featured: false
readingTime: "1 dk okuma"
---

## 1\. Create the Override Drop-In

  1. Open the drop-in editor for the service: 

```bash
sudo systemctl edit postgresql-16.service
```

 
  2. In the editor that appears, paste the following **above** the “### Lines below…” comment: 

```text
[Service]
Environment=PGDATA=/your/custom/pgdata/path

### Lines below this comment will be discarded
```

 
  3. Save and exit:  
• Nano: `Ctrl+O` → `Enter`, then `Ctrl+X`  
• Vim: `:wq` → `Enter`

## 2\. Reload systemd and Restart PostgreSQL

```bash
sudo systemctl daemon-reload
sudo systemctl restart postgresql-16
sudo systemctl enable postgresql-16
```

 

## 3\. Manual File Creation (Alternative)

If the editor method fails, create the drop-in file directly:

```bash
sudo mkdir -p /etc/systemd/system/postgresql-16.service.d
sudo tee /etc/systemd/system/postgresql-16.service.d/override.conf <<EOF
[Service]
Environment=PGDATA=/your/custom/pgdata/path
EOF
sudo systemctl daemon-reload
sudo systemctl restart postgresql-16
```

 

## 4\. Verify Your New Data Directory

  * Check service status: 

```bash
systemctl status postgresql-16
```

 
  * Confirm inside PostgreSQL: 

```bash
sudo -u postgres psql -c "SHOW data_directory;"
```

 
  * The output should match `/your/custom/pgdata/path`.
