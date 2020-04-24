jest.mock('../../lib/user', () => ({
  delete: jest.fn(async (email) => {
    if (email === '') {
      throw new Error('No user with that email');
    }
  }),
}));
const User = require('../../lib/user');
const unsubscribe = require('./unsubscribe');

const event = {
  pathParameters: {
    hash: 'd0d7bd544d472750703cf536c796f0a836f33b983d5db0',
  },
};

describe('unsubscribe', () => {
  let res;
  beforeAll(async () => {
    res = await unsubscribe(event);
  });
  it('deletes the user', () => {
    expect(User.delete).toHaveBeenCalledWith('example@feedboost.rocks');
  });
  it('responds with a 200 status code', () => {
    expect(res).toEqual({
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"message": "success"}',
    });
  });
  it('catches errors and returns them in the callback', async () => {
    await expect(unsubscribe({})).rejects.toThrow('No user with that email');
  });
});
