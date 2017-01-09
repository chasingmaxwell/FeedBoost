const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const validate = require('./validate.js');
const get = require('./get.js');

module.exports = (user) => {
  // Validate the user.
  return validate(user)

  // Look for an existing user.
  .then((validUser) => {
    return get(validUser.email)
    .then((oldUser) => {
      return {
        oldUser: oldUser,
        validUser: validUser
      };
    })
  })

  // Update or create the user.
  .then(({validUser, oldUser}) => {
    // Set created and updated values.
    let now = new Date().toISOString();
    validUser.updated = now;
    if (oldUser === null) {
      validUser.created = now;
    }

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
