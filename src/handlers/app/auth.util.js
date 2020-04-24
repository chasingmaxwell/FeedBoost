/* @flow */

const request = require('request-promise');
const util = require('../../util');
const Cryptr = require('cryptr');
const config = require('config');
const { baseUri, allowedUsers, cryptrKey } = config.get('app');
const { host: reverbHost } = config.get('reverb');

module.exports.getReverbUser = async (access_token: string) => {
  // Get user data from Reverb.
  const user = await request({
    uri: `${reverbHost}/api/my/account`,
    json: true,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  // If the environment specifies a list of allowed users, make sure the
  // current user is in it.
  if (
    typeof allowedUsers !== 'undefined' &&
    allowedUsers.split('|').indexOf(user.email) === -1
  ) {
    throw new Error('User is not allowed.');
  }

  return user;
};

module.exports.registerUninstallHook = async (
  access_token: string,
  user: { email: string }
) => {
  const cryptr = new Cryptr(cryptrKey);
  // Register for the app uninstall webhook.
  await request({
    uri: `${reverbHost}/api/webhooks/registrations`,
    method: 'post',
    json: true,
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/hal+json',
    },
    body: {
      url: `${baseUri}/unsubscribe/${encodeURIComponent(
        cryptr.encrypt(user.email)
      )}`,
      topic: 'app/uninstalled',
    },
  })
    // Catch the error where the subscription already exists. This can
    // happen when a user's cookie has expired and they authenticate
    // after having already installed the app.
    .catch((e) => {
      if (
        e.statusCode !== 422 ||
        !(util.path(['error', 'errors', 'url'])(e) || []).includes(
          'has already been taken'
        )
      ) {
        throw e;
      }
    });
};
