const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const db = new AWS.DynamoDB.DocumentClient();

// @TODO: add test coverage.
module.exports = ({ index, query, values }) => {
  const params = {
    TableName: `feedboostUser_${process.env.NODE_ENV}`,
  };

  if (typeof index !== 'undefined') {
    params.IndexName = index;
  }

  if (typeof query !== 'undefined') {
    if (typeof query === 'string') {
      params.KeyConditionExpression = query;
    }
    else if (typeof query === 'object') {
      params.KeyConditions = query;
    }
  }

  if (typeof values !== 'undefined') {
    params.ExpressionAttributeValues = values;
  }

  return new Promise((resolve, reject) => {
    db.query(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(data.Items);
    });
  });
};
