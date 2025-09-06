# Examples

This directory contains examples that verify the package imports work correctly by importing the package by name (as end users would) and demonstrate basic usage.

## Import Verification Examples

These examples test that the built package can be imported correctly in different environments by importing `lodestone-world-status` by name:

### `commonjs-example.cjs`

Tests CommonJS imports using dynamic `import()` (required for ESM-only packages):

```bash
node commonjs-example.cjs
```

Note: Since this package is ESM-only, it uses dynamic import() rather than require().

### `esm-example.mjs`

Tests ES Module imports using `import` syntax:

```bash
node esm-example.mjs
```

### `typescript-example.ts`

Tests TypeScript imports and type definitions:

```bash
npx tsx typescript-example.ts
```

## Usage Examples

### `basic-usage.mjs`

Demonstrates real-world usage of the library:

```bash
node basic-usage.mjs
```

**Note:** This example makes real network requests to the Final Fantasy XIV Lodestone and requires internet access.

## Running All Examples

To run all import verification examples:

```bash
# Run from the project root
cd examples

# Test CommonJS import
node commonjs-example.cjs

# Test ES Module import
node esm-example.mjs

# Test TypeScript import (requires tsx or ts-node)
npx tsx typescript-example.ts

# Test real usage (requires internet)
node basic-usage.mjs
```

## What These Examples Verify

1. **Package Resolution**: That `lodestone-world-status` can be resolved by Node.js module resolution
2. **Package Exports**: That the `package.json` exports are correctly configured
3. **Build Output**: That the TypeScript compilation produces working JavaScript
4. **Type Definitions**: That `.d.ts` files are properly generated and usable
5. **Import Paths**: That package name imports resolve correctly for different module systems
6. **Runtime Functionality**: That the compiled code actually works
7. **API Surface**: That all expected methods and types are available

If any of these examples fail, it indicates an issue with the package build, configuration, or exports.

## Prerequisites

To run these examples, the package must be built and linked:

```bash
# From the project root
pnpm build
pnpm link --global
```
