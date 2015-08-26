#!/bin/bash

# guestMode on

echo "guestMode on"

SCRIPT_PATH=`dirname -- $0`
CONFIG_FILE_PATH=${SCRIPT_PATH}'/../common/src/webida/'
CONFIG_FILE='app-config.js'

sed -i.bak "s/\(guestMode[\: \t]*\)false/\1true/" ${CONFIG_FILE_PATH}${CONFIG_FILE}
