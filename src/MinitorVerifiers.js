export function it(label, actual, verifyFn, expected = undefined) {
  return {
    label,
    expected,
    actual,
    successful: verifyFn(actual, expected),
  };
};

export const toBeEqualTo = (actual, expected) => actual === expected;
export const toNotBeEqualTo = (actual, expected) => actual !== expected;
export const toBeEqualOrGreatherThan = (actual, expected) => actual >= expected;
export const toBeEqualOrLessThan = (actual, expected) => actual <= expected;
export const toBeGreatherThan = (actual, expected) => actual > expected;
export const toBeLessThan = (actual, expected) => actual < expected;
export const toBeTruthy = (actual) => actual;
export const toBeFalsy = (actual) => !actual;
