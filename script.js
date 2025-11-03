// Calculator module for browser and Jest testing
// This file contains core calculator logic, DOM interactions (for browsers), 
// and exports for testing with Jest.

// -------------------------
// DOM elements (optional for Jest)
// -------------------------
// `expressionEl` is the DOM element showing the current expression. Null if not in browser (e.g., Jest).
const expressionEl = typeof document !== "undefined" ? document.getElementById("expression") : null;

// `resultEl` shows the evaluated result. Null if not in browser.
const resultEl = typeof document !== "undefined" ? document.getElementById("result") : null;

// `historyList` is the container for previous calculations. Null if not in browser.
const historyList = typeof document !== "undefined" ? document.getElementById("historyList") : null;


// -------------------------
// State
// -------------------------
// `expr` holds the current mathematical expression as a string.
let expr = "";

// `mem` holds the calculator memory value for M+, MR, MC functionality.
let mem = 0;

// `history` stores previous expressions/results, up to 20 entries.
let history = [];

// `pendingNegative` is true if the next number should be treated as negative.
let pendingNegative = false;


// -------------------------
// Update display safely
// -------------------------
// Update expression display, default to "0" if empty.
function updateDisplay() {
  if (expressionEl) expressionEl.textContent = expr || "0";
  
   // If no result element exists, stop here (e.g., Jest testing).
  if (!resultEl) return;
  
  // Count opening and closing parentheses to check for completeness.
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  

  // Don't evaluate if incomplete
  if (!expr || /[+\-*/^%]$/.test(expr) || open > close) {
    resultEl.textContent = "";
    return;
  }
  // Safely evaluate expression and show result. Show empty if invalid.
  try {
    const val = evaluateExpression(expr);
    resultEl.textContent = isNaN(val) ? "" : String(val);
  } catch {
    resultEl.textContent = "";
  }
}

// -------------------------
// History
// -------------------------
// Add new history item to the start (most recent first).
function pushHistory(item) {
  history.unshift(item);
  
  // Keep history size at max 20 items.
  if (history.length > 20) history.pop();
  
  // Refresh DOM history list
  renderHistory();
  
}
// Skip if no DOM element 
function renderHistory() {
  if (!historyList) return;
  
  // Clear previous history display
  historyList.innerHTML = "";
  
  // Render each history item as a div in the DOM
  history.forEach(h => {
    const el = document.createElement("div");
    el.className = "history-item";
    el.textContent = h;
    historyList.appendChild(el);
  });
  
}

// -------------------------
// Expression evaluation
// -------------------------
// Convert input string into array of tokens: numbers, operators, parentheses
function tokenize(input) {
  const tokens = [];
  const re = /\s*(\d+(?:\.\d+)?|[()+\-*/^%])\s*/g;
  let m;
  while ((m = re.exec(input)) !== null) tokens.push(m[1]);
  return tokens;
}
 
  // Operator precedence levels for Shunting Yard algorithm
const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3 };
// '^' operator is right-associative
const rightAssoc = { "^": true };


function toRPN(tokens) {
  const out = [], stack = [];
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i];

    // Handle unary minus (negative numbers)
    if (t === "-" && (i === 0 || tokens[i - 1] === "(" || /[+\-*/^%]/.test(tokens[i - 1]))) {
      if (i + 1 < tokens.length && !isNaN(tokens[i + 1])) {
        out.push((-parseFloat(tokens[i + 1])).toString());
        i++;
        continue;
      }
    }
    // Numbers go directly to output
    if (!isNaN(t)) out.push(t);
    
    // Push '(' onto stack
    else if (t === "(") stack.push(t);
    
    // Pop operators until matching '('
    else if (t === ")") {
      while (stack.length && stack[stack.length - 1] !== "(") out.push(stack.pop());
      stack.pop();
    }
    

    else {
      // Handle operators
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top === "(") break;
        const p1 = precedence[t] || 0, p2 = precedence[top] || 0;
        if ((!rightAssoc[t] && p1 <= p2) || (rightAssoc[t] && p1 < p2)) out.push(stack.pop());
        else break;
      }
      stack.push(t);
    }
  }
  // Pop remaining operators
  while (stack.length) out.push(stack.pop());
  return out;
}
// Numbers pushed onto stack
function evalRPN(rpn) {
  const st = [];
  rpn.forEach(tok => {
    if (!isNaN(tok)) st.push(parseFloat(tok));
    // Operators pop two operands and push result
    else {
      const b = st.pop(), a = st.pop();
      if (a === undefined || b === undefined) throw new Error("Invalid operation");
      switch (tok) {
        case "+": st.push(a + b); break;
        case "-": st.push(a - b); break;
        case "*": st.push(a * b); break;
        case "/": st.push(a / b); break;
        case "%": st.push(a % b); break;
        case "^": st.push(Math.pow(a, b)); break;
      }
    }
  });
  return st.pop();
}
  
// Main function to evaluate expression string
function evaluateExpression(s) {
  s = s.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");

  // Add implicit multiplication (e.g., 2(3) → 2*(3))
  s = s.replace(/(\d)\s*\(/g, "$1*(").replace(/\)\s*(\d)/g, ")*$1");

  // Throw error if invalid characters
  if (/[^0-9+\-*/().%^\s]/.test(s)) throw new Error("Invalid");
  
  // Evaluate string expression safely and round to 12 decimal places
  const rpn = toRPN(tokenize(s));
  const val = evalRPN(rpn);
  return Math.round((val + Number.EPSILON) * 1e12) / 1e12;
}

// -------------------------
// Append value
// -------------------------
// Handle pending negative number
function appendValue(v) {
  if (pendingNegative) {
    expr += `-${v}`;
    pendingNegative = false;
    updateDisplay();
    return;
  }
  // Replace last operator if a new operator is typed consecutively
  const lastChar = expr.slice(-1);

  if (/[+\-*/^%]/.test(v) && /[+\-*/^%]/.test(lastChar)) {
    expr = expr.slice(0, -1) + v;
    updateDisplay();
    return;
  }
  // Prevent multiple decimals in a number
  if (v === ".") {
    const parts = expr.split(/[^0-9.]/);
    const last = parts[parts.length - 1];
    if (last.includes(".")) return;
    expr = expr === "" ? "0." : expr + v;
  } else expr += v;
  
  // Update display after appending
  updateDisplay();
}

// -------------------------
// Handle actions
// -------------------------
// Handles actions triggered by buttons like clear, back, parentheses, calculate, percent, sqrt, pow, inv, neg
function handleAction(a) {
  switch (a) {
    case "clear":
      expr = "";
      history = [];
      pendingNegative = false;
      if (resultEl) resultEl.textContent = "";
      renderHistory();
      updateDisplay();
      break;
    case "back":
      expr = expr.slice(0, -1);
      updateDisplay();
      break;
    case "paren":
      const open = (expr.match(/\(/g) || []).length;
      const close = (expr.match(/\)/g) || []).length;
      const lastChar = expr.slice(-1);
      if (expr === "" || /[+\-*/^%(\)]/.test(lastChar)) expr += "(";
      else if (open > close) expr += ")";
      else expr += "(";
      updateDisplay();
      break;
    case "calculate":
      try {
        if (!expr) return;
        const val = evaluateExpression(expr);
        pushHistory(`${expr} = ${val}`);
        expr = String(val);
        if (resultEl) resultEl.textContent = "";
        if (expressionEl) expressionEl.textContent = expr;
        pendingNegative = false;
      } catch {
        if (resultEl) resultEl.textContent = "Error";
      }
      break;
    case "percent":
      try {
        if (!expr || /[+\-*/^%]$/.test(expr)) return;
        expr = String(evaluateExpression(expr) / 100);
        updateDisplay();
      } catch {}
      break;
    case "sqrt":
      try {
        const v = evaluateExpression(expr || "0");
        expr = String(Math.sqrt(v));
        updateDisplay();
      } catch {}
      break;
    case "pow":
      try {
        const v = evaluateExpression(expr || "0");
        expr = String(v * v);
        updateDisplay();
      } catch {}
      break;
    case "inv":
      try {
        const v = evaluateExpression(expr || "0");
        expr = String(1 / v);
        updateDisplay();
      } catch {}
      break;
    case "neg":
      pendingNegative = true;
      break;
  }
}
// -------------------------
// Event listeners (browser only)
// -------------------------
// Attach click listeners to all buttons. Use data-value or data-action attributes.
if (typeof document !== "undefined") {
  document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.value;
      const a = btn.dataset.action;
      if (v) appendValue(v);
      else if (a) handleAction(a);
    });
  });
  // Memory plus button adds current value to memory
  const memPlus = document.getElementById("memPlus");
  if (memPlus) memPlus.addEventListener("click", () => { mem += evaluateExpression(expr || "0"); });

  // Memory recall button appends memory to current expression
  const memRecall = document.getElementById("memRecall");
  if (memRecall) memRecall.addEventListener("click", () => { expr += String(mem); updateDisplay(); });
  
  // Memory clear button resets memory
  const memClear = document.getElementById("memClear");
  if (memClear) memClear.addEventListener("click", () => { mem = 0; });
  
  // Copy result to clipboard
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) copyBtn.addEventListener("click", () => { navigator.clipboard.writeText(resultEl.textContent); });
  
  // Toggle light/dark theme
  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) themeBtn.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    const isLight = document.documentElement.classList.contains("light");
    themeBtn.textContent = isLight ? "Dark" : "Light";
    themeBtn.setAttribute("aria-pressed", isLight);
  });
  // Clear history list
  const clearHistoryBtn = document.getElementById("clearHistory");
  if (clearHistoryBtn) clearHistoryBtn.addEventListener("click", () => { history = []; renderHistory(); });
  
  // Keyboard support for numbers, operators, decimal, enter, backspace, escape, parentheses
  window.addEventListener("keydown", (e) => {
    if (e.key >= "0" && e.key <= "9") appendValue(e.key);
    else if (["+", "-", "*", "/", "^", "%"].includes(e.key)) appendValue(e.key);
    else if (e.key === ".") appendValue(".");
    else if (e.key === "Enter" || e.key === "=") handleAction("calculate");
    else if (e.key === "Backspace") handleAction("back");
    else if (e.key === "Escape") handleAction("clear");
    else if (e.key === "(" || e.key === ")") appendValue(e.key);
  });
  
}
// Initialize the display on load
updateDisplay();

// -------------------------
// Export for Jest
// -------------------------
// Export core functions for Jest testing  
if (typeof module !== "undefined") {
  module.exports = { evaluateExpression, appendValue, handleAction, history };
}

