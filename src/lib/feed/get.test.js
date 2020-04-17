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
  code: 'd4faaf5c4f682d7473',
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
