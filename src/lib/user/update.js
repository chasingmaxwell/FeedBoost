const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const validate = require('./validate.js');

module.exports = (user) => {
  return validate(user)
  .then((validUser) => {
    return new Promise((resolve, reject) => {
      let params = {
        TableName: `feedboostUser_${process.env.NODE_ENV}`,
        Key: {
          email: validUser.email,
        },
        AttributeUpdates: {}
      }

      // Add all non-key properties.
      for (let prop in validUser) {
        if (prop !== 'email') {
          params.AttributeUpdates[prop] = {
            Action: 'PUT',
            Value: validUser[prop]
          }
        }
      }

      // Insert the user into the data store.
      db.update(params, (err) => {
        if (err) {
          reject(err);
        }

        resolve(validUser);
      });
    });
  });
};
