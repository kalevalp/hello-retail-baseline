#!/bin/sh

echo $1 in $2
if cd $2
then
  if npm install
  then
    exit $?
  else
    NPM_INSTALL_RESULT=$?
    tail -n 100 npm-debug.log
    exit $NPM_INSTALL_RESULT
  fi
else
  exit $?
fi
