// -------------------------
// DOM elements (browser)
// -------------------------
const expressionEl = typeof document !== "undefined" ? document.getElementById("expression") : null;
const resultEl = typeof document !== "undefined" ? document.getElementById("result") : null;
const historyList = typeof document !== "undefined" ? document.getElementById("historyList") : null;
const historyModal = typeof document !== "undefined" ? document.getElementById("historyModal") : null;
const modalBackdrop = typeof document !== "undefined" ? document.getElementById("modalBackdrop") : null;

// -------------------------
// State
// -------------------------
let expr = "";
let mem = 0;
let history = [];
let pendingNegative = false;

// -------------------------
// Update display
// -------------------------
function updateDisplay() {
  if (expressionEl) expressionEl.textContent = expr || "0";

  if (!resultEl) return;

  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;

  if (!expr || /[+\-*/^%]$/.test(expr) || open > close) {
    resultEl.textContent = "";
    return;
  }

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
function pushHistory(item) {
  history.unshift(item);
  if (history.length > 20) history.pop();
  renderHistory();
}

function renderHistory() {
  if (!historyList) return;
  historyList.innerHTML = "";
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
function tokenize(input) {
  const tokens = [];
  const re = /\s*(\d+(?:\.\d+)?|[()+\-*/^%])\s*/g;
  let m;
  while ((m = re.exec(input)) !== null) tokens.push(m[1]);
  return tokens;
}

const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3 };
const rightAssoc = { "^": true };

function toRPN(tokens) {
  const out = [], stack = [];
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i];
    if (t === "-" && (i === 0 || tokens[i - 1] === "(" || /[+\-*/^%]/.test(tokens[i - 1]))) {
      if (i + 1 < tokens.length && !isNaN(tokens[i + 1])) {
        out.push((-parseFloat(tokens[i + 1])).toString());
        i++;
        continue;
      }
    }
    if (!isNaN(t)) out.push(t);
    else if (t === "(") stack.push(t);
    else if (t === ")") {
      while (stack.length && stack[stack.length - 1] !== "(") out.push(stack.pop());
      stack.pop();
    } else {
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
  while (stack.length) out.push(stack.pop());
  return out;
}

function evalRPN(rpn) {
  const st = [];
  rpn.forEach(tok => {
    if (!isNaN(tok)) st.push(parseFloat(tok));
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

function evaluateExpression(s) {
  s = s.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  s = s.replace(/(\d)\s*\(/g, "$1*(").replace(/\)\s*(\d)/g, ")*$1");
  if (/[^0-9+\-*/().%^\s]/.test(s)) throw new Error("Invalid");
  const rpn = toRPN(tokenize(s));
  const val = evalRPN(rpn);
  return Math.round((val + Number.EPSILON) * 1e12) / 1e12;
}

// -------------------------
// Append value
// -------------------------
function appendValue(v) {
  if (pendingNegative) {
    expr += `-${v}`;
    pendingNegative = false;
    updateDisplay();
    return;
  }
  const lastChar = expr.slice(-1);
  if (/[+\-*/^%]/.test(v) && /[+\-*/^%]/.test(lastChar)) {
    expr = expr.slice(0, -1) + v;
    updateDisplay();
    return;
  }
  if (v === ".") {
    const parts = expr.split(/[^0-9.]/);
    const last = parts[parts.length - 1];
    if (last.includes(".")) return;
    expr = expr === "" ? "0." : expr + v;
  } else expr += v;
  updateDisplay();
}

// -------------------------
// Handle actions
// -------------------------
function handleAction(a) {
  switch (a) {
    case "clear":
      expr = "";
      pendingNegative = false;
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
// Browser event listeners
// -------------------------
if (typeof document !== "undefined") {
  document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.value;
      const a = btn.dataset.action;
      if (v) appendValue(v);
      else if (a) handleAction(a);
    });
  });

  const memPlus = document.getElementById("memPlus");
  if (memPlus) memPlus.addEventListener("click", () => { mem += evaluateExpression(expr || "0"); });

  const memRecall = document.getElementById("memRecall");
  if (memRecall) memRecall.addEventListener("click", () => { expr += String(mem); updateDisplay(); });

  const memClear = document.getElementById("memClear");
  if (memClear) memClear.addEventListener("click", () => { mem = 0; });

  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) copyBtn.addEventListener("click", () => { navigator.clipboard.writeText(resultEl.textContent); });

  const themeBtn = document.getElementById("themeBtn");
if (themeBtn) themeBtn.addEventListener("click", () => {
  document.documentElement.classList.toggle("light");
  const isLight = document.documentElement.classList.contains("light");
  themeBtn.textContent = isLight ? "Dark" : "Light"; // just the label
  themeBtn.setAttribute("aria-pressed", isLight);
});

  // -------------------------
  // History modal open/close
  // -------------------------
  const historyBtn = document.getElementById("historyBtn");
  const closeHistoryBtn = document.getElementById("closeHistoryBtn");
  const clearHistoryBtn = document.getElementById("clearHistory");

  function openHistoryModal() {
    if (historyModal && modalBackdrop) {
      renderHistory();
      historyModal.style.display = "block";
      modalBackdrop.style.display = "block";
    }
  }

  function closeHistoryModal() {
    if (historyModal && modalBackdrop) {
      historyModal.style.display = "none";
      modalBackdrop.style.display = "none";
    }
  }

  if (historyBtn) historyBtn.addEventListener("click", openHistoryModal);
  if (closeHistoryBtn) closeHistoryBtn.addEventListener("click", closeHistoryModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeHistoryModal);

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      history = [];
      renderHistory();
    });
  }

  // -------------------------
  // Keyboard support
  // -------------------------
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

updateDisplay();

// -------------------------
// Export for Jest
// -------------------------
if (typeof module !== "undefined") {
  module.exports = { evaluateExpression, appendValue, handleAction, history };
}
