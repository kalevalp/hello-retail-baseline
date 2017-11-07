#!/usr/bin/env bash

for i in {0..500}
do
curl -w "\n" -X GET $1'?category=Things'
done
