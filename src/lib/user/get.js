const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

module.exports = (email) => {
  return new Promise((resolve, reject) => {
    db.get({
      Key: {
        email: email
      },
      TableName: `feedboostUser_${process.env.NODE_ENV}`
    }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      let user = data.hasOwnProperty('Item') ? data.Item : null;

      resolve(user)
    });
  });
};
