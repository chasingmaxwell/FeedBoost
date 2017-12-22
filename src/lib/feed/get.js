const request = require('request-promise');
const Cryptr = require('cryptr');

module.exports = (user) => {
  const cryptr = new Cryptr(process.env.CRYPTR_KEY);
  const code = cryptr.decrypt(user.code);
  return request({
    uri: `${process.env.REVERB_HOST}/api/my/feed`,
    method: 'get',
    json: true,
    headers: {
      Authorization: `Bearer ${code}`,
    },
  })
    .then(response => response.listings);
};
