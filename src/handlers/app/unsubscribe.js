/* @flow */

import type { LambdaHandler, APIGatewayResponse } from 'custom-types';

const util = require('../../util');
const config = require('config');
const User = require('../../lib/user');
const Cryptr = require('cryptr');

const cryptrKey = config.get('app.cryptrKey');

const handler: LambdaHandler<APIGatewayResponse> = async (
  event
): Promise<APIGatewayResponse> => {
  const cryptr = new Cryptr(cryptrKey);
  const email = cryptr.decrypt(
    decodeURIComponent(util.path(['pathParameters', 'hash'])(event) || '')
  );

  await User.delete(email);

  // Return a 200 response.
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: '{"message": "success"}',
  };
};

module.exports = handler;
