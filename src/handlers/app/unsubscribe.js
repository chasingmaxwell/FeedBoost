require('dotenv').config();
const Token = require('../../lib/token');
const User = require('../../lib/user');
const request = require('request-promise');

// @TODO: move webhook stuff to a lib.
const deregister = (email) => {
  // Get the user.
  return User.get(email)

  // Get all the user's registered webhooks.
  .then((user) => {
    return request({
      uri: `${process.env.REVERB_HOST}/api/webhooks/registrations`,
      headers: {
        Authorization: `Bearer ${user.code}`,
        Accept: 'applicatoin/hal+json'
      }
    })
    .then((data) => {
      data.user = user;
      return data;
    });
  })

  // Deregister for all webhooks.
  .then((data) => {
    let deregistrations = data.registrations.map((registration) => {
      return new Promise((resolve, reject) => {
        request({
          uri: `${process.env.REVERB_HOST}${registration._links.self.href}`,
          method: 'delete',
          headers: {
            Authorization: `Bearer ${data.user.code}`,
            Accept: 'applicatoin/hal+json'
          }
        })
      });
    })

    return Promise.all(deregistrations);
  })
}

module.exports = (event, context, callback) => {
  let email = Token.verify(event.pathParameters.hash);

  return Promise.all([
    deregister(email),
    User.delete(email)
  ])

  // Return a 200 response.
  .then(() => {
    callback(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{message: "success"}',
    });
  })

  // Uh-oh. Something wen't wrong.
  .catch((e) => {
    callback(e);
  })
};
