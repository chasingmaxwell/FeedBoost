const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const Readable = require('stream').Readable;

// @TODO: add test coverage.
module.exports = ({index, query, values} = {index: null, query: null, values: null}) => {
  let params = {
    TableName: 'reverbUser'
  };

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
        return this.push(null);
      }

      db.scan(params, (err, data) => {
        if (err) {
          return this.emit('error', err);
        }

        if (data.hasOwnProperty('LastEvaluatedKey')) {
          lastKey = data.LastEvaluatedKey;
        }
        else {
          end = true;
        }

        this.push(data.Items);
      });
    }
  });
};
