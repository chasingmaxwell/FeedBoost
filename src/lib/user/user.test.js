jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: class {
      get() {} // eslint-disable-line class-methods-use-this
      update() {} // eslint-disable-line class-methods-use-this
      delete() {} // eslint-disable-line class-methods-use-this
    },
  },
}));
const { DynamoDB: { DocumentClient } } = require('aws-sdk');
const User = require('./');

describe('User', () => {
  beforeEach(() => {
    jest.spyOn(DocumentClient.prototype, 'get').mockImplementation((params, cb) => cb(null, {}));
    jest.spyOn(DocumentClient.prototype, 'update').mockImplementation((params, cb) => cb());
    jest.spyOn(DocumentClient.prototype, 'delete').mockImplementation((params, cb) => cb());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('#validate', () => {
    it('should pass when the user is valid', () => {
      expect.assertions(1);
      return User.validate({
        code: '123',
        email: 'test@example.com',
        listings: [
          '123',
          '456',
        ],
      })
        .then(() => {
          expect(true).toBe(true);
        });
    });

    it('should fail when the user is missing required properties', () => {
      expect.assertions(1);
      return User.validate({
        code: '123',
      })
        .catch((err) => {
          expect(err.message).toBe('The "email" property is required');
        });
    });

    it('should fail when a property is an invalid type', () => {
      expect.assertions(1);
      return User.validate({
        code: 123,
        email: 'test@example.com',
      })
        .catch((err) => {
          expect(err.message).toBe('The "code" property must be of type "string"');
        });
    });

    it('should fail when a property fails it\'s defined validation.', () => {
      expect.assertions(1);
      return User.validate({
        code: '123',
        email: 'test@example.com',
        listings: {
          0: 123,
          1: 345,
        },
      })
        .catch((err) => {
          expect(err.message).toEqual('The "listings" property failed validation.');
        });
    });
  });

  // @TODO: check the created and updated properties.
  describe('#update', () => {
    const user = {
      code: '123',
      email: 'test@example.com',
      clients: ['client1', 'client2'],
    };

    it('should create a user', () => {
      expect.assertions(1);
      return User.update(user)
        .then((createdUser) => {
          expect(user).toEqual(createdUser);
        });
    });

    it('should report error messages', () => {
      expect.assertions(1);
      const expectedErr = new Error('Danger!');
      DocumentClient.prototype.update.mockImplementation((params, cb) => cb(expectedErr));
      return User.update(user)
        .catch((err) => {
          expect(err).toEqual(expectedErr);
        });
    });
  });

  describe('#delete', () => {
    expect.assertions(1);
    const email = 'test@example.com';
    it('should delete a user', () => {
      expect.assertions(1);
      return User.delete(email)
        .then((deletedEmail) => {
          expect(email).toBe(deletedEmail);
        });
    });

    it('should report error messages', () => {
      expect.assertions(1);
      const expectedErr = new Error('nooo!');
      DocumentClient.prototype.delete.mockImplementation((params, cb) => cb(expectedErr));
      return User.delete(email)
        .catch((err) => {
          expect(err).toEqual(expectedErr);
        });
    });
  });

  describe('#get', () => {
    const user = {
      code: '123',
      email: 'test@example.com',
      clients: ['client1', 'client2'],
    };

    it('should get a user', () => {
      expect.assertions(1);
      DocumentClient.prototype.get.mockImplementation((params, cb) => cb(null, { Item: user }));
      return User.get(user.email)
        .then((returnedUser) => {
          expect(user).toEqual(returnedUser);
        });
    });

    it('should report error messages', () => {
      const expectedErr = new Error('nooo!');
      DocumentClient.prototype.get.mockImplementation((params, cb) => cb(expectedErr));
      return User.get(user.email)
        .catch((err) => {
          expect(err).toEqual(expectedErr);
        });
    });
  });
});
