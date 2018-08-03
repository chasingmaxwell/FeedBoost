module.exports = user =>
  new Promise((resolve, reject) => {
    const props = new Map();
    props.set('code', {
      required: true,
      type: 'string',
    });
    props.set('email', {
      required: true,
      type: 'string',
    });
    props.set('listings', {
      type: 'object',
      validate: value => Array.isArray(value),
    });

    // Check for required properties.
    props.forEach((config, prop) => {
      const type = typeof user[prop];
      if (config.required && type === 'undefined') {
        reject(new Error(`The "${prop}" property is required`));
        return;
      }
      if (type !== 'undefined') {
        if (type !== config.type) {
          reject(
            new Error(`The "${prop}" property must be of type "${config.type}"`)
          );
          return;
        }
        if (
          typeof config.validate === 'function' &&
          !config.validate(user[prop])
        ) {
          reject(new Error(`The "${prop}" property failed validation.`));
        }
      }
    });

    resolve(user);
  });
