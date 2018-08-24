/* @flow */

import type { User } from 'custom-types';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const { Readable } = require('stream');

const db = new AWS.DynamoDB.DocumentClient();

module.exports = ({
  index,
  query,
  values,
}: {
  index?: string,
  query?: string | { [string]: any },
  values?: { [string]: any },
} = {}) => {
  const params = {};
  params.TableName = `feedboostUser_${String(process.env.NODE_ENV)}`;

  if (typeof index !== 'undefined') {
    params.IndexName = index;
  }

  if (typeof query !== 'undefined') {
    params.FilterExpression = query;
  }

  if (typeof values !== 'undefined') {
    params.ExpressionAttributeValues = values;
  }

  let lastKey;
  let end = false;

  return new Readable({
    objectMode: true,
    read() {
      if (lastKey) {
        params.ExclusiveStartKey = lastKey;
      }

      if (end) {
        this.push(null);
        return;
      }

      db.scan(
        params,
        (err, data: { LastEvaluatedKey?: string, Items: Array<User> }) => {
          if (err) {
            this.emit('error', err);
            return;
          }

          if (typeof data.LastEvaluatedKey !== 'undefined') {
            lastKey = data.LastEvaluatedKey;
          } else {
            end = true;
          }

          this.push(data.Items);
        }
      );
    },
  });
};
