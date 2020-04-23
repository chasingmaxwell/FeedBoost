module.exports.path = function path<I, O>(
  path: Array<string | number>
): (I) => undefined | O {
  return (input: I): undefined | O => {
    if (path.length < 1) {
      return undefined;
    }
    let curr = input[path[0]];
    for (let i = 1; i < path.length; i++) {
      if (typeof curr === 'undefined') {
        break;
      }
      curr = curr[path[i]];
    }
    return curr;
  };
};
