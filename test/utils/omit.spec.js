import { omit } from '@playerstack/web-core';

const object = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
};

describe('omit', () => {
  test('omits properties from an object', () => {
    expect(omit(object, ['a', 'b', 'c'])).toEqual({
      d: 4,
      e: 5,
    });
  });

  test('handles multiple array parameters', () => {
    expect(omit(object, ['a'], ['b'], ['c'])).toEqual({
      d: 4,
      e: 5,
    });
  });
});
