module.exports = {
  hooks: {
    'pre-commit': 'yarn husky:precommit',
    'commit-msg': 'yarn husky:commitmsg',
    'pre-push': 'yarn husky:prepush',
  },
};
