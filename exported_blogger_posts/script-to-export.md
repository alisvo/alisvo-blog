---
title: "Script to export"
description: "Oracle expdp Export Job Script This bash script runs an Oracle Data Pump export (expdp) job with anonymized parameters (except the expdp binary path)...."
pubDate: 2025-02-14
tags: ["Backup & DR", "Expdp", "Oracle"]
featured: false
readingTime: "1 dk okuma"
---

# Oracle expdp Export Job Script

This bash script runs an Oracle Data Pump export (expdp) job with anonymized parameters (except the expdp binary path). Simply modify the variables in the script as needed.

```bash
#!/bin/bash
# This script runs an Oracle Data Pump export (expdp) job.
# Modify the variables below to change the export settings.

# Define variables for the export job
ORACLE_CONN="'/ as sysdba'"         # Oracle connection string
EXPDP_BIN="/u01/app/oracle/product/19/dbhome_1/bin/expdp"  # Oracle expdp binary (unchanged)
DIRECTORY="EXP_DIR"                 # Oracle directory object name
DUMPFILE="DUMPFILE.dmp"             # Dump file name
LOGFILE="LOGFILE.log"               # Log file name
SCHEMAS="SCHEMA1,SCHEMA2"           # Comma-separated list of schemas to export
PARALLELITY="1"                     # Parallel export degree

# Log the job details
echo "Starting export job at $(date)"
echo "Schemas: $SCHEMAS"
echo "Directory: $DIRECTORY"
echo "Dumpfile: $DUMPFILE"
echo "Logfile: $LOGFILE"
echo "Parallelity: $PARALLELITY"

# Run the expdp job in the background using nohup
nohup ${EXPDP_BIN} ${ORACLE_CONN} \
    directory=${DIRECTORY} \
    dumpfile=${DUMPFILE} \
    logfile=${LOGFILE} \
    schemas=${SCHEMAS} \
    parallel=${PARALLELITY} \
    compression=ALL \
    CONSISTENT=TRUE &

echo "Export job submitted. Check nohup.out for progress."

exit 0
```


