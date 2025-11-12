# Professional Calculator

A modern, responsive, and professional web-based calculator built with **HTML**, **CSS**, and **JavaScript**. Supports **keyboard input**, **parentheses**, **operator precedence**, **memory functions**, and **dark/light mode**.

---

## Demo

You can see a live demo of the calculator by opening `index.html` in any modern browser.

---

## Features

- **Basic Arithmetic:** Addition, Subtraction, Multiplication, Division
- **Advanced Functions:** Square root, Exponentiation, Reciprocal, Negation, Percent
- **Memory Operations:** M+, MR, MC
- **Dark/Light Mode:** Toggle between themes
- **Keyboard-Friendly:** Supports number keys, operators, and Enter key for calculation
- **Responsive Design:** Works on mobile and desktop

---

## Benefits

This calculator provides several benefits for users:  

- **Time-Saving:** Quick calculations without needing a physical calculator or spreadsheet  
- **Accuracy:** Handles operator precedence and parentheses, reducing calculation errors  
- **Convenience:** Keyboard support and memory functions improve workflow efficiency  
- **Accessibility:** Light/Dark mode and responsive design make it easy to use on any device  

---

# Calculator Module Tests

This repository contains unit tests for a JavaScript calculator module. The tests are written using [Jest](https://jestjs.io/) and cover the core functionality of the calculator, ensuring that mathematical operations are handled correctly.

## Test File

`script.test.js` contains tests for the main calculator module (`script.js`), including:

- Addition, subtraction, multiplication, division
- Operator precedence
- Parentheses handling
- Decimal calculations
- Negative numbers
- Power (`^`) and modulo (`%`) operations
- Square root and inverse calculations
- History updates after calculations

---

## Setup

1. **Install dependencies** (if not installed already):
```bash
npm install
npm test

##Installation
To clone and run the project locally:
git clone https://github.com/chuks2274/calculator.git
cd calculator
npm install


#  CI/CD Pipeline for HTML/JS Project (Vercel Deployment)

This project uses **GitHub Actions** to automatically test (lint) and deploy the site to **Vercel** whenever changes are pushed to the `main` branch.

##  Workflow Summary
- **ESLint** checks JavaScript code quality.  
- **Vercel CLI** deploys the latest version automatically.  
- Runs on **Ubuntu + Node.js 20** environment.

##  Required GitHub Secrets
| Name | Description |
|------|--------------|
| `VERCEL_TOKEN` | Vercel authentication token |
| `VERCEL_ORG_ID` | Your Vercel organization ID |
| `VERCEL_PROJECT_ID` | Your Vercel project ID |

## Live Deployment
View the deployed project here: [**Live Demo**](https://calculator-blond-eta-27.vercel.app/)