require('dotenv').config();
const cookie = require('cookie');

module.exports = (event, context, callback) => {
  callback(null, {
    statusCode: 302,
    body: '',
    headers: {
      'Location': process.env.BASE_URI,
      'Set-Cookie': cookie.serialize('rtoken', 'deleted', {
        httpOnly: true,
        maxAge: -1,
        path: '/'
      })
    }
  });
};
