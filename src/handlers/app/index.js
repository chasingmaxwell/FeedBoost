/* @flow */

import type { LambdaHandler, APIGatewayResponse } from 'custom-types';

const home = require('./home.js');
const subscribe = require('./subscribe.js');
const unsubscribe = require('./unsubscribe.js');
const auth = require('./auth.js');
const logout = require('./logout.js');

module.exports = {
  home,
  subscribe,
  unsubscribe,
  auth,
  logout,
};
(module.exports: { [name: string]: LambdaHandler<APIGatewayResponse> });
