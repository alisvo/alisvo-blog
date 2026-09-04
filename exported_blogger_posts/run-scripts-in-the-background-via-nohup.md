---
title: "Run Scripts in the Background Via Nohup"
description: "We can run our scripts in background & write output to a log file as below: nohup sh myscript.sh > myscript.log 2>&1 & disown That will create a separate..."
pubDate: 2022-06-10
tags: ["Linux"]
featured: false
readingTime: "1 dk okuma"
---

We can run our scripts in background & write output to a log file as below:

_nohup sh myscript.sh > myscript.log 2>&1 & disown_

That will create a separate process that runs the script, and you can tail the log for output & errors.
