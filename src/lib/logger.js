/* @flow */

const winston = require('winston');
const config = require('config');

const loggerConf = config.get('logger');

module.exports = winston.createLogger({
  transports: [new winston.transports.Console()],
  ...loggerConf,
});
