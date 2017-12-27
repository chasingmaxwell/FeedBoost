const config = require('config');
const User = require('../../lib/user');
const Cryptr = require('cryptr');

const cryptrKey = config.get('app.cryptrKey');

module.exports = (event, context, callback) => {
  const cryptr = new Cryptr(cryptrKey);
  const email = cryptr.decrypt(decodeURIComponent(event.pathParameters.hash));

  return User.delete(email)

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

    // Uh-oh. Something went wrong.
    .catch((e) => {
      callback(e);
    });
};
