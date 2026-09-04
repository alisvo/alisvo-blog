---
title: "Warn yourself when your linux server isn't restarted for a while after an update (Python)"
description: "You can see the python code below. It's suitable for RHEL/Centos/OEL servers: import subprocess import datetime import sys output =..."
pubDate: 2022-12-20
tags: ["Linux", "Python"]
featured: false
readingTime: "1 dk okuma"
---

You can see the python code below. It's suitable for RHEL/Centos/OEL servers:

import subprocess

import datetime

import sys

  

output = subprocess.check_output(["rpm","-qa","kernel-uek*"])

output = output.decode().strip().split("\n")

  

output.sort(key=lambda x: subprocess.check_output(["rpm","-q","--queryformat","%{INSTALLTIME}",x]))

output.reverse()

  

active_kernel=subprocess.check_output(["uname","-r"]).decode().strip()

active_kernel="kernel-uek-"+active_kernel

#print(active_kernel)

#print(output[0])

if active_kernel == output[0]:

print("Aktif kernel en güncel sürümdedir.")

sys.exit(0)

else:

most_recent_install_date = subprocess.check_output(["rpm","-q", "--queryformat","%{INSTALLTIME}",output[0]])

most_recent_install_date = datetime.datetime.fromtimestamp(int(most_recent_install_date))

  

active_install_date = subprocess.check_output(["rpm","-q", "--queryformat","%{INSTALLTIME}",active_kernel])

active_install_date = datetime.datetime.fromtimestamp(int(active_install_date))

  

#current_date = datetime.datetime.now()

difference = (most_recent_install_date - active_install_date).days

#print(most_recent_install_date)

#print(active_install_date)

if difference > 30:

print(f"Yeni kernel yüklemesinin üzerinden {difference} gün geçmiştir. Etkinleştirmek için sunucuyu yeniden başlatınız.")

sys.exit(2)

elif difference > 7:

print(f"Güncel kernel {difference} gün önce yüklenmiştir.Etkinleştirmek için yeniden başlatabilirsiniz.")

sys.exit(1)

else:

print(f"Güncel kernel {difference} gün önce yüklenmiştir.")
