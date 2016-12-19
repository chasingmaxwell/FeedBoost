const User = require('../../lib/user');
const Feed = require('../../lib/feed');
const AWS = require('aws-sdk');
const ses = new AWS.SES();

module.exports = (event, context, callback) => {
  // Consume the user scan stream and operate on each batch — and each user in
  // each batch — in parallel.
  return new Promise((resolve, reject) => {
    let batches = [];
    let scanStream = User.scan();

    scanStream.on('data', users => {
      let ops = [];

      users.forEach(user => {
        // Kickoff the chain for this user.
        let op = Promise.resolve({
          user: user
        })

        // Get the feed associated with this user.
        .then(data => {
          return Feed.get(data.user)
          .then(listings => {
            data.listings = listings;
            return data;
          });
        })

        // Notify and update the user.
        .then(data => {
          return new Promise((_resolve, _reject) => {
            // Make sure the listings property exists.
            data.user.listings = data.user.listings || [];

            let diff = data.listings.filter(item => data.user.listings.indexOf(item.id) === -1);


            if (diff.length > 0) {
              let matchMarkup = '<table border="0" cellpadding="0" cellspacing="0">';

              diff.forEach((item) => {
                matchMarkup += `<tr><td><a href="${item._links.web.href}" style="color: #0080a5;">${item.title}</a> - ${item.price.display}</td><tr>`
              });

              matchMarkup += '</table>';

              // Notify the user and then update their feed cache.
              ses.sendEmail({
                Destination: {
                  ToAddresses: [
                    data.user.email
                  ]
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
                          <title>${process.env.APP_NAME} Notification</title>
                          <link href="https://fonts.googleapis.com/css?family=Yesteryear" rel="stylesheet">
                        </head>
                        <body style="font-size: 16px; font-family: 'PT Sans', 'Verdana', sans-serif; color: #333; line-height: 1.75em; padding: 0 10px; background: #f5f5f5;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <h1 style="font-family: 'Yesteryear', sans-serif; font-size: 50px; font-weight: 400px; line-height: 2; text-align: center;">FeedBoost</h1>
                                <p>Hello ${user.email},</p>
                                <p>Your feed just updated! Here's the new gear:</p>
                                ${matchMarkup}
                                <p><a href="${process.env.REVERB_HOST}/my/feed" style="color: #0080a5;">Take me to my feed!</a></p>
                              </td>
                            </tr>
                            <tr>
                              <td>Prefer not to receive notifications about new items in your feed? <a href="${process.env.BASE_URI}/unsubscribe" style="color: #0080a5;">Unsubscribe</a>.</td>
                            </tr>
                          </table>
                        </body>
                        </html>
                      `
                    }
                  },
                  Subject: {
                    Data: 'Your feed updated!'
                  }
                },
                Source: process.env.APP_NAME + ' <' + process.env.APP_EMAIL + '>'
              }, (err) => {
                if (err) {
                  _reject(err);
                  return;
                }

                data.notified = true;

                data.user.listings = data.listings.map((item) => {
                  return item.id;
                })

                // Set new listing IDs on user.
                User.update(data.user)
                .then(() => {
                  data.updated = true;
                  _resolve(data);
                })
                .catch(e => {
                  _reject(e);
                })
              });
              return;
            }

            _resolve(data);
          })
        })
        .catch(err => ({
          user: user,
          listings: [],
          error: err.message
        }));

        ops.push(op);
      });

      let batch = Promise.all(ops)
      batches.push(batch);
    })

    scanStream.on('end', () => {
      resolve(batches);
    })
  })

  // Get the total processed count and errors.
  .then(batches => {
    return Promise.all(batches)
    .then(batchResults => {
      let errors = [];
      let count = 0;
      let updated = 0;
      let notified = 0;
      batchResults.forEach((batch) => {
        count += batch.length;
        updated += batch.filter(item => item.updated).length;
        notified += batch.filter(item => item.notified).length;
        let batchErrors = batch.filter(item => item.hasOwnProperty('error'));
        errors = errors.concat(batchErrors);
      })

      callback(null, {
        count: count,
        updated: updated,
        notified: notified,
        errors: errors
      });
    })
  })

  // Uh-oh. Something went wrong.
  .catch((err) => {
    callback(err);
  });
};
