#!/bin/sh

echo Installing Top-Level Project Dependencies
npm install -s

echo Installing New Product Simulator Dependencies
cd $CODEBUILD_SRC_DIR/products/lambda
npm install -s

echo Installing Product Catalog Dependencies
cd $CODEBUILD_SRC_DIR/product-catalog
npm install -s
