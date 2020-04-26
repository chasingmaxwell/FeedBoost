const OldCryptr = require('cryptr-old');
const Cryptr = require('cryptr');
const config = require('config');
const cryptrKey = config.get('app.cryptrKey');

const cryptr = new Cryptr(cryptrKey);
const oldCryptr = new OldCryptr(cryptrKey);

const { scan, update } = require('../lib/user');
module.exports.handler = async () => {
  return new Promise((res, rej) => {
    const batches = [];
    const scanStream = scan();
    scanStream.on('data', (users: Array<User>) => {
      batches.push(
        Promise.all(
          users.map(async (user) => {
            const code = cryptr.encrypt(oldCryptr.decrypt(user.code));
            await update({ ...user, code });
          })
        )
      );
    });
    scanStream.on('end', () => {
      res(Promise.all(batches));
    });
    scanStream.on('error', (e) => {
      rej(e);
    });
  });
};
