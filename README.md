# Hello Retail!  [![Build Status](https://travis-ci.org/Nordstrom/hello-retail.svg)](https://travis-ci.org/Nordstrom/hello-retail)

Hello Retail is a 100% serverless, event-driven framework for showcasing a central unified log approach as applied to a retail problem set.

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

7. Copy the _Application ID_ to the `private.yml` in the property `loginWithAmazonAppId` and the _Client ID_ to the property `loginWithAmazonClientId`. 

8. Expand *Web Settings* and click the *Edit* button.

9. In the *Allowed JavaScript Origins* enter the Fully Qualified Domain Name for your hosted websites, e.g. `https://hello-retail.biz`. Local development requires that `https://localhost:7700` is allowed as an origin. This application does not employ return URLs. Once the list of origins is complete, click "Save". 

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
