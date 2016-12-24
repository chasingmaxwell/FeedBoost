const User = require('../../lib/user');
const Token = require('../../lib/token');

module.exports = (event, context, callback) => {
  let cookieString = '';
  let page = {
    content: '',
    footer: ''
  };
  let successMessage = '';
  let errorMessage = '';

  if (event.headers.hasOwnProperty('Cookie')) {
    cookieString = event.headers.Cookie;
  }

  if (event.queryStringParameters) {
    if (event.queryStringParameters.hasOwnProperty('successMessage')) {
      successMessage = `<div class="successMessage message">${event.queryStringParameters.successMessage}</div>`;
    }

    if (event.queryStringParameters.hasOwnProperty('errorMessage')) {
      errorMessage = `<div class="errorMessage message">${event.queryStringParameters.errorMessage}</div>`;
    }
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
      <p class="cta"><a href="${process.env.REVERB_HOST}/my/feed" target="_blank">Take me to my feed!</a></p>
    `;
    page.footer = `
      <p>Would you like to stop receiving notifications? Uninstall FeedBoost from your <a href="${process.env.REVERB_HOST}/apps/installed" target="_blank">apps dashboard</a> on Reverb.com.</p>
      <p>Not ${user.email}? <a href="${process.env.BASE_URI}/logout">Log out</a>.
    `;
  })

  // Build the anonymous page.
  .catch((e) => {
    page.content = `
      <h2>Ditch the delay in your Reverb.com feed!</h2>
      <p>Ever missed out on some rockin' gear because you didn't receive the feed notification in time? That gear gets snatched up quick! ${process.env.APP_NAME} boosts the signal of your Reverb.com feed by ditching the delay and notifying you of changes to your feed within one hour.</p>
      <p class="cta"><a href="${process.env.BASE_URI}/subscribe">Boost my feed!</a></p>
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
        <meta name="viewport" content="width=device-width" />
        <link href="https://fonts.googleapis.com/css?family=Yesteryear" rel="stylesheet">
        <style type="text/css">
          /* http://meyerweb.com/eric/tools/css/reset/
             v2.0 | 20110126
             License: none (public domain)
          */
          html, body, div, span, applet, object, iframe,
          h1, h2, h3, h4, h5, h6, p, blockquote, pre,
          a, abbr, acronym, address, big, cite, code,
          del, dfn, em, img, ins, kbd, q, s, samp,
          small, strike, strong, sub, sup, tt, var,
          b, u, i, center,
          dl, dt, dd, ol, ul, li,
          fieldset, form, label, legend,
          table, caption, tbody, tfoot, thead, tr, th, td,
          article, aside, canvas, details, embed,
          figure, figcaption, footer, header, hgroup,
          menu, nav, output, ruby, section, summary,
          time, mark, audio, video {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            font: inherit;
            vertical-align: baseline;
          }
          /* HTML5 display-role reset for older browsers */
          article, aside, details, figcaption, figure,
          footer, header, hgroup, menu, nav, section {
            display: block;
          }
          body {
            line-height: 1;
          }
          ol, ul {
            list-style: none;
          }
          blockquote, q {
            quotes: none;
          }
          blockquote:before, blockquote:after,
          q:before, q:after {
            content: '';
            content: none;
          }
          table {
            border-collapse: collapse;
            border-spacing: 0;
          }

          /* Custom styles */
          html, body {
            background: #f5f5f5;
          }
          body {
            font-family: "PT Sans", "Verdana", sans-serif;
            color: #333;
            font-size: 16px;
            line-height: 1.75em;
            max-width: 560px;
            margin: 0 auto;
            padding: 0 10px;
          }
          h2, h3, h4, h5, h6 {
            font-weight: bold;
            line-height: 1.5em;
            margin: .5em 0;
          }
          h2 {
            font-size: 1.5em;
          }
          a {
            color: #0080a5;
            text-decoration: none;
          }
          a:hover, a:visited, a:active {
            color: #00607d;
          }
          #logo {
            height: 4em;
            margin: 3em auto;
            display: block;
          }
          #logo .fallback {
            font-size: 66px;
            font-weight: 400;
            font-family: 'Yesteryear', cursive;
            line-height: 1em;
            text-align: center;
          }
          .cta {
            text-align: center;
            margin: 2.5em 0;
          }
          .cta a {
            display: block;
            background: #0080a5;
            padding: .5em .75em;
            color: #fff;
            font-size: 20px;
            text-shadow: #00495f 0 1px;
            border-radius: 2px;
          }
          .cta a:hover {
            background: #00607d;
            text-shadow: #333;
          }
          #page-footer {
            position: relative;
            margin-top: 3em;
            padding: 1em 0;
            color: #999;
          }
          .message {
            margin: 1em 0;
            padding: .75em;
          }
          .successMessage {
            border: 1px solid #85dc79;
            background: 1px solid #afdca8;
          }
          .errorMessage {
            border: 1px solid #dc7979;
            background: 1px solid #dca8a8;
          }
        </style>
      </head>
      <body>
        <header id="page-header">
          ${successMessage}
          ${errorMessage}
          <object id="logo" type="image/svg+xml" data="${process.env.FILES_URL}/logo.svg"><h1 class="fallback">${process.env.APP_NAME}</h1></object>
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
