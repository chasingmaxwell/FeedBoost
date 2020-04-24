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
const subscribe = require('./subscribe');

describe('subscribe', () => {
  let res;
  beforeAll(async () => {
    res = await subscribe(event);
  });
  it('gets a user from a cookie', () => {
    expect(getFromToken).toHaveBeenCalledWith('123');
  });
  it('redirects to the homepage when we already have a user', () => {
    expect(res).toEqual({
      statusCode: 302,
      body: '',
      headers: {
        Location: 'http://localhost:3000',
      },
    });
  });
  it('redirects to the reverb.com authorization endpoint if we do not have a user', async () => {
    await expect(subscribe({ headers: {} })).resolves.toEqual({
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
