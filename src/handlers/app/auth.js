/* @flow */

import type { LambdaHandler } from 'custom-types';

const _ = require('lodash');
const config = require('config');
const request = require('request-promise');
const cookie = require('cookie');
const User = require('../../lib/user');
const Token = require('../../lib/token');
const Cryptr = require('cryptr');

const { cryptrKey, baseUri, allowedUsers, email: appEmail } = config.get('app');
const {
  host: reverbHost,
  key: reverbKey,
  secret: reverbSecret,
  redirectPath,
} = config.get('reverb');

const handler: LambdaHandler = (event, context, callback) => {
  const cryptr = new Cryptr(cryptrKey);

  return (
    new Promise((resolve, reject) => {
      // Check for a valid state parameter.
      const state = Token.verify(
        _.get(event, 'queryStringParameters.state', '')
      );

      if (state !== reverbKey) {
        reject(new Error('The state parameter did not match.'));
        return;
      }
      resolve();
    })

      // Request access token from Reverb.
      .then(() =>
        request({
          uri: `${reverbHost}/oauth/token`,
          method: 'post',
          json: true,
          qs: {
            client_id: reverbKey,
            client_secret: reverbSecret,
            code: _.get(event, 'queryStringParameters.code', ''),
            grant_type: 'authorization_code',
            redirect_uri: `${baseUri}${redirectPath}`,
          },
        })
      )

      // Get user data from Reverb.
      .then(data =>
        request({
          uri: `${reverbHost}/api/my/account`,
          json: true,
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }).then(user => ({
          user,
          code: data.access_token,
        }))
      )

      // Register for the app uninstall webhook.
      .then(data =>
        request({
          uri: `${reverbHost}/api/webhooks/registrations`,
          method: 'post',
          json: true,
          headers: {
            Authorization: `Bearer ${data.code}`,
            'Content-Type': 'application/hal+json',
          },
          body: {
            url: `${baseUri}/unsubscribe/${encodeURIComponent(
              cryptr.encrypt(data.user.email)
            )}`,
            topic: 'app/uninstalled',
          },
        }).then(() => data)
      )

      // Try to create a corresponding user.
      .then(data => {
        // If the environment specifies a list of allowed users, make sure the
        // current user is in it.
        if (typeof allowedUsers !== 'undefined') {
          if (allowedUsers.split('|').indexOf(data.user.email) === -1) {
            throw new Error('User is not allowed.');
          }
        }

        return User.update({
          code: cryptr.encrypt(data.code),
          email: data.user.email,
        });
      })

      // Redirect to the client.
      .then(user => {
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
            Location: baseUri,
          },
        });
      })

      // Uh-oh. Something went wrong.
      .catch(err => {
        console.error(JSON.stringify(err)); // eslint-disable-line no-console

        callback(null, {
          statusCode: 302,
          body: '',
          headers: {
            Location: `${baseUri}?errorMessage=Oops!+We+were+unable+to+authenticate+with+your+reverb+account.+If+you+continue+to+have+trouble,+please+contact+${appEmail}+for+help.`,
            'Set-Cookie': cookie.serialize('rtoken', 'deleted', {
              httpOnly: true,
              maxAge: -1,
              path: '/',
            }),
          },
        });
      })
  );
};

module.exports = handler;
