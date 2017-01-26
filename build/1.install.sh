#!/bin/sh

# begin debug
echo $1
echo $2
# end debug

echo $1
if cd $2
then
  npm install -s
  exit $?
else
  exit $?
fi
