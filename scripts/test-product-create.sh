#!/usr/bin/env bash

curl -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567890", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 5
curl -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567891", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 5
curl -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567892", "origin": "hello-retail/test-script-create-product/testid/mary", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 5
curl -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567893", "origin": "hello-retail/test-script-create-product/testid/mary", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
