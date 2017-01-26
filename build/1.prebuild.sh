#!/usr/bin/env bash

echo Installing Top-Level Project Dependencies
npm install -s

echo Installing New Product Simulator Dependencies
pushd products/lambda
  npm install -s
popd

echo Installing Product Catalog Dependencies
pushd product-catalog
  npm install -s
popd
