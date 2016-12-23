require('dotenv').config();
const Token = require('../../lib/token');
const User = require('../../lib/user');

module.exports = (event, context, callback) => {
  let cookieString = '';

  if (event.headers.hasOwnProperty('Cookie')) {
    cookieString = event.headers.Cookie;
  }

  // Get the token.
  return Token.getFromCookie(cookieString)

  // Get the user.
  .then(token => {
    return User.getFromToken(token);
  })

  // Redirect to the homepage if we already have a user.
  .then(user => {
    callback(null, {
      statusCode: 302,
      body: '',
      headers: {
        'Location': process.env.BASE_URI
      }
    });
  })

  .catch(() => {
    let state = Token.sign(process.env.REVERB_KEY);
    callback(null, {
      statusCode: 302,
      body: '',
      headers: {
        'Location': `${process.env.REVERB_HOST}/oauth/authorize?client_id=${process.env.REVERB_KEY}&redirect_uri=${process.env.REVERB_REDIRECT_URI}&response_type=code&scope=read_lists+read_profile&state=${state}`
      }
    });
  })
};
