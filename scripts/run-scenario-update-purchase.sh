#!/usr/bin/env bash

curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654321", "phone": "5551231234", "origin": "hello-retail/test-script-update-phone/testid/peter" }' $1
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654322", "phone": "5551231235", "origin": "hello-retail/test-script-update-phone/testid/paul" }' $1

sleep 5
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567890", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 5
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567891", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 30

curl -w "\n" -X POST --data '{ "MediaUrl0": "https://cdn.shopify.com/s/files/1/2174/7307/products/ACMEInventorySeries_Magnet_FringeFocus_Large_df22d76c-1009-46b7-8cfa-ddfb00cb08c9_1024x1024.png", "MediaContentType0": "image/jpeg", "From": 15551231234 }' $2
curl -w "\n" -X POST --data '{ "MediaUrl0": "https://cdn.shopify.com/s/files/1/2174/7307/products/ACMEInventorySeries_Magnet_FringeFocus_Large_df22d76c-1009-46b7-8cfa-ddfb00cb08c9_1024x1024.png", "MediaContentType0": "image/jpeg", "From": 15551231235 }' $2

sleep 30

curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654321", "phone": "5551231234", "origin": "hello-retail/test-script-update-phone/testid/peter" }' $1
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654322", "phone": "5551231235", "origin": "hello-retail/test-script-update-phone/testid/paul" }' $1

sleep 5
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567892", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 5
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567893", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 30

curl -w "\n" -X POST --data '{ "MediaUrl0": "https://cdn.shopify.com/s/files/1/2174/7307/products/ACMEInventorySeries_Magnet_FringeFocus_Large_df22d76c-1009-46b7-8cfa-ddfb00cb08c9_1024x1024.png", "MediaContentType0": "image/jpeg", "From": 15551231234 }' $2
curl -w "\n" -X POST --data '{ "MediaUrl0": "https://cdn.shopify.com/s/files/1/2174/7307/products/ACMEInventorySeries_Magnet_FringeFocus_Large_df22d76c-1009-46b7-8cfa-ddfb00cb08c9_1024x1024.png", "MediaContentType0": "image/jpeg", "From": 15551231235 }' $2

sleep 30

curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654321", "phone": "5551231234", "origin": "hello-retail/test-script-update-phone/testid/peter" }' $1
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654322", "phone": "5551231235", "origin": "hello-retail/test-script-update-phone/testid/paul" }' $1

sleep 5
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567894", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 5
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567895", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 30

curl -w "\n" -X POST --data '{ "MediaUrl0": "https://cdn.shopify.com/s/files/1/2174/7307/products/ACMEInventorySeries_Magnet_FringeFocus_Large_df22d76c-1009-46b7-8cfa-ddfb00cb08c9_1024x1024.png", "MediaContentType0": "image/jpeg", "From": 15551231234 }' $2
curl -w "\n" -X POST --data '{ "MediaUrl0": "https://cdn.shopify.com/s/files/1/2174/7307/products/ACMEInventorySeries_Magnet_FringeFocus_Large_df22d76c-1009-46b7-8cfa-ddfb00cb08c9_1024x1024.png", "MediaContentType0": "image/jpeg", "From": 15551231235 }' $2

sleep 30

curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654321", "phone": "5551231234", "origin": "hello-retail/test-script-update-phone/testid/peter" }' $1
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654322", "phone": "5551231235", "origin": "hello-retail/test-script-update-phone/testid/paul" }' $1

sleep 5
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567896", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 5
curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567897", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
sleep 30

curl -w "\n" -X POST --data '{ "MediaUrl0": "https://cdn.shopify.com/s/files/1/2174/7307/products/ACMEInventorySeries_Magnet_FringeFocus_Large_df22d76c-1009-46b7-8cfa-ddfb00cb08c9_1024x1024.png", "MediaContentType0": "image/jpeg", "From": 15551231234 }' $2
curl -w "\n" -X POST --data '{ "MediaUrl0": "https://cdn.shopify.com/s/files/1/2174/7307/products/ACMEInventorySeries_Magnet_FringeFocus_Large_df22d76c-1009-46b7-8cfa-ddfb00cb08c9_1024x1024.png", "MediaContentType0": "image/jpeg", "From": 15551231235 }' $2

curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000001"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000002"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000003"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000004"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000005"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000006"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000007"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000008"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000009"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000010"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000011"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000012"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000013"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000014"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000015"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000016"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000017"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000018"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000019"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000020"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000021"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000022"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000023"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000024"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000025"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000026"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000027"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000028"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000029"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000030"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000031"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000032"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000033"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000034"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000035"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000036"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000037"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000038"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000039"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000040"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000041"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000042"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000043"}' $3
curl -w "\n" -X POST --data '{"user": "Alice", "pass": "alicespassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341235", "requestId": "0000044"}' $3

sleep 10;

curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567890", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000045"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567891", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000046"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567892", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000047"}' $3
curl -w "\n" -X POST --data '{"user": "Bob", "pass": "bobspassword", "id": "1234567893", "storeCC" : true, "creditCard" : "1234123412341234", "requestId": "0000048"}' $3
