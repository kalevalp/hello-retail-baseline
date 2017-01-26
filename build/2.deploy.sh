#!/bin/sh

# begin debug
export SLS_DEBUG=*
echo $SLS_DEBUG
echo $STAGE
echo $1
echo $2
# end debug

echo $1
if cd $2
then
  sls deploy -s $STAGE
  exit $?
else
  exit $?
fi
