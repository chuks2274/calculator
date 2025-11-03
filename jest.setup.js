// jest.setup.js
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Optional: include jest-dom matchers for convenience
require("@testing-library/jest-dom");