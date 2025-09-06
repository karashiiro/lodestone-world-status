# Contributing to Lodestone World Status

Thank you for your interest in contributing to the Lodestone World Status library! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js v16+
- pnpm

### Setting up the Development Environment

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/karashiiro/lodestone-world-status.git
   cd lodestone-world-status
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Run the tests to ensure everything works**

   ```bash
   pnpm test
   ```

4. **Build the project**
   ```bash
   pnpm build
   ```

## Development Workflow

### Making Changes

1. **Create a new branch** for your feature or bug fix

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** following the coding standards below

3. **Write or update tests** to cover your changes

4. **Run the test suite** to ensure everything passes

   ```bash
   pnpm test
   ```

5. **Run linting** to ensure code quality

   ```bash
   pnpm lint
   ```

6. **Build the project** to ensure it compiles
   ```bash
   pnpm build
   ```

### Code Quality Standards

This project follows strict code quality standards:

- **TypeScript** - All code must be properly typed
- **ESLint** - Code must pass ESLint checks
- **Prettier** - Code must be formatted with Prettier
- **Tests** - New features must include tests

#### Running Quality Checks

```bash
# Format code
pnpm format

# Check linting
pnpm lint

# Run all tests
pnpm test

# Build project
pnpm build
```

## Project Structure

```
├── src/                    # Source code
│   ├── index.ts           # Main entry point
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   └── utils/             # Utility functions
│       ├── index.ts       # General utilities
│       └── scraper.ts     # HTML scraping logic
├── tests/                 # Test files
│   ├── index.test.ts      # Main class tests
│   ├── integration.test.ts # Integration tests
│   └── utils/             # Utility tests
│       ├── index.test.ts
│       └── scraper.test.ts
├── docs/                  # Documentation
│   ├── api-reference.md
│   ├── debug-logging.md
│   └── examples.md
└── dist/                  # Built output (generated)
```

## Testing Guidelines

### Test Types

1. **Unit Tests** - Test individual functions and methods
2. **Integration Tests** - Test against the real Lodestone API
3. **Mock Tests** - Test with mocked HTTP responses

### Writing Tests

- Use **Vitest** for testing framework
- Follow **AAA pattern** (Arrange, Act, Assert)
- **Mock external dependencies** when appropriate
- **Test error conditions** as well as success paths

#### Example Test

```typescript
import { describe, it, expect } from "vitest";
import { normalizeWorldName } from "../../src/utils/index.js";

describe("normalizeWorldName", () => {
  it("should convert to lowercase and trim whitespace", () => {
    // Arrange
    const input = "  EXCALIBUR  ";

    // Act
    const result = normalizeWorldName(input);

    // Assert
    expect(result).toBe("excalibur");
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test tests/utils/scraper.test.ts

# Run with coverage
pnpm test --coverage
```

## Debugging

### Enable Debug Logging

The project uses the `debug` package for detailed logging:

```bash
# Enable all debug logging
DEBUG="lodestone-world-status*" pnpm test

# Enable only scraper logging
DEBUG="lodestone-world-status:scraper" node your-script.js
```

### Common Debug Commands

```bash
# Debug a specific test
DEBUG="lodestone-world-status*" pnpm test tests/integration.test.ts

# Debug the build process
DEBUG="*" pnpm build

# Debug with TypeScript compilation
DEBUG="*" pnpm run dev
```

## Contribution Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes** - Fix issues or improve reliability
- **Features** - Add new functionality
- **Documentation** - Improve docs, examples, or comments
- **Tests** - Add test coverage or improve existing tests
- **Performance** - Optimize parsing or caching logic

### Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details** (Node.js version, OS, etc.)
5. **Debug logs** if applicable

```bash
# Generate debug logs for bug reports
DEBUG="lodestone-world-status*" node your-script.js > debug.log 2>&1
```

### Feature Requests

For new features:

1. **Open an issue** first to discuss the feature
2. **Explain the use case** and why it's needed
3. **Consider the API design** and how it fits with existing functionality
4. **Be willing to implement** or help with implementation

### Pull Request Process

1. **Ensure your code follows** the project standards
2. **Add tests** for new functionality
3. **Update documentation** if needed
4. **Write clear commit messages**
5. **Keep PRs focused** - one feature/fix per PR

## API Considerations

### Adding New Methods

When adding new methods to `LodestoneWorldStatus`:

1. **Follow existing patterns** for naming and structure
2. **Add proper TypeScript types**
3. **Include JSDoc documentation**
4. **Add debug logging**
5. **Write comprehensive tests**

### Modifying Parsing Logic

The parsing logic is critical for reliability:

1. **Maintain backward compatibility** when possible
2. **Add fallback mechanisms** for robustness
3. **Test with real HTML** from Lodestone
4. **Add debug logging** to track parsing steps
5. **Consider edge cases** (empty responses, network errors)

### Breaking Changes

For breaking changes:

1. **Discuss in an issue first**
2. **Update major version** following semver
3. **Provide migration guide**
4. **Update all documentation**

## Documentation

### Updating Documentation

- **Keep docs in sync** with code changes
- **Add examples** for new features
- **Update API reference** for new methods
- **Test code examples** to ensure they work

### Documentation Files

- `README.md` - High-level overview and quick start
- `docs/api-reference.md` - Complete API documentation
- `docs/examples.md` - Usage examples and patterns
- `docs/debug-logging.md` - Debugging and troubleshooting
- `CONTRIBUTING.md` - This file

## Release Process

Releases are handled by maintainers:

1. **Version bump** following semver
2. **Update changelog** with new features/fixes
3. **Tag release** in Git
4. **Publish to npm** registry
5. **Update documentation** if needed

## Getting Help

- **Open an issue** for questions or problems
- **Check existing issues** for similar problems
- **Review documentation** in the `docs/` folder
- **Enable debug logging** for troubleshooting
