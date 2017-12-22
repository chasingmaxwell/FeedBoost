const request = require('request-promise');
const cookie = require('cookie');
const User = require('../../lib/user');
const Token = require('../../lib/token');
const Cryptr = require('cryptr');

module.exports = (event, context, callback) => {
  const cryptr = new Cryptr(process.env.CRYPTR_KEY);

  return new Promise((resolve, reject) => {
    // Check for a valid state parameter.
    const state = Token.verify(event.queryStringParameters.state);
    if (state !== process.env.REVERB_KEY) {
      reject(new Error('The state parmater did not match.'));
      return;
    }
    resolve();
  })

    // Request access token from Reverb.
    .then(() => request({
      uri: `${process.env.REVERB_HOST}/oauth/token`,
      method: 'post',
      json: true,
      qs: {
        client_id: process.env.REVERB_KEY,
        client_secret: process.env.REVERB_SECRET,
        code: event.queryStringParameters.code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.REVERB_REDIRECT_URI,
      },
    }))

    // Get user data from Reverb.
    .then(data => request({
      uri: `${process.env.REVERB_HOST}/api/my/account`,
      json: true,
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    })
      .then(user => ({
        user,
        code: data.access_token,
      })))

    // Register for the app uninstall webhook.
    .then(data => request({
      uri: `${process.env.REVERB_HOST}/api/webhooks/registrations`,
      method: 'post',
      json: true,
      headers: {
        Authorization: `Bearer ${data.code}`,
        'Content-Type': 'application/hal+json',
      },
      body: {
        url: `${process.env.BASE_URI}/unsubscribe/${encodeURIComponent(cryptr.encrypt(data.user.email))}`,
        topic: 'app/uninstalled',
      },
    })
      .then(() => data))

    // Try to create a corresponding user.
    .then((data) => {
      // If the environment specifies a list of allowed users, make sure the
      // current user is in it.
      if (typeof process.env.ALLOWED_USERS !== 'undefined') {
        if (process.env.ALLOWED_USERS.split('|').indexOf(data.user.email) === -1) {
          throw new Error('User is not allowed.');
        }
      }

      const user = {
        code: cryptr.encrypt(data.code),
        email: data.user.email,
      };

      return User.update(user);
    })

    // Redirect to the client.
    .then((user) => {
      // @TODO: check against the state parameter.
      const token = Token.sign(user.code);
      const cookieString = cookie.serialize('rtoken', String(token), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });

      callback(null, {
        statusCode: 302,
        body: '',
        headers: {
          'Set-Cookie': cookieString,
          Location: process.env.BASE_URI,
        },
      });
    })

    // Uh-oh. Something went wrong.
    .catch((err) => {
      console.error(err);

      callback(null, {
        statusCode: 302,
        body: '',
        headers: {
          Location: `${process.env.BASE_URI}?errorMessage=Oops!+We+were+unable+to+authenticate+with+your+reverb+account.+If+you+continue+to+have+trouble,+please+contact+peter@feedboost.rocks+for+help.`,
          'Set-Cookie': cookie.serialize('rtoken', 'deleted', {
            httpOnly: true,
            maxAge: -1,
            path: '/',
          }),
        },
      });
    });
};
