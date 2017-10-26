#!/usr/bin/env bash

curl -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567890", "origin": "hello-retail/test-script-create-product/testid/testname", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
