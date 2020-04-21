module.exports = {
  app: {
    cryptrKey: 'keepitsecret',
    jwtSecret: 'keepitsecret',
    name: 'FeedBoost',
    email: 'admin@feedboost.rocks',
    filesUrl: 'https://feedboost.rocks/files',
    baseUri: 'http://localhost:3000',
    allowedUsers: 'example@feedboost.rocks',
  },
  reverb: {
    host: 'https://reverb.com',
    key: 'keepitsecret',
    secret: 'keepitsecret',
    redirectPath: '/subscribe/success',
  },
};
