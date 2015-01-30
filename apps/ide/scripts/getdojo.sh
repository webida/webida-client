#!/bin/bash -x

mkdir -p dojo-release-1.9.1-src
cd dojo-release-1.9.1-src

if [ ! -d "dojo" ]; then
  git clone https://github.com/dojo/dojo
  cd dojo
  git checkout 1.9.1
  cd ..
fi

if [ ! -d "dijit" ]; then
  git clone https://github.com/dojo/dijit
  cd dijit
  git checkout 1.9.1
  cd ..
fi

if [ ! -d "dojox" ]; then
  git clone https://github.com/dojo/dojox
  cd dojox
  git checkout 1.9.1
  cd ..
fi

if [ ! -d "util" ]; then
git clone https://github.com/dojo/util
  cd util
  git checkout 1.9.1
  cd ..
fi

cd ..