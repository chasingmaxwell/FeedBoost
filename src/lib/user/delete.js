const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const db = new AWS.DynamoDB.DocumentClient();

module.exports = email => new Promise((resolve, reject) => {
  db.delete({
    Key: { email },
    TableName: `feedboostUser_${process.env.NODE_ENV}`,
  }, (err) => {
    if (err) {
      reject(err);
      return;
    }

    resolve(email);
  });
});
