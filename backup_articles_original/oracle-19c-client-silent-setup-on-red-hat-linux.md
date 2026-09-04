---
title: "Oracle 19C Client Silent Setup On Red Hat Linux"
description: "To install the Oracle Database Client with the necessary patches, follow the steps below: 1. Install Pre-requisite RPM You might need to install some..."
pubDate: 2024-04-02
updatedDate: 2024-11-07
tags: ["Client", "Linux", "Oracle"]
featured: false
readingTime: "1 dk okuma"
---

To install the Oracle Database Client with the necessary patches, follow the steps below:

## 1\. Install Pre-requisite RPM

You might need to install some packages. Check if the `oracle-database-preinstall` RPM is available in your repository or search for it online (e.g., [yum.oracle.com](<https://yum.oracle.com>)):

```text
oracle-database-preinstall-19c-1.0-2.el8.x86_64.rpm
```

 

Install it using:

```text
rpm -ivh oracle-database-preinstall-19c-1.0-2.el8.x86_64.rpm
```

 

## 2\. Download Required Files

Download the following from the official Oracle website:

  * `LINUX.X64_193000_client.zip`
  * Latest OPatch and Database Patches:
    * OPatch: `6880880`
    * DB Patch: `35943157`

Transfer all files to a suitable location, such as `/tmp`. Ensure your system has at least **150 MB of swap memory**.

## 3\. Update Environment Variables

As the `oracle` user, add the following lines to your `.bash_profile`:

```bash
PATH=$PATH:$HOME/.local/bin:$HOME/bin

export ORACLE_BASE=/opt/oracle/
export ORACLE_HOME=/opt/oracle/product/19/client
export PATH=$ORACLE_HOME/bin:$PATH
export TNS_ADMIN=$ORACLE_HOME/network/admin
export LD_LIBRARY_PATH=$ORACLE_HOME/lib:/lib:/usr/lib

export CV_ASSUME_DISTID=OEL7.9
```

 

Ensure the directories exist:

```bash
mkdir -p /opt/oracle/product/19/client
chown oracle.oinstall /opt/oracle/product/19/client
chown oracle.oinstall /tmp/*.zip
```

 

## 4\. Unzip Files

Unzip the client and patch files into a directory that is not marked as `noexec` in `/etc/fstab`:

```text
cd /tmp
unzip -oq LINUX.X64_193000_client.zip
unzip -oq p35943157_190000_Linux-x86-64.zip
unzip -oq p6880880_190000_Linux-x86-64.zip
```

 

## 5\. Modify the Response File

Edit the `client_install.rsp` file located in the client setup folder:

```text
vi /tmp/client/response/client_install.rsp
```

 

Set the following values:

```text
UNIX_GROUP_NAME=oinstall
INVENTORY_LOCATION=/opt/oracle/oraInventory
ORACLE_HOME=/opt/oracle/product/19/client
ORACLE_BASE=/opt/oracle
oracle.install.client.installType=Administrator
```

 

## 6\. Run the Installer

Run the installer in silent mode:

```text
cd /tmp/client
./runInstaller -silent -responseFile /tmp/client/response/client_install.rsp -J-Djava.io.tmpdir=/some_temp_dir waitForCompletion=true
```

 

Follow the output and ensure there are no errors.

## 7\. Final Steps

After installation, configure `tnsnames.ora` and apply the downloaded patches as needed.

## Conclusion

This guide helps you set up the Oracle Database Client along with necessary patches efficiently. Ensure you follow each step carefully to avoid common issues.
