jest.mock('request-promise', () => jest.fn());
jest.mock('../../lib/user', () => ({
  update: jest.fn(),
}));
const request = require('request-promise');
const { update } = require('../../lib/user');
const user = {
  email: 'example@feedboost.rocks',
  code: '123',
};
update.mockResolvedValue(user);
const requestImplementation = async (req) => {
  if (req.uri === 'https://reverb.com/oauth/token') {
    return {
      access_token: 'anAccessToken',
    };
  }
  if (req.uri === 'https://reverb.com/api/my/account') {
    return user;
  }
  if (req.uri === 'https://reverb.com/api/webhooks/registrations') {
    return {};
  }
};
request.mockImplementation(requestImplementation);

const event = {
  queryStringParameters: {
    // keepitsecret
    state:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2RlIjoia2VlcGl0c2VjcmV0IiwiaWF0IjoxNTg3ODY4MjA3fQ.J21edGKcibAoMVX98DHdjtSTurIDFYJsw7T5MWouS5Y',
    code:
      'b5f4f349faa21ae49459b622b47ed2fdc8c0cf23f7b14ed5e9568d8bd2da897d3b7c011ad0cc7cf16c8df83a87faab6f26396ba260f42156ec594013063839991341624c61700e457cae560e2160a1b8cc055f1432b54ba5d23a53c0be501160a1659efc69eedb5d853eefdc51',
  },
};

const auth = require('./auth');

describe('auth', () => {
  let res;
  afterEach(() => {
    request.mockImplementation(requestImplementation);
  });
  beforeAll(async () => {
    res = await auth(event, {});
  });
  it('requests the access token from Reverb', () => {
    expect(request).toHaveBeenCalledWith({
      uri: 'https://reverb.com/oauth/token',
      method: 'post',
      json: true,
      qs: {
        client_id: 'keepitsecret',
        client_secret: 'keepitsecret',
        code:
          'b5f4f349faa21ae49459b622b47ed2fdc8c0cf23f7b14ed5e9568d8bd2da897d3b7c011ad0cc7cf16c8df83a87faab6f26396ba260f42156ec594013063839991341624c61700e457cae560e2160a1b8cc055f1432b54ba5d23a53c0be501160a1659efc69eedb5d853eefdc51',
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/subscribe/success',
      },
    });
  });
  it('gets user data from Reverb', () => {
    expect(request).toHaveBeenCalledWith({
      uri: 'https://reverb.com/api/my/account',
      json: true,
      headers: {
        Authorization: 'Bearer anAccessToken',
      },
    });
  });
  it('registers for the app uninstall webhook', () => {
    expect(request).toHaveBeenLastCalledWith({
      uri: 'https://reverb.com/api/webhooks/registrations',
      method: 'post',
      json: true,
      headers: {
        Authorization: 'Bearer anAccessToken',
        'Content-Type': 'application/hal+json',
      },
      body: {
        url: expect.stringContaining('http://localhost:3000/unsubscribe/'),
        topic: 'app/uninstalled',
      },
    });
  });
  it('creates a user if the user is allowed', () => {
    expect(update).toHaveBeenCalledWith({
      code: expect.any(String),
      email: 'example@feedboost.rocks',
    });
  });
  it('redirects back to the homepage upon success', () => {
    expect(res).toEqual({
      statusCode: 302,
      body: '',
      headers: {
        'Set-Cookie': expect.stringMatching(
          /rtoken=[^;]+; Max-Age=604800; Path=\/; HttpOnly/
        ),
        Location: 'http://localhost:3000',
      },
    });
  });
  it('does not reject when the uninstall webhook has already been registered', async () => {
    request.mockImplementation(async (req) => {
      if (req.uri === 'https://reverb.com/oauth/token') {
        return {
          access_token: 'anAccessToken',
        };
      }
      if (req.uri === 'https://reverb.com/api/my/account') {
        return user;
      }
      if (req.uri === 'https://reverb.com/api/webhooks/registrations') {
        const error = new Error('whoopsie!');
        error.statusCode = 422;
        error.error = {
          errors: {
            url: ['has already been taken'],
          },
        };
        throw error;
      }
    });
    await expect(auth(event)).resolves.toEqual({
      statusCode: 302,
      body: '',
      headers: {
        'Set-Cookie': expect.stringMatching(
          /rtoken=[^;]+; Max-Age=604800; Path=\/; HttpOnly/
        ),
        Location: 'http://localhost:3000',
      },
    });
  });
  it('does not fail authentication if the webhook does not get registered', async () => {
    request.mockImplementation(async (req) => {
      if (req.uri === 'https://reverb.com/oauth/token') {
        return {
          access_token: 'anAccessToken',
        };
      }

      if (req.uri === 'https://reverb.com/api/my/account') {
        return user;
      }

      if (req.uri === 'https://reverb.com/api/webhooks/registrations') {
        const error = new Error('whoopsie!');
        error.statusCode = 409;
        throw error;
      }
    });
    await expect(auth(event)).resolves.toEqual({
      statusCode: 302,
      body: '',
      headers: {
        'Set-Cookie': expect.stringMatching(
          /rtoken=[^;]+; Max-Age=604800; Path=\/; HttpOnly/
        ),
        Location: 'http://localhost:3000',
      },
    });
  });
  it('does not create a user if the user is not allowed', async () => {
    request.mockImplementation(async (req) => {
      if (req.uri === 'https://reverb.com/oauth/token') {
        return {
          access_token: 'anAccessToken',
        };
      }
      if (req.uri === 'https://reverb.com/api/my/account') {
        return {
          email: 'notAllowed@feedboost.rocks',
          code: '123',
        };
      }
    });
    await expect(auth(event)).resolves.toEqual({
      statusCode: 302,
      body: '',
      headers: {
        Location: `http://localhost:3000?errorMessage=Oops!+We+were+unable+to+authenticate+with+your+reverb+account.+If+you+continue+to+have+trouble,+please+contact+admin@feedboost.rocks+for+help.`,
        'Set-Cookie': 'rtoken=deleted; Max-Age=-1; Path=/; HttpOnly',
      },
    });
  });
  it('rejects when the state parameter does not match the reverb key', async () => {
    await expect(
      auth({
        queryStringParameters: {
          state:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2RlIjoibm9wZSIsImlhdCI6MTU4NzQxNTI3MX0.LUosCYadgVkogc4X7n2u3-9t86qgDBAE5gl2uP_w7cU',
        },
      })
    ).resolves.toEqual({
      statusCode: 302,
      body: '',
      headers: {
        Location: `http://localhost:3000?errorMessage=Oops!+We+were+unable+to+authenticate+with+your+reverb+account.+If+you+continue+to+have+trouble,+please+contact+admin@feedboost.rocks+for+help.`,
        'Set-Cookie': 'rtoken=deleted; Max-Age=-1; Path=/; HttpOnly',
      },
    });
  });
  it('catches unanticipated errors from reverb, redirects to the homepage, and displays an error message', async () => {
    request.mockImplementation(async (req) => {
      if (req.uri === 'https://reverb.com/oauth/token') {
        return {
          access_token: 'anAccessToken',
        };
      }
      if (req.uri === 'https://reverb.com/api/my/account') {
        const error = new Error('whoopsie!');
        throw error;
      }
    });
    await expect(auth(event)).resolves.toEqual({
      statusCode: 302,
      body: '',
      headers: {
        Location: `http://localhost:3000?errorMessage=Oops!+We+were+unable+to+authenticate+with+your+reverb+account.+If+you+continue+to+have+trouble,+please+contact+admin@feedboost.rocks+for+help.`,
        'Set-Cookie': 'rtoken=deleted; Max-Age=-1; Path=/; HttpOnly',
      },
    });
  });
  it('catches errors from missing states, redirects to the homepage, and displays an error message', async () => {
    await expect(auth({})).resolves.toEqual({
      statusCode: 302,
      body: '',
      headers: {
        Location: `http://localhost:3000?errorMessage=Oops!+We+were+unable+to+authenticate+with+your+reverb+account.+If+you+continue+to+have+trouble,+please+contact+admin@feedboost.rocks+for+help.`,
        'Set-Cookie': 'rtoken=deleted; Max-Age=-1; Path=/; HttpOnly',
      },
    });
  });
});
