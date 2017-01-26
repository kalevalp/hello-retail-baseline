#!/usr/bin/env bash
export SLS_DEBUG=*

echo Running Unit Tests
npm run test

echo Running Code Linting
npm run lint

# echo Deploying Build Infrastructure
# pushd build
#   sls deploy -s $STAGE
# popd

echo Deploying Retail Stream
pushd retail-stream
  sls deploy -s $STAGE
popd

echo Deploying New Products Simulator
pushd products/lambda
  sls deploy -s $STAGE
popd

echo Deploying Product Catalog Processor
pushd product-catalog
  sls deploy -s $STAGE
popd
