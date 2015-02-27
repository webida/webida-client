#!/bin/bash

# rewrite client ID to app-config.js for system client apps

echo "Rewrite Client ID[$1] to spp-config.js"

SCRIPT_PATH=`dirname -- $0`
CLIENT_ID=$1
CONFIG_FILE_PATH=${SCRIPT_PATH}'/../commons/src/webida/'
CONFIG_FILE='app-config.js'

sed -i.bak "s/\(clientId[\: \t]*\)'[0-9a-zA-Z_]*'/\1'$CLIENT_ID'/" ${CONFIG_FILE_PATH}${CONFIG_FILE}
