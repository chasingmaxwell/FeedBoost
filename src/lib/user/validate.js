module.exports = (user) => {
  return new Promise((resolve, reject) => {
    const props = new Map();
    props.set('code', {
      required: true,
      type: 'string'
    });
    props.set('email', {
      required: true,
      type: 'string'
    });
    props.set('listings', {
      type: 'object',
      validate: value => Array.isArray(value)
    });

    // Check for required properties.
    for (let [prop, config] of props) {
      if (config.required && !user.hasOwnProperty(prop)) {
        reject(new Error(`The "${prop}" property is required`));
        return;
      }
      if (typeof user[prop] !== 'undefined') {
        if (typeof user[prop] !== config.type) {
          reject(new Error(`The "${prop}" property must be of type "${config.type}"`));
          return;
        }
        if (typeof config.validate === 'function' && !config.validate(user[prop])) {
          reject(new Error(`The "${prop}" property failed validation.`));
          return;
        }
      }
    }

    resolve(user);
  });
}
