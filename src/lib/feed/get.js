const request = require('request-promise');
const Cryptr = require('cryptr');

module.exports = user => {
  let cryptr = new Cryptr(process.env.CRYPTR_KEY);
  let code = cryptr.decrypt(user.code);
  return request({
    uri: `${process.env.REVERB_HOST}/api/my/feed`,
    method: 'get',
    json: true,
    headers: {
      Authorization: `Bearer ${code}`
    }
  })
  .then(response => {
    return response.listings;
  })
};
