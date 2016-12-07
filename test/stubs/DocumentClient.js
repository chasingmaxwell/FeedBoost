const sinon = require('sinon');
const AWS = require('aws-sdk');

let stubs = {
  put: null,
  delete: null,
  get: null
};

let restoreAll = () => {
  for (let stub in stubs) {
    stubs[stub].restore();
  }
}

let stubAll = () => {
  for (let stub in stubs) {
    stubs[stub] = sinon.stub(AWS.DynamoDB.DocumentClient.prototype, stub);
  }
}

module.exports = {
  stubs: stubs,
  restoreAll: restoreAll,
  stubAll: stubAll
};
