module.exports = {
  branch: 'dev',
  analyzeCommits: 'semantic-release-conventional-commits',
  verifyConditions: '@semantic-release/github',
  prepare: [],
  publish: '@semantic-release/github',
  success: '@semantic-release/github',
  fail: '@semantic-release/github',
};
