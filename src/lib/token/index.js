const cookie = require('cookie');
const jwt = require('jsonwebtoken');

function verify(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET).code;
  }
  catch (e) {
    throw new Error('Token invalid.');
  }
}

function sign(code) {
  return jwt.sign({ code }, process.env.JWT_SECRET);
}

function getFromCookie(string) {
  return Promise.resolve()
    .then(() => verify(cookie.parse(string).rtoken || ''));
}

module.exports = {
  verify,
  sign,
  getFromCookie,
};
