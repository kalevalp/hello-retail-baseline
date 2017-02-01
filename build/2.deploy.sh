#!/bin/sh

# begin debug
export SLS_DEBUG=*
# end debug

echo
echo $1 in $2
if cd $2
then
  sls deploy -s ${STAGE} -v
  exit $?
fi
