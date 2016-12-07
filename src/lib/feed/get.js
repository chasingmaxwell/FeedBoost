require('dotenv').config();
const request = require('request-promise');

module.exports = user => {
  return request({
    uri: `${process.env.REVERB_HOST}/api/my/feed`,
    method: 'get',
    json: true,
    headers: {
      Authorization: `Bearer ${user.code}`
    }
  })
  .then(response => {
    return response.listings;
  })
};
