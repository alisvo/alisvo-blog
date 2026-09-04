---
title: "Run Scripts in the Background Via Nohup"
description: "How to run long-running shell scripts in the background and redirect output to a log file using nohup and disown."
pubDate: 2022-06-10
tags: ["Linux", "Bash", "Shell"]
featured: false
readingTime: "1 dk okuma"
---

You can run scripts in the background and safely redirect standard output and standard error to a log file using the command below:

```bash
nohup sh myscript.sh > myscript.log 2>&1 & disown
```

This creates an independent background process detached from your current terminal session. You can monitor progress anytime using:

```bash
tail -f myscript.log
```
