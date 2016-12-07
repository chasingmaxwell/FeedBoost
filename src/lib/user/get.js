const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

module.exports = (email) => {
  return new Promise((resolve, reject) => {
    db.get({
      Key: {
        email: email
      },
      TableName: 'reverbUser'
    }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(data.Item)
    });
  });
};
