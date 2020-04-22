/* @flow */

import type { LambdaHandler } from 'custom-types';

const config = require('config');
const Token = require('../../lib/token');
const User = require('../../lib/user');

const { host: reverbHost, key: reverbKey, redirectPath } = config.get('reverb');
const { baseUri } = config.get('app');

const handler: LambdaHandler = (event, context, callback) => {
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
      .then(() => {
        callback(null, {
          statusCode: 302,
          body: '',
          headers: {
            Location: baseUri,
          },
        });
      })

      .catch(() => {
        const state = Token.sign(reverbKey);
        callback(null, {
          statusCode: 302,
          body: '',
          headers: {
            Location: `${reverbHost}/oauth/authorize?client_id=${reverbKey}&redirect_uri=${baseUri}${redirectPath}&response_type=code&scope=read_lists+read_profile&state=${state}`,
          },
        });
      })
  );
};

module.exports = handler;
