---
title: "Warn yourself when your linux server isn't restarted for a while after an update (Python)"
description: "A Python script for RHEL, CentOS, and Oracle Enterprise Linux to alert administrators when a newly installed kernel hasn't been activated by a reboot."
pubDate: 2022-12-20
tags: ["Linux", "Python", "SysAdmin"]
featured: false
readingTime: "1 dk okuma"
---

This Python script inspects installed kernels on RHEL, CentOS, and Oracle Enterprise Linux (UEK) servers and alerts administrators if an updated kernel hasn't been activated via reboot:

```python
import subprocess
import datetime
import sys

# Get all installed UEK kernel packages
output = subprocess.check_output(["rpm", "-qa", "kernel-uek*"])
output = output.decode().strip().split("\n")

# Sort kernels by installation timestamp descending
output.sort(key=lambda x: subprocess.check_output(["rpm", "-q", "--queryformat", "%{INSTALLTIME}", x]))
output.reverse()

# Determine currently active kernel
active_kernel = subprocess.check_output(["uname", "-r"]).decode().strip()
active_kernel = "kernel-uek-" + active_kernel

if active_kernel == output[0]:
    print("Aktif kernel en guncel surumdedir.")
    sys.exit(0)
else:
    most_recent_install_date = subprocess.check_output(["rpm", "-q", "--queryformat", "%{INSTALLTIME}", output[0]])
    most_recent_install_date = datetime.datetime.fromtimestamp(int(most_recent_install_date))

    active_install_date = subprocess.check_output(["rpm", "-q", "--queryformat", "%{INSTALLTIME}", active_kernel])
    active_install_date = datetime.datetime.fromtimestamp(int(active_install_date))

    difference = (most_recent_install_date - active_install_date).days

    if difference > 30:
        print(f"Yeni kernel yuklemesinin uzerinden {difference} gun gecmistir. Etkinlestirmek icin sunucuyu yeniden baslatiniz.")
        sys.exit(2)
    elif difference > 7:
        print(f"Guncel kernel {difference} gun once yuklenmistir. Etkinlestirmek icin yeniden baslatabilirsiniz.")
        sys.exit(1)
    else:
        print(f"Guncel kernel {difference} gun once yuklenmistir.")
```
