#!/bin/bash -x
# write build info to package.json
# by sujin0830.lee

# cd to sript directory
SCRIPTPATH=`dirname -- $0`
cd $SCRIPTPATH
# set variable
# 1 : BUILD_ID
# 2 : BUILD_NUMBER
# 3 : BUILD_TAG

# setting variable
file="package.json"
mvfile="package.json.new"
gitfile="git.log"

# searach git commit id
rm $mvfile
git log > $gitfile

echo "{" > $mvfile

awk '{
if (NR ==1) {
print "    \"buildcommitid\":\"" $2 "\","
}
}' $gitfile >> $mvfile

echo "    \"buildid\" :\"$1\"," >> $mvfile
echo "    \"buildnumber\" :\"$2\"," >> $mvfile
echo "    \"buildtag\" :\"$3\"," >> $mvfile

awk '{
if ($0 ~/build/){ # || $0 ~/{/ || $0 ~/}/) {
} else {
print $0
}
}' ../$file >> $mvfile

echo "}" >> $mvfile

mv $mvfile ../$file
