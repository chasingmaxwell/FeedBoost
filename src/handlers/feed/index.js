/* @flow */

import type { LambdaHandler } from 'custom-types';

const check = require('./check.js');

module.exports = {
  check,
};
(module.exports: { [name: string]: LambdaHandler });
