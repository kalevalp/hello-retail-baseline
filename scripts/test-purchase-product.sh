#!/usr/bin/env bash

curl -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000001"}' $1
