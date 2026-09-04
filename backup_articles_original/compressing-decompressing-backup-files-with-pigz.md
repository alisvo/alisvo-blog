---
title: "Compressing / Decompressing  Backup Files With Pigz"
description: "1. Check Required Packages Ensure the yum packages openssl and pigz are installed on your system. 2. Compress and Encrypt Files Use the following command to..."
pubDate: 2022-04-20
updatedDate: 2024-11-07
tags: ["Compress", "Linux", "Pigz"]
featured: false
readingTime: "1 dk okuma"
---

## 1\. Check Required Packages

Ensure the `yum` packages `openssl` and `pigz` are installed on your system.

## 2\. Compress and Encrypt Files

Use the following command to compress and encrypt files:

```text
tar -c -I pigz backup.dmp | openssl enc -aes-256-cbc -e -k mypassword > backup.tar.gz.enc
```

 

## 3\. Decrypt and Decompress Files

Use the following command to decrypt and decompress files:

```text
openssl enc -aes-256-cbc -d -in backup.tar.gz | tar -I pigz -x
```


