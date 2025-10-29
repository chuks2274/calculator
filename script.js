(function () {
  // -------------------------
  // Get DOM elements
  // -------------------------
  const expressionEl = document.getElementById("expression"); // main expression display
  const resultEl = document.getElementById("result"); // calculation result display
  const historyList = document.getElementById("historyList"); // history container

  // -------------------------
  // State variables
  // -------------------------
  let expr = ""; // current expression string
  let mem = 0; // memory storage
  let history = []; // array of previous calculations
  let pendingNegative = false; // flag: next number should be negative

  // -------------------------
  // Update expression and result display
  // -------------------------
  function updateDisplay() {
    expressionEl.textContent = expr || "0"; // show 0 if empty
    try {
      // skip if expression is empty or ends with operator
      if (!expr || /[+\-*/^%]$/.test(expr)) {
        resultEl.textContent = "";
        return;
      }
      const val = evaluateExpression(expr); // calculate value
      if (val === undefined || isNaN(val)) resultEl.textContent = "";
      else resultEl.textContent = String(val); // show result
    } catch {
      resultEl.textContent = "";
    }
  }

  // -------------------------
  // Add an item to history
  // -------------------------
  function pushHistory(item) {
    history.unshift(item); // add to front
    if (history.length > 20) history.pop(); // limit history
    renderHistory(); // update history display
  }

  // -------------------------
  // Render history on screen
  // -------------------------
  function renderHistory() {
    historyList.innerHTML = "";
    history.forEach((h) => {
      const el = document.createElement("div");
      el.className = "history-item";
      el.textContent = h;
      historyList.appendChild(el);
    });
  }

  // -------------------------
  // Split expression string into tokens
  // -------------------------
  function tokenize(input) {
    const tokens = [];
    const re = /\s*(\d+(?:\.\d+)?|[()+\-*/^%])\s*/g;
    let m;
    while ((m = re.exec(input)) !== null) tokens.push(m[1]);
    return tokens;
  }

  // Operator precedence and right-associativity
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3 };
  const rightAssoc = { "^": true };

  // -------------------------
  // Convert tokens to Reverse Polish Notation (RPN)
  // -------------------------
  function toRPN(tokens) {
    const out = [], stack = [];
    for (let i = 0; i < tokens.length; i++) {
      let t = tokens[i];

      // Handle unary minus (negative numbers)
      if (t === "-" && (i === 0 || tokens[i - 1] === "(" || /[+\-*/^%]/.test(tokens[i - 1]))) {
        if (i + 1 < tokens.length && !isNaN(tokens[i + 1])) {
          out.push((-parseFloat(tokens[i + 1])).toString()); // merge negative
          i++; // skip next token
          continue;
        }
      }

      if (!isNaN(t)) out.push(t); // number
      else if (t === "(") stack.push(t); // open parenthesis
      else if (t === ")") { // close parenthesis
        while (stack.length && stack[stack.length - 1] !== "(") out.push(stack.pop());
        stack.pop(); // remove "("
      } else { // operator
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top === "(") break;
          const p1 = precedence[t] || 0,
            p2 = precedence[top] || 0;
          if ((!rightAssoc[t] && p1 <= p2) || (rightAssoc[t] && p1 < p2)) out.push(stack.pop());
          else break;
        }
        stack.push(t);
      }
    }
    while (stack.length) out.push(stack.pop()); // flush remaining operators
    return out;
  }

  // -------------------------
  // Evaluate RPN array
  // -------------------------
  function evalRPN(rpn) {
    const st = [];
    rpn.forEach((tok) => {
      if (!isNaN(tok)) st.push(parseFloat(tok)); // push number
      else {
        const b = st.pop(), a = st.pop(); // pop operands
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
    return st.pop(); // return final value
  }

  // -------------------------
  // Evaluate full expression string
  // -------------------------
  function evaluateExpression(s) {
    s = s.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-"); // normalize symbols
    s = s.replace(/(\d)\s*\(/g, "$1*(").replace(/\)\s*(\d)/g, ")*$1"); // handle implicit multiplication
    if (/[^0-9+\-*/().%^\s]/.test(s)) throw new Error("Invalid"); // invalid chars
    const rpn = toRPN(tokenize(s));
    const val = evalRPN(rpn);
    return Math.round((val + Number.EPSILON) * 1e12) / 1e12; // round tiny floating errors
  }

  // -------------------------
  // Add value to expression
  // -------------------------
  function appendValue(v) {
    if (pendingNegative) {
      expr += `-${v}`; // apply pending negative
      pendingNegative = false;
      updateDisplay();
      return;
    }

    const lastChar = expr.slice(-1);

    // Replace last operator if new one is pressed
    if (/[+\-*/^%]/.test(v) && /[+\-*/^%]/.test(lastChar)) {
      expr = expr.slice(0, -1) + v;
      updateDisplay();
      return;
    }

    // Handle decimal point
    if (v === ".") {
      const parts = expr.split(/[^0-9.]/);
      const last = parts[parts.length - 1];
      if (last.includes(".")) return; // prevent multiple dots
      expr = expr === "" ? "0." : expr + v;
    } else expr += v;

    updateDisplay();
  }

  // -------------------------
  // Handle action buttons
  // -------------------------
  function handleAction(a) {
    if (a === "clear") { // clear everything
      expr = "";
      resultEl.textContent = "";
      history = [];
      renderHistory();
      pendingNegative = false;
      updateDisplay();
    } else if (a === "back") { // backspace
      expr = expr.slice(0, -1);
      updateDisplay();
    } else if (a === "paren") { // add parentheses
      const open = (expr.match(/\(/g) || []).length;
      const close = (expr.match(/\)/g) || []).length;
      const lastChar = expr.slice(-1);
      if (expr === "" || /[+\-*/^%(\)]/.test(lastChar) || lastChar === "(") expr += "(";
      else if (open > close) expr += ")";
      else expr += "(";
      updateDisplay();
    } else if (a === "calculate") { // calculate result
      try {
        if (!expr) return;
        const val = evaluateExpression(expr);
        pushHistory(`${expr} = ${val}`); // save history
        expr = String(val); // update display
        resultEl.textContent = "";
        pendingNegative = false;
        expressionEl.textContent = expr;
      } catch {
        resultEl.textContent = "Error";
      }
    } else if (a === "percent") { // %
      try {
        if (!expr || /[+\-*/^%]$/.test(expr)) return;
        expr = String(evaluateExpression(expr) / 100);
        updateDisplay();
      } catch {}
    } else if (a === "sqrt") { // square root
      try {
        const v = evaluateExpression(expr || "0");
        expr = String(Math.sqrt(v));
        updateDisplay();
      } catch {}
    } else if (a === "pow") { // square (x^2)
      try {
        const v = evaluateExpression(expr || "0");
        expr = String(v * v);
        updateDisplay();
      } catch {}
    } else if (a === "inv") { // 1/x
      try {
        const v = evaluateExpression(expr || "0");
        expr = String(1 / v);
        updateDisplay();
      } catch {}
    } else if (a === "neg") { // ± button
      pendingNegative = true; // mark next number negative
    }
  }

  // -------------------------
  // Button click events
  // -------------------------
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.value;
      const a = btn.dataset.action;
      if (v) appendValue(v); // number/operator
      else if (a) handleAction(a); // action button
    });
  });

  // -------------------------
  // Memory buttons
  // -------------------------
  document.getElementById("memPlus").addEventListener("click", () => {
    mem += evaluateExpression(expr || "0"); // M+
  });
  document.getElementById("memRecall").addEventListener("click", () => {
    expr += String(mem); // MR
    updateDisplay();
  });
  document.getElementById("memClear").addEventListener("click", () => {
    mem = 0; // MC
  });

  // -------------------------
  // Copy result to clipboard
  // -------------------------
  document.getElementById("copyBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(resultEl.textContent);
  });

  // -------------------------
  // Theme toggle
  // -------------------------
  const themeBtn = document.getElementById("themeBtn");
  themeBtn.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    const isLight = document.documentElement.classList.contains("light");
    themeBtn.textContent = isLight ? "Dark" : "Light";
    themeBtn.setAttribute("aria-pressed", isLight);
  });

  // -------------------------
  // Clear history button
  // -------------------------
  document.getElementById("clearHistory").addEventListener("click", () => {
    history = [];
    renderHistory();
  });

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

  updateDisplay(); // initial display
})();
