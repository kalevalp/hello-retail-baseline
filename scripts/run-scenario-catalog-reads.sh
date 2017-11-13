#!/usr/bin/env bash

for i in {0..9}
do
  time for j in {0..29}
  do
    curl -w "\n" -X GET $1
  done
done

for i in {0..9}
do
  time for j in {0..29}
  do
    curl -w "\n" -X GET $2'?category=Things'
  done
done
