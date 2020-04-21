jest.mock('../../lib/user', () => ({
  getFromToken: jest.fn(),
}));
const { getFromToken } = require('../../lib/user');
getFromToken.mockResolvedValue({
  email: 'example@feedboost.rocks',
  code: '123',
});
const event = {
  headers: {
    Cookie:
      'rtoken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2RlIjoiMTIzIiwiaWF0IjoxNTg3NDQxNzkwfQ.4YQknpYwlm27dMFREMfRm04oBoyLZppnGVkXr2kgeD4; Max-Age=604800; Path=/; HttpOnly',
  },
};
const callback = jest.fn();
const subscribe = require('./subscribe');

describe('subscribe', () => {
  beforeAll(async () => {
    await subscribe(event, {}, callback);
  });
  it('gets a user from a cookie', () => {
    expect(getFromToken).toHaveBeenCalledWith('123');
  });
  it('redirects to the homepage when we already have a user', () => {
    expect(callback).toHaveBeenCalledWith(null, {
      statusCode: 302,
      body: '',
      headers: {
        Location: 'http://localhost:3000',
      },
    });
  });
  it('redirects to the reverb.com authorization endpoint if we do not have a user', async () => {
    await subscribe({ headers: {} }, {}, callback);
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 302,
      body: '',
      headers: {
        Location: expect.stringMatching(
          /https:\/\/reverb.com\/oauth\/authorize\?client_id=keepitsecret&redirect_uri=http:\/\/localhost:3000\/subscribe\/success&response_type=code&scope=read_lists\+read_profile&state=.+/
        ),
      },
    });
  });
});
