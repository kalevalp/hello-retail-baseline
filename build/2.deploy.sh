#!/bin/sh

# begin debug
export SLS_DEBUG=*
# end debug

echo
echo $1 in $2
OWD = `pwd`
if cd $2
then
  if sls deploy -s ${STAGE} -v
  then
    while getopts vf: opt
    do
      case "$opt" in
        # step) sls deploy stepf -s ${STAGE} -v;; # we can use CloudFormation now
        \?) echo "ERROR: Unknown Flag $opt"; exit -1;;
      esac
    done
    cd $OWD
    exit $?
  else
    cd $OWD
    exit $?
  fi
else
  exit $?
fi
