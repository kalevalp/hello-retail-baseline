#!/bin/sh

echo $1 in $2
if cd $2
then
  npm install -s
  exit $?
else
  exit $?
fi
