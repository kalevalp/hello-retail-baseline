# Hello Retail Web Application
`hello-retail/web`

Implements the front-end web interface for interacting with the Hello Retail application, providing
for Merchants, Photographers and Customers.

## Stages
* __Test__ - [https://test.hello-retail.biz](https://test.hello-retail.biz) environment used to validate feature work
* __Prod__ - [https://hello-retail.biz](https://hello-retail.biz) stable publicly available environment
* __Demo__ - [https://demo.hello-retail.biz](https://demo.hello-retail.biz) stable environment showing latest working features

## Prerequisites

* TODO: Mention or explain use of `private.yml` What is minimum content for web app?
* TODO: Describe what AWS auth is necessary for these commands to work.

## Build
To build the application, run the following command _npm_ command
providing the stage to use:

```bash
npm web:build:<stage>
```

for example, `npm web:build:prod` to build the web application stack for the production environment.

The build is performed in two steps:

1. The SLS plugin `web-app-config-plugin` is used to read the service definition (`serverless.yml`) 
and write the configuration file (`config.js`) imported by the web application. 

2. Webpack is then used to package the application which results in the `bundle.js` file in the `/app` folder.

Once the build is complete, the application in the `/app` folder will run using the back-end stack
 from the specified stage. See the _Run_ section below on how to run the app locally to develop or test 
 using that back-end stage.
 
## Run
To run the application locally for development or testing, run the following _npm_ command:

```bash
npm web:dev:hot
```

Open [http://localhost:7700](http://localhost:7700) in your browser.

This command will launch the `webpack-dev-server` that provides a local web server which will serve the 
application as it is currently built from the `/app` folder. Since the build application has the stage 
provided for it via the `config.js` file, there's no need to specify a stage to use.

### Authentication

The application uses [Login with Amazon](https://login.amazon.com/) as its oAuth provider. The user is
asked to login with their **Amazon.com** account credentials and verify that they trust the application 
(named HELLO-RETAIL-WEB-APP). Follow the link to create a new account if one is needed.

#### Application Identity

To provide an identity to the login service, the application registers and is provided a client application
ID. The registration is a one-time process and that app ID is provided via the configuration file.

#### Allowed Origins

Since the oAuth only permits secure endpoints (or local ones for development purposes) only specific
domain and port combinations are white-listed to allow authentication to work. _These include only the domains 
listed at the top of this document, as well as the local development address above._

Allowed origins may be added or removed from the authentication provider's console under the settings
for individual applications.

## Deployment

To deploy the application to a specific stage, use the following _npm_ command:

```bash
npm web:deploy:<stage>
```

for example, `npm web:deploy:demo` will deploy the currently built application to the *demo* stage
hosted in AWS.

This deployment uses the Serverless framework's `deploy` command to provision the necessary AWS
 infrastructure needed to securely host the application, including:
 
 * S3 Bucket to contain the hosted files
 * CloudFront Distribution to provide SSL transport
 * Route 53 Records to define DNS entries
 * IAM Roles to control web app access


## Test

* TODO: Explain once implemented
 
