#!/bin/sh
export SLS_DEBUG=*

echo Running Unit Tests
npm run test

echo Running Code Linting
npm run lint

# echo Deploying Build Infrastructure
# cd $CODEBUILD_SRC_DIR/build
# sls deploy -s $STAGE

echo Deploying Retail Stream
cd $CODEBUILD_SRC_DIR/retail-stream
sls deploy -s $STAGE

echo Deploying New Products Simulator
cd $CODEBUILD_SRC_DIR/products/lambda
sls deploy -s $STAGE

echo Deploying Product Catalog Processor
cd $CODEBUILD_SRC_DIR/product-catalog
sls deploy -s $STAGE
