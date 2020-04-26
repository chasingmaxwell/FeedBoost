jest.mock('../../lib/user', () => ({
  delete: jest.fn(async (email) => {
    if (email === 'doesNotExist@feedboost.rocks') {
      throw new Error('No user with that email');
    }
  }),
}));
const User = require('../../lib/user');
const unsubscribe = require('./unsubscribe');

const event = {
  pathParameters: {
    hash:
      '991a2d39da188af963be78cf2220a11695bc1b165aefeb25e3da8af4957173b512b1fe87d02ef1314e6dc6307facf1c4d1ccd06b341e59836388d53d7677eb4f94b73b1e3bc712c411333487015740ffa93dfd56f050629c3f3e3b21c80508b5ab3d51bc00a5fa7690732f07d51cc125ef0f0b38c1f886',
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
    await expect(
      unsubscribe({
        pathParameters: {
          hash:
            'a72b3416f13c09c75e0ec27074525a357709eb02cfde2d4b7575723107ee90318fdd76d220c3f90a3553512f5105690dab2830439206c72d1cb04bf413dbd9b3d057e361a9d9de86508e65d5169c751ecead6613f58e28f2e6d40a1440a8a919e237565658af114c4d7458f739268814437bbe652a6bce4d1f16c7ef',
        },
      })
    ).rejects.toThrow('No user with that email');
  });
});
