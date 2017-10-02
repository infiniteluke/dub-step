import { callAll, unwrapArray, getSign } from '../src/utils';

test('getSign returns the sign of a number.', () => {
  expect(getSign(-135)).toBe(-1);
  expect(getSign(135)).toBe(1);
  expect(getSign(0)).toBe(1);
});

test('unWrapArray returns the first item if an array', () => {
  expect(unwrapArray([1, 2])).toBe(1);
  expect(unwrapArray(1)).toBe(1);
});

test('callAll calls all functions', () => {
  const doThing = jest.fn();
  const doAnotherThing = jest.fn();
  callAll(doThing, doAnotherThing)();
  expect(doThing).toBeCalled();
  expect(doAnotherThing).toBeCalled();
});
