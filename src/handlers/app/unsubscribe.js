require('dotenv').config();
const User = require('../../lib/user');
const Token = require('../../lib/token');

module.exports = (event, context, callback) => {
  let cookieString = '';

  if (event.headers.hasOwnProperty('Cookie')) {
    cookieString = event.headers.Cookie;
  }

  // Get the token from cookies.
  return Token.getFromCookie(cookieString)

  // Get the user from the token.
  .then(token => {
    return User.getFromToken(token);
  })

  // Delete the user.
  .then(user => {
    return User.delete(user.email);
  })

  // Redirect to home.
  // @TODO: delete the rtoken cookie.
  .then(() => {
    callback(null, {
      statusCode: 302,
      body: '',
      headers: {
        'Location': process.env.BASE_URI + '?message=You+have+been+successfully+unsubscribed.'
      }
    });
  })

  // Uh-oh. Something wen't wrong.
  .catch((e) => {
    callback(e);
  })
};
