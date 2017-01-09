const dbStubs = require('../stubs/DocumentClient');
const User = require('../../src/lib/user');
const assert = require('assert');

describe('User', () => {
  before(() => {
    dbStubs.stubAll();
  })

  after(() => {
    dbStubs.restoreAll();
  })

  describe('#validate', () => {
    it('should pass when the user is valid', () => {
      return User.validate({
        code: '123',
        email: 'test@example.com',
        listings: [
          '123',
          '456'
        ]
      })

      .then(() => {
        assert(true);
      })
    })

    it('should fail when the user is missing required properties', () => {
      return User.validate({
        code: '123'
      })

      .then(() => {
        throw new Error('The invalid user passed validation.');
      })

      .catch((err) => {
        assert.equal(err.message, 'The "email" property is required');
      })
    })

    it('should fail when a property is an invalid type', () => {
      return User.validate({
        code: 123,
        email: 'test@example.com'
      })

      .then(() => {
        throw new Error('The invalid user passed validation.');
      })

      .catch((err) => {
        assert.equal(err.message, 'The "code" property must be of type "string"');
      })
    })

    it('should fail when a property fails it\'s defined validation.', () => {
      return User.validate({
        code: '123',
        email: 'test@example.com',
        listings: {0: 123, 1: 345}
      })

      .then(() => {
        throw new Error('The invalid user passed validation.');
      })

      .catch((err) => {
        assert.equal(err.message, 'The "listings" property failed validation.');
      })
    })
  })

  // @TODO: check the created and updated properties.
  describe('#update', () => {
    let user = {
      code: '123',
      email: 'test@example.com',
      clients: ['client1', 'client2']
    };

    it('should create a user', () => {
      dbStubs.stubs.get.yields(null, {});
      dbStubs.stubs.update.yields();
      return User.update(user)
      .then((createdUser) => {
        assert.deepStrictEqual(user, createdUser, 'The created user contains the same properties as the ones passed.');
      })
    })

    it('should report error messages', () => {
      let expectedErr = new Error('Danger!');

      dbStubs.stubs.get.yields(null, {});
      dbStubs.stubs.update.yields(expectedErr);

      return User.update(user)

      .then(() => {
        throw new Error('No error reported.');
      })

      .catch((err) => {
        assert.deepStrictEqual(err, expectedErr);
      })
    })
  })

  describe('#delete', () => {
    let email = 'test@example.com';
    it('should delete a user', () => {
      dbStubs.stubs.delete.yields();

      return User.delete(email)

      .then((deletedEmail) => {
        assert.equal(email, deletedEmail);
      })
    })

    it('should report error messages', () => {
      let expectedErr = new Error('nooo!');

      dbStubs.stubs.delete.yields(expectedErr);

      return User.delete(email)

      .then(() => {
        throw new Error('No error reported.');
      })

      .catch((err) => {
        assert.deepStrictEqual(err, expectedErr);
      })
    })
  })

  describe('#get', () => {
    let user = {
      code: '123',
      email: 'test@example.com',
      clients: ['client1', 'client2']
    };

    it('should get a user', () => {
      dbStubs.stubs.get.yields(null, {Item: user});

      return User.get(user.email)

      .then((returnedUser) => {
        assert.deepStrictEqual(user, returnedUser);
      })
    })

    it('should report error messages', () => {
      let expectedErr = new Error('nooo!');
      dbStubs.stubs.get.yields(expectedErr);

      return User.get(user.email)

      .then(() => {
        throw new Error('No error reported.');
      })

      .catch((err) => {
        assert.deepStrictEqual(err, expectedErr);
      })
    })
  })
});
