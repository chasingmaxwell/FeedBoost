require('dotenv').config();
const request = require('request-promise');
const cookie = require('cookie');
const User = require('../../lib/user');
const Token = require('../../lib/token');

module.exports = (event, context, callback) => {
  return request({
    uri: `${process.env.REVERB_HOST}/oauth/token`,
    method: 'post',
    json: true,
    qs: {
      client_id: process.env.REVERB_KEY,
      client_secret: process.env.REVERB_SECRET,
      code: event.queryStringParameters.code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.REVERB_REDIRECT_URI
    }
  })

  // Get user data from Reverb.
  .then((data) => {
    return request({
      uri: `${process.env.REVERB_HOST}/api/my/account`,
      json: true,
      headers: {
        Authorization: `Bearer ${data.access_token}`
      }
    })
    .then((user) => {
      return {
        user: user,
        code: data.access_token
      };
    })
  })

  // Try to create a corresponding user.
  .then((data) => {
    const user = {
      code: data.code,
      email: data.user.email
    };

    return User.update(user)

    .catch((err) => {
      // The conditional check fails if the user already exists.
      if (err.name !== 'ConditionalCheckFailedException') {
        throw err;
      }

      return user;
    });
  })

  // Redirect to the client.
  .then((user) => {
    // @TODO: check against the state parameter.
    let token = Token.sign(user.code);
    let cookieString = cookie.serialize('rtoken', String(token), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    callback(null, {
      statusCode: 302,
      body: '',
      headers: {
        'Set-Cookie': cookieString,
        'Location': process.env.BASE_URI
      }
    });
  })

  // Uh-oh. Something went wrong.
  .catch((err) => {
    callback(err);
  });
};
