const query = require('./query.js');

module.exports = token => query({
  index: 'code',
  query: 'code = :code',
  values: {
    ':code': token,
  },
})
  .then((users) => {
    if (users.length > 0) {
      return users[0];
    }

    throw new Error('No user found.');
  });
