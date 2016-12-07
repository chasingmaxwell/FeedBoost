require('dotenv').config();
const User = require('../../lib/user');
const Token = require('../../lib/token');

module.exports = (event, context, callback) => {
  let cookieString = '';
  let page = {
    content: '',
    footer: ''
  };

  if (event.headers.hasOwnProperty('Cookie')) {
    cookieString = event.headers.Cookie;
  }

  // Get the token.
  return Token.getFromCookie(cookieString)

  // Get the user.
  .then(token => {
    return User.getFromToken(token);
  })

  // Build an authenticated page.
  .then(user => {
    page.content = `
      <h2>Hi, ${user.email}!</h2>
      <p>You've subscribed to receive email notifications when new items appear in your feed.</p>
      <a href="${process.env.REVERB_HOST}/my/feed">Take me to my feed!</a>
    `;
    page.footer = `
      <p>Would you like to stop receiving notifications? <a href="${process.env.BASE_URI}/unsubscribe">Unsubscribe</a>.</p>
    `;
  })

  // Build the anonymous page.
  .catch((e) => {
    page.content = `
      <h2>Ditch the delay in your Reverb.com feed!</h2>
      <p>Ever missed out on some rockin' gear because you didn't receive the feed notification in time? That gear gets snatched up quick! ${process.env.APP_NAME} boosts the signal of your Reverb.com feed by ditching the delay and notifying you of changes to your feed within one hour.</p>
      <p><a href="${process.env.BASE_URI}/subscribe">Boost my feed!</a></p>
    `;
    page.footer = `
      <p>Already subscribed? <a href="${process.env.BASE_URI}/login">Log in</a> to manage your preferences.</p>
      <p><a href="${process.env.BASE_URI}/subscribe">Subscribe now</a> to start recieving notifications from your feed!</p>
    `;
  })

  // Return the page.
  .then(() => {
    callback(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
      <!doctype html>
      <html>
      <head>
        <title>${process.env.APP_NAME}</title>
      </head>
      <body>
        <header id="page-header">
          <h1 id="logo">${process.env.APP_NAME}</h1>
        </header>
        <section id="page-content">
          ${page.content}
        </section>
        <footer id="page-footer">
          ${page.footer}
        </footer>
        <script src="https://d1g5417jjjo7sf.cloudfront.net/reverb-embedded-sdk.js"/>
        <script>ReverbEmbeddedSDK.init();</script>
      </body>
      </html>
      `
    })
  })
};
