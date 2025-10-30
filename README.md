[![NPM Version](https://img.shields.io/npm/v/api-contract-guardian.svg)](https://www.npmjs.com/package/api-contract-guardian)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Also available in: [Türkçe](README.tr.md)**

---

A CI-friendly CLI tool to prevent API contract violations *before* they reach production.

## The Problem
API contracts (OpenAPI/Swagger) between frontend and backend teams are constantly evolving. However, the frontend team might miss a change (e.g., an endpoint rename, or a `GET` method changing to `POST`).

These bugs often go unnoticed and the code is merged, "successfully" passing the pipeline. The result: runtime errors exploding in production.

## The Solution
`api-contract-guardian` statically scans your codebase, finds all API calls made with `fetch` and `axios`, and validates them against your OpenAPI contract.

If it finds a call that doesn't match the contract (wrong path or wrong HTTP method), it exits with `process.exit(1)`, failing your CI pipeline and notifying you of the error instantly.

## ⚙️ How It Works
This tool does not run your code. Instead, it:
1.  Uses `ts-morph` to read all `js`, `jsx`, `ts`, and `tsx` files specified by your `--glob` pattern.
2.  Builds an Abstract Syntax Tree (AST) of your code.
3.  Traverses this tree to statically find the paths and methods of all API calls (like `fetch(...)` and `axios.get(...)`).
4.  Compares all found calls against the contract list fetched from the `--openapi` URL.
5.  Fails the process if a mismatch is found.

## 📦 Installation

You can install the tool globally, or add it as a `devDependency` to your project.

**Global Install:**
```bash
npm install -g api-contract-guardian
```

**Local Install (Recommended for CI/CD):**
```bash
npm install --save-dev api-contract-guardian
