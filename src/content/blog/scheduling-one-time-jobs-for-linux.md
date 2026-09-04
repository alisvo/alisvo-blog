---
title: "Scheduling one-time jobs for Linux"
description: "Using the at Command for Scheduled Maintenance We may need some maintenance works for our database systems. If we don't want to spend our evening with all..."
pubDate: 2024-01-15
updatedDate: 2024-12-27
tags: ["Linux", "Maintenance", "PostgreSQL", "Reboot"]
featured: false
readingTime: "1 dk okuma"
---

## Using the `at` Command for Scheduled Maintenance

We may need some maintenance works for our database systems. If we don't want to spend our evening with all the rebooting processes, the `at` command is here to help us.

```bash
echo "<command>" | at 22:00 Jan 18 2024
```

This command above runs a specific job at the desired date and time. Here's a more specific example for maintenance on a PostgreSQL database:

```bash
echo "yum update -y\nsystemctl stop postgresql-15.service\nreboot" | at 23:00 Jan 20 2024
```

We can list all jobs with the `atq` command. Moreover, using `at -c <id>`, we can check the details of scheduled commands. If a schedule was entered mistakenly, the `at -r <id>` command would help us remove it.

```text
atq
        at -c <id>
        at -r <id>
```

This simple yet powerful tool can save you from staying up late for routine tasks. Use it wisely!
