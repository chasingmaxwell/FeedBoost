module.exports = {
  app: {
    name: process.env.APP_NAME,
    email: process.env.APP_EMAIL,
    filesUrl: process.env.FILES_URL,
    baseUri: process.env.BASE_URI,
    jwtSecret: process.env.JWT_SECRET,
    cryptrKey: process.env.CRYPTR_KEY,
    allowedUsers: process.env.ALLOWED_USERS,
  },
  reverb: {
    host: process.env.REVERB_HOST,
    key: process.env.REVERB_KEY,
    secret: process.env.REVERB_SECRET,
    redirectPath: process.env.REVERB_REDIRECT_PATH,
  },
  logger: {
    transport: 'Console',
    level: process.env.LOG_LEVEL || 'info',
    exitOnError: false,
    handleExceptions: true,
  },
};
