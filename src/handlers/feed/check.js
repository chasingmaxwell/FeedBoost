const _ = require('lodash');
const config = require('config');
const User = require('../../lib/user');
const Feed = require('../../lib/feed');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const {
  name: appName,
  email: appEmail,
  filesUrl,
} = config.get('app');
const reverbHost = config.get('reverb.host');

const ses = new AWS.SES();

// Consume the user scan stream and operate on each batch — and each user in
// each batch — in parallel.
module.exports = (event, context, callback) => new Promise((resolve) => {
  const batches = [];
  const scanStream = User.scan();

  scanStream.on('data', (users) => {
    // Get the feed associated with this user.
    const ops = users.map((user) => {
      const newUser = _.cloneDeep(user);
      const result = { user: newUser };

      return Feed.get(user)
        // Notify and update the user.
        .then(listings => new Promise((_resolve, _reject) => {
          result.listings = listings;

          // Make sure the listings property exists.
          newUser.listings = newUser.listings || [];

          const diff = listings.filter(item => newUser.listings.indexOf(item.id) === -1);

          if (diff.length > 0) {
            let matchMarkup = '<table border="0" cellpadding="0" cellspacing="0" style="padding: 20px 0;">';

            diff.forEach((item) => {
              // eslint-disable-next-line no-underscore-dangle
              matchMarkup += `<tr><td><a href="${item._links.web.href}" style="color: #0080a5;">${item.title}</a> - ${item.price.display}</td><tr>`;
            });

            matchMarkup += '</table>';

            // Notify the user and then update their feed cache.
            ses.sendEmail({
              Destination: {
                ToAddresses: [
                  newUser.email,
                ],
              },
              Message: {
                Body: {
                  Html: {
                    Data: `
                      <!doctype html>
                      <html style="background: #85dc79;">
                      <head>
                        <meta name="viewport" content="width=device-width" />
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                        <title>${appName} Notification</title>
                        <link href="https://fonts.googleapis.com/css?family=Yesteryear" rel="stylesheet">
                        <style type="text/css">
                          a {
                            color: #0080a5;
                            text-decoration: none;
                          }
                          a:hover, a:visited, a:active {
                            color: #00607d;
                          }
                        </style>
                      </head>
                      <body style="font-size: 16px; font-family: 'PT Sans', 'Verdana', sans-serif; color: #333; line-height: 1.75em; padding: 0 10px; background: #f5f5f5;">
                        <table border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 20px 0;">
                              <img src="${filesUrl}/logo.png" title="FeedBoost" alt="FeedBoost Logo" width="147" height="38" />
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p>Hello ${newUser.email},</p>
                              <p>Your feed just updated! Here's the new gear:</p>
                              ${matchMarkup}
                              <p><a href="${reverbHost}/my/feed" style="color: #0080a5;">Take me to my feed!</a></p>
                            </td>
                          </tr>
                          <tr>
                            <td style="font-size: 12px; color: #888;">Prefer not to receive notifications about new items in your feed? Uninstall FeedBoost from your <a href="${reverbHost}/apps/installed" style="color: #0080a5;">apps dashboard</a> on Reverb.com.</td>
                          </tr>
                        </table>
                      </body>
                      </html>
                    `,
                  },
                },
                Subject: {
                  Data: 'Your feed updated!',
                },
              },
              Source: `${appName} <${appEmail}>`,
            }, (err) => {
              if (err) {
                _reject(err);
                return;
              }

              result.notified = true;

              newUser.listings = listings.map(item => item.id);

              // Set new listing IDs on user.
              User.update(newUser)
                .then(() => {
                  result.updated = true;
                  _resolve(result);
                })
                .catch((e) => {
                  _reject(e);
                });
            });
            return;
          }

          _resolve(result);
        }))

        // Collect errors.
        .catch(err => Object.assign({
          error: err.message,
        }, result));
    });

    batches.push(Promise.all(ops));
  });

  scanStream.on('end', () => {
    resolve(batches);
  });
})

  // Get the total processed count and errors.
  .then(batches => Promise.all(batches)
    .then((batchResults) => {
      let errors = [];
      let count = 0;
      let updated = 0;
      let notified = 0;

      batchResults.forEach((batch) => {
        count += batch.length;
        updated += batch.filter(item => item.updated).length;
        notified += batch.filter(item => item.notified).length;
        errors = errors.concat(batch.filter(item => typeof item.error !== 'undefined'));
      });

      const results = {
        count,
        updated,
        notified,
        errors,
      };

      console.info(JSON.stringify(results));

      if (errors) {
        callback(errors);
      }
      else {
        callback(null, results);
      }
    }))

  // Uh-oh. Something unexpected went wrong.
  .catch((err) => {
    callback(err);
  });
