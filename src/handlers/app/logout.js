/* @flow */

import type { LambdaHandler } from 'custom-types';

const config = require('config');
const cookie = require('cookie');

const baseUri = config.get('app.baseUri');

const handler: LambdaHandler = (event, context, callback) => {
  callback(null, {
    statusCode: 302,
    body: '',
    headers: {
      Location: baseUri,
      'Set-Cookie': cookie.serialize('rtoken', 'deleted', {
        httpOnly: true,
        maxAge: -1,
        path: '/',
      }),
    },
  });
};

module.exports = handler;
