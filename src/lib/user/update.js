const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const validate = require('./validate.js');
const get = require('./get.js');

const db = new AWS.DynamoDB.DocumentClient();

module.exports = user =>
  validate(user)
    // Look for an existing user.
    .then(validUser =>
      get(validUser.email).then(oldUser => ({
        oldUser,
        validUser,
      }))
    )

    // Update or create the user.
    .then(({ validUser, oldUser }) => {
      const updatedUser = Object.assign({}, validUser);
      // Set created and updated values.
      const now = new Date().toISOString();
      updatedUser.updated = now;
      if (oldUser === null) {
        updatedUser.created = now;
      }

      return new Promise((resolve, reject) => {
        const params = {
          TableName: `feedboostUser_${process.env.NODE_ENV}`,
          Key: {
            email: updatedUser.email,
          },
          AttributeUpdates: {},
        };

        // Add all non-key properties.
        Object.keys(updatedUser).forEach(prop => {
          if (prop !== 'email') {
            params.AttributeUpdates[prop] = {
              Action: 'PUT',
              Value: updatedUser[prop],
            };
          }
        });

        // Insert the user into the data store.
        db.update(params, err => {
          if (err) {
            reject(err);
          }

          resolve(updatedUser);
        });
      });
    });
