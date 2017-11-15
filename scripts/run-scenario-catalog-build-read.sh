#!/usr/bin/env bash


for i in {0..29}
do
  echo $i

  curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654321", "phone": "5551231234", "origin": "hello-retail/test-script-update-phone/testid/peter" }' $1
  curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654322", "phone": "5551231235", "origin": "hello-retail/test-script-update-phone/testid/paul" }' $1

  sleep 5
  curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567890'$i'", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
  sleep 5
  curl -w "\n" -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567891'$i'", "origin": "hello-retail/test-script-create-product/testid/mark", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything", "price": "10" }' $1
  sleep 30

  curl -w "\n" -X POST --data '{ "MediaUrl0": "https://cdn.shopify.com/s/files/1/2174/7307/products/ACMEInventorySeries_Magnet_FringeFocus_Large_df22d76c-1009-46b7-8cfa-ddfb00cb08c9_1024x1024.png", "MediaContentType0": "image/jpeg", "From": 15551231234 }' $2
  curl -w "\n" -X POST --data '{ "MediaUrl0": "https://cdn.shopify.com/s/files/1/2174/7307/products/ACMEInventorySeries_Magnet_FringeFocus_Large_df22d76c-1009-46b7-8cfa-ddfb00cb08c9_1024x1024.png", "MediaContentType0": "image/jpeg", "From": 15551231235 }' $2

done

time for j in {0..59}
do
  curl -X GET $3
  curl -X GET $4'?category=Things'
done
