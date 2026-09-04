---
title: "Error when Installing Some Postgresql Packages (Perl IPC-Run)"
description: "Fixing perl(IPC::Run) Dependency Error When Installing PostgreSQL 17 on Oracle Linux 8 Background While preparing a fresh Oracle Linux 8 server for a..."
pubDate: 2025-05-08
tags: ["PostgreSQL", "Setup"]
featured: false
readingTime: "1 dk okuma"
---

# Fixing _perl(IPC::Run)_ Dependency Error When Installing PostgreSQL 17 on Oracle Linux 8

## Background

While preparing a fresh Oracle Linux 8 server for a PostgreSQL 17 deployment, an attempt to install all PostgreSQL packages in one go failed with an unsatisfied dependency error:

```text
Problem 1: cannot install the best candidate for the job
- nothing provides perl(IPC::Run) needed by postgresql17-devel-17.4-1PGDG.rhel8.x86_64
...
```

 

## Root Cause

The `perl(IPC::Run)` module (along with several tool‑chain libraries) resides in the **CodeReady Builder** repository, which is _disabled by default_ on Oracle Linux 8. Because `postgresql17-devel` and `postgresql17-test` depend on that module, `dnf`/`yum` cannot resolve the full dependency tree unless the repository is enabled.

CodeReady Builder hosts developer‑oriented packages—compilers, debuggers, Perl/Python modules—that many “‑devel” RPMs rely on.

## Solution

  1. Enable the **CodeReady Builder** repository:

```bash
sudo dnf config-manager --enable ol8_codeready_builder
```

 
  2. Rerun the installation command:

```bash
sudo yum install postgresql17*
```

 

With the additional channel enabled, `dnf` successfully pulled in `perl(IPC::Run)` and the entire PostgreSQL 17 toolchain (devel, contrib, docs, plperl, plpython, etc.) installed without further issues.

## Verification & Post‑Install Tasks

Confirm package presence:

```bash
rpm -qa | grep ^postgresql17
```

 

Initialize and start the database cluster:

```bash
sudo /usr/pgsql-17/bin/postgresql-17-setup initdb
sudo systemctl enable --now postgresql-17
```

 

## Key Takeaways

  * Developer packages frequently depend on CodeReady Builder content.
  * Check repository status with `dnf repolist all` before large installs.
  * Use `--enablerepo` for one‑off operations if you prefer not to keep CodeReady Builder enabled permanently.
