require('dotenv').config();
const Token = require('../../lib/token');
const User = require('../../lib/user');

module.exports = (event, context, callback) => {
  let email = Token.verify(decodeURIComponent(event.pathParameters.hash));

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

  // Uh-oh. Something wen't wrong.
  .catch((e) => {
    callback(e);
  })
};
