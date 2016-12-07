const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const validate = require('./validate.js');

module.exports = (user) => {
  return validate(user)
  .then((validUser) => {
    return new Promise((resolve, reject) => {
      // Insert the user into the data store.
      db.put({
        TableName: 'reverbUser',
        Item: validUser,
      }, (err) => {
        if (err) {
          reject(err);
        }

        resolve(validUser);
      });
    });
  });
};
