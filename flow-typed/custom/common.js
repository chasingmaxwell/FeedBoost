/* @flow */

declare module 'custom-types' {
  declare type ObjectLiteral = { [string]: any };

  declare type ApiGatewayEvent = {
    body: ?string,
    headers: { [name: string]: string },
    httpMethod: string,
    isBase64Encoded: boolean,
    path: string,
    pathParameters: ?{ [name: string]: string },
    queryStringParameters: ?{ [name: string]: string },
    stageVariables: ?{ [name: string]: string },
    requestContext: {
      accountId: string,
      apiId: string,
      httpMethod: string,
      identity: {
        accessKey: ?string,
        accountId: ?string,
        apiKey: ?string,
        caller: ?string,
        cognitoAuthenticationProvider: ?string,
        cognitoAuthenticationType: ?string,
        cognitoIdentityId: ?string,
        cognitoIdentityPoolId: ?string,
        sourceIp: string,
        user: ?string,
        userAgent: ?string,
        userArn: ?string,
      },
      stage: string,
      requestId: string,
      resourceId: string,
      resourcePath: string,
    },
    resource: string,
  };

  declare type LambdaContext = {
    callbackWaitsForEmptyEventLoop: boolean,
    functionName: string,
    functionVersion: string,
    invokedFunctionArn: string,
    memoryLimitInMB: number,
    awsRequestId: string,
    logGroupName: string,
    logStreamName: string,
  };

  declare type LambdaCallback = (error: ?Error, result: ?any) => void;

  declare type LambdaHandler = (
    event: ApiGatewayEvent,
    context: LambdaContext,
    callback: LambdaCallback
  ) => void | Promise<void>;

  declare type Listing = {
    id: string,
    title: string,
    price: { display: string },
    _links: {
      [platform: string]: { href: string },
    },
  };

  declare type User = {
    code: string,
    email: string,
    listings?: Array<Listing>,
  };
}
