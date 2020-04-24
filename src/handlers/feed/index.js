/* @flow */

import type { LambdaHandler } from 'custom-types';
import type { Response } from './check';

const check = require('./check.js');

module.exports = {
  check,
};
(module.exports: { [name: string]: LambdaHandler<Response> });
