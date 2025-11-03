// Import the functions and state you want to test from the main script
const { evaluateExpression, history } = require("./script");

// Define a test suite for calculator core functions
describe("Calculator Core Functions", () => {
  
  // This runs before each individual test to reset state
  beforeEach(() => {
    // Clear the history array so tests don’t interfere with each other
    history.length = 0;
  });

  // Test simple addition
  test("Simple addition", () => {
    // Evaluate "5+5" and expect the result to be 10
    expect(evaluateExpression("5+5")).toBe(10);
  });

  // Test operator precedence (order of operations)
  test("Operator precedence", () => {
    // Multiplication should happen before addition: 2 + 3*4 = 2 + 12 = 14
    expect(evaluateExpression("2+3*4")).toBe(14);
  });

  // Test handling of parentheses
  test("Parentheses handling", () => {
    // Parentheses override normal precedence: (2+3)*4 = 5*4 = 20
    expect(evaluateExpression("(2+3)*4")).toBe(20);
  });

  // Test decimal calculations
  test("Decimal calculations", () => {
    // Floating point math is tricky, so use toBeCloseTo with precision
    expect(evaluateExpression("0.1+0.2")).toBeCloseTo(0.3, 12);
  });

  // Test negative numbers
  test("Negative numbers", () => {
    // Unary minus at the start
    expect(evaluateExpression("-5+2")).toBe(-3);
    // Plus and minus combination
    expect(evaluateExpression("5+-2")).toBe(3);
  });

  // Test power (^) and modulo (%)
  test("Power and modulo", () => {
    expect(evaluateExpression("2^3")).toBe(8); // 2^3 = 8
    expect(evaluateExpression("10%3")).toBe(1); // 10 modulo 3 = 1
  });

  // Test square root and inverse
  test("Square root and inverse", () => {
    // Square root of 16 should be 4
    expect(Math.sqrt(evaluateExpression("16"))).toBe(4);
    // Inverse of 4 is 0.25
    expect(1 / evaluateExpression("4")).toBe(0.25);
  });

  // Test that history updates correctly after a calculation
  test("History updates after calculation", () => {
    const expr = "2+3"; // Define an expression
    const val = evaluateExpression(expr); // Evaluate it
    history.push(`${expr} = ${val}`); // Add it to history
    expect(history[0]).toBe("2+3 = 5"); // Check that the history array has the correct first entry
  });
});
