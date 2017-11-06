#!/usr/bin/env bash

for i in {0..30}
do
curl -w "\n" -X GET $1'?category=Things'
done
