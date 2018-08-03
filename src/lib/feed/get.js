const config = require('config');
const request = require('request-promise');
const Cryptr = require('cryptr');

const cryptrKey = config.get('app.cryptrKey');
const reverbHost = config.get('reverb.host');

module.exports = user => {
  const cryptr = new Cryptr(cryptrKey);
  const code = cryptr.decrypt(user.code);
  return request({
    uri: `${reverbHost}/api/my/feed`,
    method: 'get',
    json: true,
    headers: {
      Authorization: `Bearer ${code}`,
    },
  }).then(response => response.listings);
};
