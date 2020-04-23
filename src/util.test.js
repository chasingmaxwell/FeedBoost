const util = require('./util');

describe('path', () => {
  it('returns the value at the given path from the input object', () => {
    expect(util.path(['a', 'b'])({ a: { b: 'expected' } })).toBe('expected');
  });
  it('supports arrays', () => {
    expect(util.path([0, 1])([[null, 'expected']])).toBe('expected');
  });
  it('supports arrays inside objects', () => {
    expect(util.path(['a', 1])({ a: [null, 'expected'] })).toBe('expected');
  });
  it('supports objects inside arrays', () => {
    expect(util.path([0, 'a'])([{ a: 'expected' }])).toBe('expected');
  });
  it('returns undefined when the target item is missing', () => {
    expect(util.path([0, 'a'])([{}])).toBeUndefined();
  });
  it('returns undefined when a parent of the the target item is missing', () => {
    expect(util.path([0, 'a', 'b'])([{}])).toBeUndefined();
  });
  it('returns undefined when the first item in undefined', () => {
    expect(util.path(['a', 'b'])({})).toBeUndefined();
  });
});
