#!/usr/bin/env bash

curl -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000001"}' $1
curl -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000002"}' $1
curl -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000003"}' $1
curl -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000004"}' $1

sleep 10;

curl -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000005"}' $1
curl -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000006"}' $1
curl -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000007"}' $1
curl -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000008"}' $1

sleep 10;

curl -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000009"}' $1
curl -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000010"}' $1
curl -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000011"}' $1
curl -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000012"}' $1
