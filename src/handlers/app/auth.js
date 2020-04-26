/* @flow */

import type { LambdaHandler, APIGatewayResponse } from 'custom-types';

const config = require('config');
const request = require('request-promise');
const cookie = require('cookie');
const util = require('../../util');
const User = require('../../lib/user');
const Token = require('../../lib/token');
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

    // Register the reverb uninstall webhook
    await registerUninstallHook(access_token, user);

    // Try to create a corresponding user.
    const updatedUser = await User.update({
      code: cryptr.encrypt(access_token),
      email: user.email,
    });

    const token = Token.sign(updatedUser.code);
    const cookieString = cookie.serialize('rtoken', String(token), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    // Redirect to the client.
    return {
      statusCode: 302,
      body: '',
      headers: {
        'Set-Cookie': cookieString,
        Location: baseUri,
      },
    };
  } catch (err) {
    // Uh-oh. Something went wrong.
    console.error(JSON.stringify(err)); // eslint-disable-line no-console

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
