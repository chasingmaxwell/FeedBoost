/* @flow */

import type { LambdaHandler, APIGatewayResponse } from 'custom-types';

const config = require('config');
const Token = require('../../lib/token');
const User = require('../../lib/user');

const { host: reverbHost, key: reverbKey, redirectPath } = config.get('reverb');
const { baseUri } = config.get('app');

const handler: LambdaHandler<APIGatewayResponse> = (
  event
): Promise<APIGatewayResponse> => {
  const cookieString =
    typeof event.headers.Cookie !== 'undefined' ? event.headers.Cookie : '';

  // Get the token.
  return (
    Promise.resolve()

      // Try to get the token from the cookie.
      .then(() => Token.getFromCookie(cookieString))

      // Get the user.
      .then((token) => User.getFromToken(token))

      // Redirect to the homepage if we already have a user.
      .then(() => ({
        statusCode: 302,
        body: '',
        headers: {
          Location: baseUri,
        },
      }))

      .catch(() => ({
        statusCode: 302,
        body: '',
        headers: {
          Location: `${reverbHost}/oauth/authorize?client_id=${reverbKey}&redirect_uri=${baseUri}${redirectPath}&response_type=code&scope=read_lists+read_profile&state=${Token.sign(
            reverbKey
          )}`,
        },
      }))
  );
};

module.exports = handler;
