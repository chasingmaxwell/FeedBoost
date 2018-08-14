/* @flow */

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const db = new AWS.DynamoDB.DocumentClient();

module.exports = (email: string): Promise<string> =>
  new Promise((resolve, reject) => {
    db.delete(
      {
        Key: { email },
        TableName: `feedboostUser_${String(process.env.NODE_ENV)}`,
      },
      err => {
        if (err) {
          reject(err);
          return;
        }

        resolve(email);
      }
    );
  });
