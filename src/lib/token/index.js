const cookie = require('cookie');
const jwt = require('jsonwebtoken');

function verify(token) {
  try {
    let data = jwt.verify(token, process.env.JWT_SECRET);
    return data.code;
  }
  catch (e) {
    throw new Error('Token invalid.');
  }
}

function sign(code) {
  return jwt.sign({code: code}, process.env.JWT_SECRET);
}

function getFromCookie(string) {
  return new Promise((resolve, reject) => {
    let cookies = cookie.parse(string)
    let token = verify(cookies.rtoken || '');
    resolve(token);
  });
}

module.exports = {
  verify: verify,
  sign: sign,
  getFromCookie: getFromCookie
}
