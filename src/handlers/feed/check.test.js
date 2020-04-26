jest.mock('aws-sdk', () => {
  function SES() {}
  SES.prototype.sendEmail = jest.fn((p, cb) => cb());
  function DocumentClient() {}
  DocumentClient.prototype.update = jest.fn((p, cb) => cb());
  DocumentClient.prototype.get = jest
    .fn()
    .mockImplementationOnce((p, cb) =>
      cb(null, {
        code:
          '671f16ab3f5d2480ff6751e4f8df0f5910688f1efe7ed82c0fe1934e07dcaba6ab4e942db81537b52464c884d4fa58a0074ad27770ccdec020462960da2939eb71dfe5c5342a67541abfb3e78f43f8d1654e97cea57790893ee1c38370672d71fe02afe45db8a50d19cc69198197a7717c',
        email: 'noListingsWithNew@feedboost.rocks',
        listings: [],
      })
    )
    .mockImplementationOnce((p, cb) =>
      cb(null, {
        code:
          'a2e66e1a2a66c13e447dd46a1090adf4ccc3f02c03fa783d37574f6776c74b0eaf52290f913f75c7fa44471344504806bbc6e8f7bcf32fb98a1c51e10a52d6f7b0221207e15212bc76b5d6f44747128f95baa413956d39a80657aa486492e7084bbc1ce05598f63247539b8eca65073b31cc5d',
        email: 'someListingsWithNew@feedboost.rocks',
        listings: ['123'],
      })
    );
  DocumentClient.prototype.scan = jest
    .fn()
    .mockImplementationOnce((p, cb) =>
      cb(null, {
        Items: [
          // No listings - no new.
          {
            code:
              '2c6b73e9ac6d4c4d6a14956ee6f44824bd03d31132da176006a2c7938343906cec346a2f0bb067f48eb8375afdd4b01607c0492525fbfc4eee8a49b93fbbb381b63e7369316e7eddb7b851c8369cfe2dc2c2eb15aeda125614e2f43dbaa388c1748a86739a8118ee0cc5bd55a49434',
            email: 'noListingsNoNew@feedboost.rocks',
          },
          // some listings - no new.
          {
            code:
              'ef822816889fdd619e5d3c6ad856dfd6b06099d07355d97f1be7b6936ddad909f54e1500dccba4ee2a6d0299eb27f74a966611a5083e729b9d671c377b24cc3d8f7f6551b629f5b7819d562997be2da09ba937d6f0c9faf32c2a3094bc2fbd6fd279c68bf2f31c95cbd680819c077c3ba7',
            email: 'someListingsNoNew@feedboost.rocks',
            listings: ['123', '456'],
          },
        ],
        LastEvaluatedKey: { some: 'key' },
      })
    )
    .mockImplementationOnce((p, cb) =>
      cb(null, {
        Items: [
          // No listings - with new.
          {
            code:
              '671f16ab3f5d2480ff6751e4f8df0f5910688f1efe7ed82c0fe1934e07dcaba6ab4e942db81537b52464c884d4fa58a0074ad27770ccdec020462960da2939eb71dfe5c5342a67541abfb3e78f43f8d1654e97cea57790893ee1c38370672d71fe02afe45db8a50d19cc69198197a7717c',
            email: 'noListingsWithNew@feedboost.rocks',
            listings: [],
          },
          // some listings - with new.
          {
            code:
              'a2e66e1a2a66c13e447dd46a1090adf4ccc3f02c03fa783d37574f6776c74b0eaf52290f913f75c7fa44471344504806bbc6e8f7bcf32fb98a1c51e10a52d6f7b0221207e15212bc76b5d6f44747128f95baa413956d39a80657aa486492e7084bbc1ce05598f63247539b8eca65073b31cc5d',
            email: 'someListingsWithNew@feedboost.rocks',
            listings: ['123'],
          },
        ],
      })
    );
  return {
    SES,
    DynamoDB: {
      DocumentClient,
    },
  };
});
jest.mock('request-promise', () =>
  jest.fn(async (req) => {
    if (req.headers.Authorization === 'Bearer noListingsNoNew') {
      return [];
    }
    return {
      listings: [
        {
          id: '123',
          price: { display: '$100' },
          title: 'Some Funky Pedal',
          _links: {
            web: {
              href: 'https://reverb.com/item/some-funky-pedal',
            },
          },
        },
        {
          id: '456',
          price: { display: '$1000' },
          title: 'Some Funky Amp',
          _links: {
            web: {
              href: 'https://reverb.com/item/some-funky-amp',
            },
          },
        },
      ],
    };
  })
);

const request = require('request-promise');
const { SES, DynamoDB } = require('aws-sdk');
const user = require('../../lib/user');
const scanMock = jest.spyOn(user, 'scan');
const handler = require('./check');

describe('feed.check handler', () => {
  beforeAll(async () => {
    await handler();
  });

  it('scans the users database', () => {
    expect(DynamoDB.DocumentClient.prototype.scan).toHaveBeenCalledTimes(2);
  });

  it("retrieves each user's feed", () => {
    expect(request).toHaveBeenCalledTimes(4);
    expect(request.mock.calls[0][0].headers.Authorization).toBe(
      'Bearer noListingsNoNew'
    );
    expect(request.mock.calls[1][0].headers.Authorization).toBe(
      'Bearer someListingsNoNew'
    );
    expect(request.mock.calls[2][0].headers.Authorization).toBe(
      'Bearer noListingsWithNew'
    );
    expect(request.mock.calls[3][0].headers.Authorization).toBe(
      'Bearer someListingsWithNew'
    );
  });

  it('sends emails about new items when they exist', () => {
    expect(
      SES.prototype.sendEmail.mock.calls[0][0].Destination.ToAddresses[0]
    ).toBe('noListingsWithNew@feedboost.rocks');
    expect(
      SES.prototype.sendEmail.mock.calls[1][0].Destination.ToAddresses[0]
    ).toBe('someListingsWithNew@feedboost.rocks');
    expect(SES.prototype.sendEmail.mock.calls[0][0]).toMatchInlineSnapshot(`
Object {
  "Destination": Object {
    "ToAddresses": Array [
      "noListingsWithNew@feedboost.rocks",
    ],
  },
  "Message": Object {
    "Body": Object {
      "Html": Object {
        "Data": "
                      <!doctype html>
                      <html style=\\"background: #85dc79;\\">
                      <head>
                        <meta name=\\"viewport\\" content=\\"width=device-width\\" />
                        <meta http-equiv=\\"Content-Type\\" content=\\"text/html; charset=UTF-8\\" />
                        <title>FeedBoost Notification</title>
                        <link href=\\"https://fonts.googleapis.com/css?family=Yesteryear\\" rel=\\"stylesheet\\">
                        <style type=\\"text/css\\">
                          a {
                            color: #0080a5;
                            text-decoration: none;
                          }
                          a:hover, a:visited, a:active {
                            color: #00607d;
                          }
                        </style>
                      </head>
                      <body style=\\"font-size: 16px; font-family: 'PT Sans', 'Verdana', sans-serif; color: #333; line-height: 1.75em; padding: 0 10px; background: #f5f5f5;\\">
                        <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\">
                          <tr>
                            <td style=\\"padding: 20px 0;\\">
                              <img src=\\"https://feedboost.rocks/files/logo.png\\" title=\\"FeedBoost\\" alt=\\"FeedBoost Logo\\" width=\\"147\\" height=\\"38\\" />
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p>Hello noListingsWithNew@feedboost.rocks,</p>
                              <p>Your feed just updated! Here's the new gear:</p>
                              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" style=\\"padding: 20px 0;\\"><tr><td><a href=\\"https://reverb.com/item/some-funky-pedal\\" style=\\"color: #0080a5;\\">Some Funky Pedal</a> - $100</td><tr><tr><td><a href=\\"https://reverb.com/item/some-funky-amp\\" style=\\"color: #0080a5;\\">Some Funky Amp</a> - $1000</td><tr></table>
                              <p><a href=\\"https://reverb.com/my/feed\\" style=\\"color: #0080a5;\\">Take me to my feed!</a></p>
                            </td>
                          </tr>
                          <tr>
                            <td style=\\"font-size: 12px; color: #888;\\">Prefer not to receive notifications about new items in your feed? Uninstall FeedBoost from your <a href=\\"https://reverb.com/apps/installed\\" style=\\"color: #0080a5;\\">apps dashboard</a> on Reverb.com.</td>
                          </tr>
                        </table>
                      </body>
                      </html>
                    ",
      },
    },
    "Subject": Object {
      "Data": "Your feed updated!",
    },
  },
  "Source": "FeedBoost <admin@feedboost.rocks>",
}
`);
  });

  it('updates users with new listings in dynamo', () => {
    expect(DynamoDB.DocumentClient.prototype.update).toHaveBeenCalledTimes(2);
    expect(
      DynamoDB.DocumentClient.prototype.update.mock.calls[0][0].Key.email
    ).toBe('noListingsWithNew@feedboost.rocks');
    expect(
      DynamoDB.DocumentClient.prototype.update.mock.calls[1][0].Key.email
    ).toBe('someListingsWithNew@feedboost.rocks');
  });

  it('reports error when there is a problem sending an email', async () => {
    const error = new Error('whoopsie!');
    SES.prototype.sendEmail.mockImplementationOnce((p, cb) => cb(error));
    DynamoDB.DocumentClient.prototype.scan.mockImplementationOnce((p, cb) =>
      cb(null, {
        Items: [
          {
            code:
              '59b59339ef50292b49f914647b35513ab74e939fd5b60f281d9811f80aaba243939f7aef15ab2fd3e85ccbd1e648252c6fc299eeb2c96815a5a26bd0873125975385237f7d01d7e2fc2fb809cd5bcdf5bc62fcae8f2f7b16488c3a9dac93cb11a62395',
            email: 'error@feedboost.rocks',
            listings: ['123'],
          },
        ],
      })
    );
    try {
      await handler();
    } catch (e) {
      expect(JSON.parse(e.message)[0].error).toBe('whoopsie!');
    }
  });

  it('reports error when there is a problem fetching a feed', async () => {
    const error = new Error('whoopsie!');
    DynamoDB.DocumentClient.prototype.scan.mockImplementationOnce((p, cb) =>
      cb(null, {
        Items: [
          {
            code:
              '59b59339ef50292b49f914647b35513ab74e939fd5b60f281d9811f80aaba243939f7aef15ab2fd3e85ccbd1e648252c6fc299eeb2c96815a5a26bd0873125975385237f7d01d7e2fc2fb809cd5bcdf5bc62fcae8f2f7b16488c3a9dac93cb11a62395',
            email: 'error@feedboost.rocks',
            listings: ['123'],
          },
        ],
      })
    );
    request.mockImplementationOnce(async () => {
      throw error;
    });
    try {
      await handler();
    } catch (e) {
      expect(JSON.parse(e.message)[0].error).toBe('whoopsie!');
    }
  });

  it('reports error when there is a problem updating a user', async () => {
    const error = new Error('whoopsie!');
    DynamoDB.DocumentClient.prototype.scan.mockImplementationOnce((p, cb) =>
      cb(null, {
        Items: [
          {
            code:
              '59b59339ef50292b49f914647b35513ab74e939fd5b60f281d9811f80aaba243939f7aef15ab2fd3e85ccbd1e648252c6fc299eeb2c96815a5a26bd0873125975385237f7d01d7e2fc2fb809cd5bcdf5bc62fcae8f2f7b16488c3a9dac93cb11a62395',
            email: 'error@feedboost.rocks',
            listings: ['123'],
          },
        ],
      })
    );
    DynamoDB.DocumentClient.prototype.get.mockImplementationOnce((p, cb) =>
      cb(null, {
        code:
          '59b59339ef50292b49f914647b35513ab74e939fd5b60f281d9811f80aaba243939f7aef15ab2fd3e85ccbd1e648252c6fc299eeb2c96815a5a26bd0873125975385237f7d01d7e2fc2fb809cd5bcdf5bc62fcae8f2f7b16488c3a9dac93cb11a62395',
        email: 'error@feedboost.rocks',
        listings: ['123'],
      })
    );
    DynamoDB.DocumentClient.prototype.update.mockImplementationOnce((p, cb) =>
      cb(error)
    );
    try {
      await handler();
    } catch (e) {
      expect(JSON.parse(e.message)[0].error).toBe('whoopsie!');
    }
  });

  it('reports error when the whole function fails', async () => {
    const error = new Error('whoopsie!');
    scanMock.mockImplementationOnce(() => {
      throw error;
    });
    try {
      await handler();
    } catch (e) {
      expect(e.message).toBe('whoopsie!');
    }
  });
});
