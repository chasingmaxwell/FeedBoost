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
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2RlIjoia2VlcGl0c2VjcmV0IiwiaWF0IjoxNTg3NDA3Njg3fQ.Mukh9-mvYIABo_gbQ5fJCJnDJhKuTbMWqHLa2w-3c2Y',
    code: 'd4c19d5a5e4e31634236fb37cb',
  },
};
const callback = jest.fn();

const auth = require('./auth');

describe('auth', () => {
  afterEach(() => {
    request.mockImplementation(requestImplementation);
  });
  beforeAll(async () => {
    await auth(event, {}, callback);
  });
  it('requests the access token from Reverb', () => {
    expect(request).toHaveBeenCalledWith({
      uri: 'https://reverb.com/oauth/token',
      method: 'post',
      json: true,
      qs: {
        client_id: 'keepitsecret',
        client_secret: 'keepitsecret',
        code: 'd4c19d5a5e4e31634236fb37cb',
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
        url:
          'http://localhost:3000/unsubscribe/d0d7bd544d472750703cf536c796f0a836f33b983d5db0',
        topic: 'app/uninstalled',
      },
    });
  });
  it('creates a user if the user is allowed', () => {
    expect(update).toHaveBeenCalledWith({
      code: 'd4c19d5a5e4e31634236fb37cb',
      email: 'example@feedboost.rocks',
    });
  });
  it('redirects back to the homepage upon success', () => {
    expect(callback).toHaveBeenCalledWith(null, {
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
    await auth(event, {}, callback);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith(null, {
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
    await auth(event, {}, callback);
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 302,
      body: '',
      headers: {
        Location: `http://localhost:3000?errorMessage=Oops!+We+were+unable+to+authenticate+with+your+reverb+account.+If+you+continue+to+have+trouble,+please+contact+admin@feedboost.rocks+for+help.`,
        'Set-Cookie': 'rtoken=deleted; Max-Age=-1; Path=/; HttpOnly',
      },
    });
  });
  it('rejects when the state parameter does not match the reverb key', async () => {
    await auth(
      {
        queryStringParameters: {
          state:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2RlIjoibm9wZSIsImlhdCI6MTU4NzQxNTI3MX0.LUosCYadgVkogc4X7n2u3-9t86qgDBAE5gl2uP_w7cU',
        },
      },
      {},
      callback
    );
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 302,
      body: '',
      headers: {
        Location: `http://localhost:3000?errorMessage=Oops!+We+were+unable+to+authenticate+with+your+reverb+account.+If+you+continue+to+have+trouble,+please+contact+admin@feedboost.rocks+for+help.`,
        'Set-Cookie': 'rtoken=deleted; Max-Age=-1; Path=/; HttpOnly',
      },
    });
  });
  it('catches errors, redirects to the homepage, and displays an error message', async () => {
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
        throw new Error('whoopsie!');
      }
    });
    await auth(event, {}, callback);
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 302,
      body: '',
      headers: {
        Location: `http://localhost:3000?errorMessage=Oops!+We+were+unable+to+authenticate+with+your+reverb+account.+If+you+continue+to+have+trouble,+please+contact+admin@feedboost.rocks+for+help.`,
        'Set-Cookie': 'rtoken=deleted; Max-Age=-1; Path=/; HttpOnly',
      },
    });
  });
});
