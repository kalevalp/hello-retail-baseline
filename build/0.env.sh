#!/bin/sh

MSG="You must set the COMPANY, TEAM, REGION, STAGE environment variables"

fail=0
failMsg=""
check()
{
  if [ -z "${!1}" ]; then
    fail=`expr $fail + 1`
    if [ "${failMsg}" != "" ]; then
      failMsg+=", "
    fi
    failMsg+="${1} was set to \"${!1}\""
  fi
}

check COMPANY
check TEAM
check REGION
check STAGE

if [ $fail -ne 0 ]; then
  echo "Variables UNSET: ${failMsg}"
  echo "${MSG}"
  exit $fail
fi
