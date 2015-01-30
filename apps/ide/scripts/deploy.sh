#!/bin/bash -x
# Deploy src directory to webida server

USERNAME="webida"
PASSWORD="webida"
AUTHSERVER="https://auth.web2da.core1"
APPSERVER="https://web2da.core1"
REDIRECT_URI="https://devenv.web2da.core1/auth.html"

curl -b cookie.jar -c cookie.jar -k -L -d "username=$USERNAME&password=$PASSWORD" "$AUTHSERVER/login"
RESPONSE=$(curl -I -k -L  -b cookie.jar -c cookie.jar "$AUTHSERVER/webida/api/oauth/authorize?response_type=token&redirect_uri=$REDIRECT_URI&client_id=Zu1j2lUb9yM6UM3r&skip_decision=true&type=web_server"|grep "access_token")
TOKEN=$(echo $RESPONSE | sed -n "s/.*access_token=\([0-9A-Za-z,]*\).*/\1/p")

cd ../src
RESULT=$(tar czpf - * | curl -k -X POST -F content=@- "$APPSERVER/webida/api/app/deploy?access_token=$TOKEN")
if [ `echo $RESULT | grep \"result\"\:\"ok\"` ] ; then
  echo "IDE deploy success."
else
  exit 1
fi
