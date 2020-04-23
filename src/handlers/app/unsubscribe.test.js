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
const context = {};
const callback = jest.fn();

describe('unsubscribe', () => {
  beforeAll(async () => {
    await unsubscribe(event, context, callback);
  });
  it('deletes the user', () => {
    expect(User.delete).toHaveBeenCalledWith('example@feedboost.rocks');
  });
  it('responds with a 200 status code', () => {
    expect(callback).toHaveBeenCalledWith(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"message": "success"}',
    });
  });
  it('catches errors and returns them in the callback', async () => {
    await unsubscribe({}, context, callback);
    expect(callback).toHaveBeenLastCalledWith(expect.any(Error));
    expect(callback.mock.calls[1][0].message).toBe('No user with that email');
  });
});
