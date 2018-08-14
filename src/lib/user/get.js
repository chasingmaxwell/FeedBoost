/* @flow */

import type { User } from 'custom-types';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const db = new AWS.DynamoDB.DocumentClient();

module.exports = (email: string): Promise<?User> =>
  new Promise((resolve, reject) => {
    db.get(
      {
        Key: { email },
        TableName: `feedboostUser_${String(process.env.NODE_ENV)}`,
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(typeof data.Item !== 'undefined' ? data.Item : null);
      }
    );
  });
