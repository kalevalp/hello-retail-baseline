#!/usr/bin/env bash

for i in {0..300}
do
curl -w "\n" -X GET $1
done
