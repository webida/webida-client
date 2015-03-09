#!/bin/bash

MYPATH="/webida/fs/xkADkKcOW"
find $MYPATH -not -path "$MYPATH/backup*" -print0 |xargs -0 -n 1 setfattr -n "user.wfs.acl" -v "{\"@PUBLIC\":\"r\"}"
