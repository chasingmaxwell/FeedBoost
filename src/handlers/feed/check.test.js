jest.mock('aws-sdk', () => {
  function SES() {}
  SES.prototype.sendEmail = jest.fn((p, cb) => cb());
  function DocumentClient() {}
  DocumentClient.prototype.update = jest.fn((p, cb) => cb());
  DocumentClient.prototype.get = jest
    .fn()
    .mockImplementationOnce((p, cb) =>
      cb(null, {
        code: 'dbc090504e5f2b7e712ac73bd191d1be35',
        email: 'noListingsWithNew@feedboost.rocks',
        listings: [],
      })
    )
    .mockImplementationOnce((p, cb) =>
      cb(null, {
        code: 'c6c0b15c714231647f37f721f290ebb30cb83e',
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
            code: 'dbc090504e5f2b7e712ade3deb9ce8',
            email: 'noListingsNoNew@feedboost.rocks',
          },
          // some listings - no new.
          {
            code: 'c6c0b15c714231647f37f721eb96d1be35',
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
            code: 'dbc090504e5f2b7e712ac73bd191d1be35',
            email: 'noListingsWithNew@feedboost.rocks',
            listings: [],
          },
          // some listings - with new.
          {
            code: 'c6c0b15c714231647f37f721f290ebb30cb83e',
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
  jest.fn(async req => {
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

const callback = jest.fn();

describe('feed.check handler', () => {
  beforeAll(async () => {
    await handler({}, {}, callback);
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
            // will generate an error.
            code: 'd0ddae564f',
            email: 'error@feedboost.rocks',
            listings: ['123'],
          },
        ],
      })
    );
    await handler({}, {}, callback);
    expect(callback).toHaveBeenLastCalledWith(expect.any(Error));
    expect(
      JSON.parse(
        callback.mock.calls[callback.mock.calls.length - 1][0].message
      )[0].error
    ).toBe('whoopsie!');
  });

  it('reports error when there is a problem fetching a feed', async () => {
    const error = new Error('whoopsie!');
    DynamoDB.DocumentClient.prototype.scan.mockImplementationOnce((p, cb) =>
      cb(null, {
        Items: [
          {
            // will generate an error.
            code: 'd0ddae564f',
            email: 'error@feedboost.rocks',
            listings: ['123'],
          },
        ],
      })
    );
    request.mockImplementationOnce(async () => {
      throw error;
    });
    await handler({}, {}, callback);
    expect(callback).toHaveBeenLastCalledWith(expect.any(Error));
    expect(
      JSON.parse(
        callback.mock.calls[callback.mock.calls.length - 1][0].message
      )[0].error
    ).toBe('whoopsie!');
  });

  it('reports error when there is a problem updating a user', async () => {
    const error = new Error('whoopsie!');
    DynamoDB.DocumentClient.prototype.scan.mockImplementationOnce((p, cb) =>
      cb(null, {
        Items: [
          {
            // will generate an error.
            code: 'd0ddae564f',
            email: 'error@feedboost.rocks',
            listings: ['123'],
          },
        ],
      })
    );
    DynamoDB.DocumentClient.prototype.get.mockImplementationOnce((p, cb) =>
      cb(null, {
        code: 'd0ddae564f',
        email: 'error@feedboost.rocks',
        listings: ['123'],
      })
    );
    DynamoDB.DocumentClient.prototype.update.mockImplementationOnce((p, cb) =>
      cb(error)
    );
    await handler({}, {}, callback);
    expect(callback).toHaveBeenLastCalledWith(expect.any(Error));
    expect(
      JSON.parse(
        callback.mock.calls[callback.mock.calls.length - 1][0].message
      )[0].error
    ).toBe('whoopsie!');
  });

  it('reports error when the whole function fails', async () => {
    const error = new Error('whoopsie!');
    scanMock.mockImplementationOnce(() => {
      throw error;
    });
    await handler({}, {}, callback);
    expect(callback).toHaveBeenLastCalledWith(error);
  });
});
