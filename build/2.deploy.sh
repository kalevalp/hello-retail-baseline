#!/bin/sh

# begin debug
export SLS_DEBUG=*
# end debug

echo
echo $1 in $2
if cd $2
then
  if sls deploy -s ${STAGE} -v
  then
    while getopts vf: opt
    do
      case "$opt" in
        step) sls deploy stepf -s ${STAGE} -v;;
        \?) echo "ERROR: Unknown Flag $opt"; exit -1;;
      esac
    done
    exit $?
  else
    exit $?
  fi
else
  exit $?
fi
