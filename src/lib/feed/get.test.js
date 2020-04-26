jest.mock('request-promise', () =>
  jest.fn(async () => ({
    listings: [
      {
        id: '123',
        price: { display: '$100' },
        title: 'Some Funky Pedal',
      },
    ],
  }))
);
const request = require('request-promise');
const get = require('./get');

const user = {
  code:
    'ae60a13b85e6a55d787847e52c024f2390fa99ab219b012612c0ca4af5d85b42b7e33d5268dafad9b50e2f3b365c1704d2f2321f7cd08abdc0d3c613d9b9b5e5f9a38ee79be261840c9004f5c023dc3c86bc850c90b54a1378e05430159731c280af304965c393abe7',
  email: 'user@feedboost.rocks',
  listings: [],
};

describe('feed.get', () => {
  let listings;
  beforeAll(async () => {
    listings = await get(user);
  });
  it('makes a request to the feeds endpoint with the appropriate authorization', () => {
    expect(request).toHaveBeenCalledWith({
      uri: 'https://reverb.com/api/my/feed',
      method: 'get',
      json: true,
      headers: {
        Authorization: 'Bearer aUserCode',
      },
    });
  });
  it('responds with listings', () => {
    expect(listings).toEqual([
      {
        id: '123',
        price: { display: '$100' },
        title: 'Some Funky Pedal',
      },
    ]);
  });
});
