const update = require('./update');
const deleteUser = require('./delete');
const get = require('./get');
const getFromToken = require('./getFromToken');
const query = require('./query');
const scan = require('./scan');
const validate = require('./validate');

module.exports = {
  update,
  delete: deleteUser,
  get,
  getFromToken,
  query,
  scan,
  validate,
};
