# api-contract-guardian

[![NPM Version](https://img.shields.io/npm/v/api-contract-guardian.svg)](https://www.npmjs.com/package/api-contract-guardian)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Also available in: [Türkçe](README.tr.md)**

---

A CI-friendly CLI tool to prevent API contract violations *before* they reach production.

## The Problem

API contracts (OpenAPI/Swagger) between frontend and backend teams are constantly evolving. However, the frontend team might miss a change (e.g., an endpoint rename, or a `GET` method changing to `POST`).

These bugs often go unnoticed and the code is merged, "successfully" passing the pipeline. The result: runtime errors exploding in production.

## ✨ The Solution

`api-contract-guardian` statically scans your codebase, finds all API calls made with `fetch` and `axios`, and validates them against your OpenAPI contract.

If it finds a call that doesn't match the contract (wrong path or wrong HTTP method), it exits with `process.exit(1)`, failing your CI pipeline and notifying you of the error instantly.

## ⚙️ How It Works

This tool does not run your code. Instead, it:

1. Uses `ts-morph` to read all `js`, `jsx`, `ts`, and `tsx` files specified by your `--glob` pattern.  
2. Builds an Abstract Syntax Tree (AST) of your code.  
3. Traverses this tree to statically find the paths and methods of all API calls (like `fetch(...)` and `axios.get(...)`).  
4. Compares all found calls against the contract list fetched from the `--openapi` URL.  
5. Fails the process if a mismatch is found.

## 📦 Installation

You can install the tool globally, or add it as a `devDependency` to your project.

### Global Install

```bash
npm install -g api-contract-guardian
```

### Local Install (Recommended for CI/CD)

```bash
npm install --save-dev api-contract-guardian
```

## 🚀 Usage

The main command is `run` and it requires two arguments:

```bash
api-guardian run --openapi <url> --glob <pattern>
```

### Arguments

- `--openapi <url>` **(Required):** The URL to the `api-docs.json` of your OpenAPI (Swagger) contract to be used for validation.  
  **E.g.:** `https://petstore.swagger.io/v2/swagger.json`

- `--glob <pattern>` **(Required):** The glob pattern to match files for scanning.  
  **E.g.:** `"src/**/*.{ts,tsx}"`

## 🧪 Examples

### 1) Scan only TypeScript files in the `src` folder

```bash
api-guardian run   --openapi "https://api.example.com/swagger.json"   --glob "src/**/*.{ts,tsx}"
```

### 2) Scan a Next.js App Router project

```bash
api-guardian run   --openapi "https://api.example.com/swagger.json"   --glob "app/**/*.{ts,tsx}"
```

### 3) Scan all script files in the project (performant)

> Automatically ignores `node_modules`, `dist`, `.git`, etc. for speed.

```bash
api-guardian run   --openapi "https://api.example.com/swagger.json"   --glob "**/*.{js,jsx,ts,tsx}"
```

## 🤖 CI/CD Integration

The true power of this tool is in automation. Add a script to your `package.json` to make it part of your CI pipeline (e.g., GitHub Actions, GitLab CI).

**Add to your `package.json`:**

```json
{
  "scripts": {
    "test": "...",
    "build": "...",
    "check:api": "api-guardian run --openapi \"https://api.example.com/swagger.json\" --glob \"src/**/*.{ts,tsx}\""
  }
}
```

Now, your CI pipeline can simply run:

```bash
npm run check:api
```

If there's a violation, the pipeline will stop.

## 📄 License

This project is licensed under the MIT License.  
**Author:** Uğur Can Ceribaşı
