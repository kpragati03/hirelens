// Six timed JavaScript challenges. Each test is { input: [...args], expected, hidden }.
// The runner (see Assessments.jsx) calls the named function with `input` and
// compares the return value with `expected` using deep equality.

export const CHALLENGES = [
  {
    id: 'reverse-string', title: 'Reverse a String', difficulty: 'Easy', timeMinutes: 10,
    description: 'Write a function reverseString(s) that returns the input string reversed.',
    functionName: 'reverseString',
    starterCode: 'function reverseString(s) {\n  // return the reversed string\n  return s;\n}',
    tests: [
      { input: ['hello'], expected: 'olleh', hidden: false },
      { input: ['HireLens'], expected: 'sneLeriH', hidden: false },
      { input: [''], expected: '', hidden: false },
      { input: ['a'], expected: 'a', hidden: true },
      { input: ['racecar'], expected: 'racecar', hidden: true },
    ],
  },
  {
    id: 'two-sum', title: 'Two Sum', difficulty: 'Medium', timeMinutes: 15,
    description: 'Write a function twoSum(nums, target) that returns the indices of the two numbers that add up to target. Assume exactly one solution.',
    functionName: 'twoSum',
    starterCode: 'function twoSum(nums, target) {\n  // return [i, j]\n  return [];\n}',
    tests: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], hidden: false },
      { input: [[3, 2, 4], 6], expected: [1, 2], hidden: false },
      { input: [[3, 3], 6], expected: [0, 1], hidden: false },
      { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], hidden: true },
      { input: [[0, 4, 3, 0], 0], expected: [0, 3], hidden: true },
    ],
  },
  {
    id: 'palindrome', title: 'Palindrome Check', difficulty: 'Easy', timeMinutes: 10,
    description: 'Write a function isPalindrome(s) that returns true if the string reads the same forwards and backwards, ignoring case and non-alphanumeric characters.',
    functionName: 'isPalindrome',
    starterCode: 'function isPalindrome(s) {\n  // return true or false\n  return false;\n}',
    tests: [
      { input: ['racecar'], expected: true, hidden: false },
      { input: ['hello'], expected: false, hidden: false },
      { input: ['A man, a plan, a canal: Panama'], expected: true, hidden: false },
      { input: [''], expected: true, hidden: true },
      { input: ['Noon'], expected: true, hidden: true },
    ],
  },
  {
    id: 'fizzbuzz', title: 'FizzBuzz', difficulty: 'Easy', timeMinutes: 10,
    description: 'Write a function fizzBuzz(n) that returns an array of strings from 1 to n: "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for multiples of both, otherwise the number as a string.',
    functionName: 'fizzBuzz',
    starterCode: 'function fizzBuzz(n) {\n  // return an array of strings\n  return [];\n}',
    tests: [
      { input: [3], expected: ['1', '2', 'Fizz'], hidden: false },
      { input: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'], hidden: false },
      { input: [15], expected: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'], hidden: false },
      { input: [1], expected: ['1'], hidden: true },
      { input: [0], expected: [], hidden: true },
    ],
  },
  {
    id: 'find-max', title: 'Find Max', difficulty: 'Easy', timeMinutes: 10,
    description: 'Write a function findMax(arr) that returns the largest number in the array. Return null for an empty array.',
    functionName: 'findMax',
    starterCode: 'function findMax(arr) {\n  // return the largest number, or null\n  return null;\n}',
    tests: [
      { input: [[1, 5, 3, 9, 2]], expected: 9, hidden: false },
      { input: [[-10, -3, -20]], expected: -3, hidden: false },
      { input: [[]], expected: null, hidden: false },
      { input: [[42]], expected: 42, hidden: true },
      { input: [[7, 7, 7]], expected: 7, hidden: true },
    ],
  },
  {
    id: 'anagram-check', title: 'Anagram Check', difficulty: 'Medium', timeMinutes: 15,
    description: 'Write a function isAnagram(a, b) that returns true if the two strings are anagrams of each other (same letters, ignoring case and spaces).',
    functionName: 'isAnagram',
    starterCode: 'function isAnagram(a, b) {\n  // return true or false\n  return false;\n}',
    tests: [
      { input: ['listen', 'silent'], expected: true, hidden: false },
      { input: ['hello', 'world'], expected: false, hidden: false },
      { input: ['Astronomer', 'Moon starer'], expected: true, hidden: false },
      { input: ['a', 'a'], expected: true, hidden: true },
      { input: ['abc', 'ab'], expected: false, hidden: true },
    ],
  },
];

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Run a candidate's code against a challenge's tests in the browser.
 * Uses `new Function` so the code runs isolated from the app scope (no
 * access to app state), inside try/catch, with a wall-clock guard: each
 * test call is aborted if it does not return quickly. Note: a true infinite
 * loop can still block the tab — for production use, set
 * VITE_PISTON_API_URL (see runTests) or Judge0 instead.
 */
export function runTestsLocal(code, challenge) {
  const results = [];
  let fn;
  try {
    fn = new Function(`${code}\n; return ${challenge.functionName};`)();
    if (typeof fn !== 'function') throw new Error(`${challenge.functionName} is not defined as a function.`);
  } catch (err) {
    return challenge.tests.map((t) => ({ ...t, passed: false, error: err.message }));
  }
  for (const test of challenge.tests) {
    const start = performance.now();
    try {
      const got = fn(...test.input);
      const passed = deepEqual(got, test.expected) && performance.now() - start < 2000;
      results.push({ ...test, passed, got });
    } catch (err) {
      results.push({ ...test, passed: false, error: err.message });
    }
  }
  return results;
}

/** Run tests via Piston if VITE_PISTON_API_URL is set, otherwise locally. */
export async function runTests(code, challenge) {
  const pistonBase = import.meta.env.VITE_PISTON_API_URL;
  if (!pistonBase) return runTestsLocal(code, challenge);
  try {
    const harness = `
${code}
const tests = ${JSON.stringify(challenge.tests)};
const results = tests.map((t, i) => {
  try {
    const got = ${challenge.functionName}(...t.input);
    return { i, passed: JSON.stringify(got) === JSON.stringify(t.expected), got };
  } catch (e) { return { i, passed: false, error: String(e && e.message || e) }; }
});
console.log(JSON.stringify(results));
`;
    const res = await fetch(`${pistonBase.replace(/\/$/, '')}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'javascript', version: '18.15.0', files: [{ content: harness }] }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data?.run?.output || '[]');
    return challenge.tests.map((t, i) => ({ ...t, passed: !!parsed[i]?.passed, got: parsed[i]?.got, error: parsed[i]?.error }));
  } catch (err) {
    console.warn('Piston failed, falling back to local runner:', err.message);
    return runTestsLocal(code, challenge);
  }
}
