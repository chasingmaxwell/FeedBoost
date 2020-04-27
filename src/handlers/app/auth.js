/* @flow */

import type { LambdaHandler, APIGatewayResponse } from 'custom-types';

const config = require('config');
const request = require('request-promise');
const cookie = require('cookie');
const util = require('../../util');
const User = require('../../lib/user');
const Token = require('../../lib/token');
const logger = require('../../lib/logger');
const Cryptr = require('cryptr');
const { getReverbUser, registerUninstallHook } = require('./auth.util');

const { cryptrKey, baseUri, email: appEmail } = config.get('app');
const {
  host: reverbHost,
  key: reverbKey,
  secret: reverbSecret,
  redirectPath,
} = config.get('reverb');

const handler: LambdaHandler<APIGatewayResponse> = async (
  event
): Promise<APIGatewayResponse> => {
  try {
    const cryptr = new Cryptr(cryptrKey);

    // Check for a valid state parameter.
    if (
      Token.verify(
        util.path(['queryStringParameters', 'state'])(event) || ''
      ) !== reverbKey
    ) {
      throw new Error('The state parameter did not match.');
    }

    // Request access token from Reverb.
    const { access_token } = await request({
      uri: `${reverbHost}/oauth/token`,
      method: 'post',
      json: true,
      qs: {
        client_id: reverbKey,
        client_secret: reverbSecret,
        code: util.path(['queryStringParameters', 'code'])(event),
        grant_type: 'authorization_code',
        redirect_uri: `${baseUri}${redirectPath}`,
      },
    });

    // Get the user entity from Reverb
    const user = await getReverbUser(access_token);

    const [updatedUser] = await Promise.all([
      // Create a corresponding user.
      User.update({
        code: cryptr.encrypt(access_token),
        email: user.email,
      }),
      // Register the reverb uninstall webhook
      registerUninstallHook(access_token, user).catch((error) => {
        logger.log({
          level: 'error',
          message: 'Uninstall webhook failed to register',
          meta: {
            error: error.message,
          },
        });
      }),
    ]);

    // Redirect to the client.
    return {
      statusCode: 302,
      body: '',
      headers: {
        'Set-Cookie': cookie.serialize(
          'rtoken',
          String(Token.sign(updatedUser.code)),
          {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
          }
        ),
        Location: baseUri,
      },
    };
  } catch (error) {
    // Uh-oh. Something went wrong.
    logger.log({
      level: 'error',
      message: 'Something unexpected went wrong',
      meta: {
        error: error.message,
      },
    });

    return {
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
    };
  }
};

module.exports = handler;
