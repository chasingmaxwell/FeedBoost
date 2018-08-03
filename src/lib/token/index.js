const config = require('config');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

const jwtSecret = config.get('app.jwtSecret');

function verify(token) {
  try {
    return jwt.verify(token, jwtSecret).code;
  } catch (e) {
    throw new Error('Token invalid.');
  }
}

function sign(code) {
  return jwt.sign({ code }, jwtSecret);
}

function getFromCookie(string) {
  return Promise.resolve().then(() =>
    verify(cookie.parse(string).rtoken || '')
  );
}

module.exports = {
  verify,
  sign,
  getFromCookie,
};
