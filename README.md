# Hello, Retail!  [![Build Status](https://travis-ci.org/Nordstrom/hello-retail.svg)](https://travis-ci.org/Nordstrom/hello-retail)

Hello, Retail! is a Nordstrom Technology open-source project. Hello, Retail! is a 100% serverless, event-driven framework and functional proof-of-concept showcasing a central unified log approach as applied to the retail problem space. All code and patterns are intended to be re-usable for scalable applications large and small.

Check out https://github.com/Nordstrom/hello-retail-workshop for more explanation and a guided tour of how you might expand hello-retail with new functionality.

# Usage

If you are responsible for deploying this system, you'll want to do the following:

## Pre-Deploy Action & Configuration

1. Create an encryption key for use with KMS (`IAM` > `Encryption keys`, select your target region, `Create Key`)

2. Create a Twilio account, open your "Account Settings" and create a secondary auth token for use by the hello-retail system

3. Encrypt your Twilio account's SID and also the Secondary Auth Token with the encryption key created in step 1 and place them into your private.yml:

  ```yaml
  twilio:
    accountSid: ABC[...]==
    authToken: DEF[...]==
  ```

  this can be done easily using the "encryption helpers" capability in the Lambda console.  Alternatively, the following AWS CLI command should do the trick:

  ```bash
  aws kms encrypt --region <region> --key-id <keyId> --plaintext <accountSid> --output text --query CiphertextBlob
  aws kms encrypt --region <region> --key-id <keyId> --plaintext <authToken> --output text --query CiphertextBlob
  ```

4. Purchase a Twilio number and add it to your `private.yml`:

  ```yaml
  twilio:
    <stage>: +12345678901 # full `+<countryCode>` and 10 digit number
  ```

5. Create an [Login with Amazon](http://login.amazon.com/) account to add authentication and identity using oAuth.

6. In the *Login with Amazon Developer Center* -> Sign into the *App Console* -> *Register new application* button. Fill out requested information about the application.

7. Copy the _Application ID_ to the `private.yml` in the property `loginWithAmazonAppId` and the _Client ID_ to the property `loginWithAmazonClientId`:

```yaml
# Login with Amazon
loginWithAmazonClientId: amzn1.application-oa2-client.0c5b13fba4be0ae5b7c1816481fc93a
loginWithAmazonAppId: amzn1.application.0bfd7ce688a440a1a0a1ad215923053e1
```

8. Expand *Web Settings* and click the *Edit* button.

9. In the *Allowed JavaScript Origins* enter the Fully Qualified Domain Name for your hosted websites, e.g. `https://<stage>.<example.com>` where `stage` will be the name of the stage web application when deployed, and `example.com` is the registered domain name. Local development requires that `https://localhost:7700` is allowed as an origin. This application does not employ return URLs. Once the list of origins is complete, click "Save". 

## Deploy

To deploy the entirety of the project, execute the following from the repository's root directory:

```bash
npm run root:install:all
npm run root:deploy:all
```

If an errors occur, troubleshoot, resolve, and resume deployment.

## Post-Deploy Action & Configuration

1. Add the following roles as "Key Users" of the encryption key created in step 1 of the "Pre-Deploy Action & Configuration" section
  * `<stage>ProductPhotosMessage1`
  * `<stage>ProductPhotosUnmessage1`
  * `<stage>ReceiveRole1`

2. Note the `ServiceEndpoint` output from the execution of `npm run photos:deploy:5`.  Alternatively, inspect or describe the stack `hello-retail-product-photos-receive-<stage>` and note the `ServiceEndpoint` output.  This value will look like `https://<apiId>.execute-api.us-west-2.amazonaws.com/<stage>`.  Open the phone number configuration page for the Twilio number that you purchased and set the Messaging Webhook (use defaults "Webhooks/TwiML", "Webhook", and "HTTP POST") value to that value with a `/sms` appended to it (e.g. `https://<apiId>.execute-api.us-west-2.amazonaws.com/<stage>/sms`).  It may be helpful to note the stage name in the "Friendly Name" field as well.  Then save those configuration changes.

3. Enable TTL on the table `<stage>-hello-retail-product-photos-data-PhotoRegistrations-1` using the attribute `timeToLive`

## Event API:

#### purchaseProduct:
    {
        schema: 'com.nordstrom/product/purchase/1-0-0',
        id: <productid>, 
        origin: `hello-retail/web-client-purchase-product/${this.props.awsLogin.state.profile.id}/${this.props.awsLogin.state.profile.name}`,
    }

#### sendUserLogin
    {
        schema: 'com.nordstrom/user-info/login/1-0-0',
        id: <userId>,
        name: <userName>,
        origin: `hello-retail/web-client-login-user/${this.state.profile.id}/${this.state.profile.name}`,
    }    

#### createProduct
    {
      schema: 'com.nordstrom/product/create/1-0-0',
      id: (`0000000${Math.floor(Math.abs(Math.random() * 10000000))}`).substr(-7),
      origin: `hello-retail/web-client-create-product/${this.props.awsLogin.state.profile.id}/${this.props.awsLogin.state.profile.name}`,
      category: <productCategory>,
      name: <productName>,
      brand: <productBrand>,
      description: <productDescription>,
    }

#### updatePhotographer
      schema: 'com.nordstrom/user-info/update-phone/1-0-0',
      id: <userId>,
      phone: <phoneNumber>,
      origin: `hello-retail/web-client-update-phone/${this.props.awsLogin.state.profile.id}/${this.props.awsLogin.state.profile.name}`,

#### Example events and curl commands to execute them
      '{ "schema": "com.nordstrom/product/purchase/1-0-0", "id": "123456", "origin": "secure-hello-retail/test-script-purchase-product/123456" }'
      
      '{ "schema": "com.nordstrom/user-info/login/1-0-0", "id": "654321", "name": "Joe Schmoe", "origin": "hello-retail/test-script-login-user/654321/JoeSchmoe" }'    
      
      '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567890", "origin": "hello-retail/test-script-create-product/testid/testname", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything" }'
      
      '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654321", "phone": "5551231234", "origin": "hello-retail/test-script-update-phone/testid/testname" }'
      
      curl -X POST --data '{ "schema": "com.nordstrom/product/purchase/1-0-0", "id": "123456", "origin": "secure-hello-retail/test-script-purchase-product/123456" }' https://bkc30zi\k06.execute-api.us-west-2.amazonaws.com/dev/event-writer
      
      curl -X POST --data '{ "schema": "com.nordstrom/user-info/login/1-0-0", "id": "654321", "name": "Joe Schmoe", "origin": "hello-retail/test-script-login-user/654321/JoeSchmoe" }' https://bkc30zi\k06.execute-api.us-west-2.amazonaws.com/dev/event-writer    
      
      curl -X POST --data '{ "schema": "com.nordstrom/product/create/1-0-0", "id": "1234567890", "origin": "hello-retail/test-script-create-product/testid/testname", "category": "Things", "name": "A sort of thing", "brand": "ACME", "description": "A sort of thing from a company that makes everything" }' https://bkc30zi\k06.execute-api.us-west-2.amazonaws.com/dev/event-writer
      
      curl -X POST --data '{ "schema": "com.nordstrom/user-info/update-phone/1-0-0", "id": "654321", "phone": "5551231234", "origin": "hello-retail/test-script-update-phone/testid/testname" }' https://bkc30zi\k06.execute-api.us-west-2.amazonaws.com/dev/event-writer

#### Read data from kinesis stream      
      > aws kinesis get-shard-iterator --shard-id shardId-000000000008 --shard-iterator-type TRIM_HORIZON --stream-name devRetailStream
      > aws kinesis get-records --shard-iterator AAAAAAAAAAEJY2/JB8kxEWv3D2V67l9C5561+TJiUH8o01at2GLyiGkZ3XdQqAwAb7NysMj0ZXIT9Z1ActS3NKR14mIPMFQ+3k/NZenfQB4KMkPEc0JlWpWvEZSgISjysLGvVQPgArkvcfPNzB0L6pkES57SALvg/HlJIWV8BCiZPaYtsYx1ZZsKr0/yq98J9rayUwnNMoQ0L3Yj2wKlf01RcQDP5MOl
