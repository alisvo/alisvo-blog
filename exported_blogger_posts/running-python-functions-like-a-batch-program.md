---
title: "Running Python Functions like a Batch Program"
description: "When you need to automatize some batch operations via Python, you can create a function array and loop through it in order to run them from the start. Here..."
pubDate: 2023-10-04
tags: ["Loops", "Python", "Scripting"]
featured: false
readingTime: "1 dk okuma"
---

When you need to automatize some batch operations via Python, you can create a function array and loop through it in order to run them from the start. Here is an example:

from functions import *

  

def main():

functions=[(BackupDB,(backupname,dbtype)),(ZipBackup,(backupname,)),(RemoveOldBackups,())]

for func,args in functions:  

result=func(*args)  

function_name=func.__name__  

if result == 0:  

print(f"{function_name} step has been completed")

else:  

print(f"{function_name} step has errors. Program has been stopped.")  

return  

  

main()

  

As you can see, you can define parameters by opening another bracket after comma(,) in the function array. If no parameters, then only open and close a bracket and that's it.
