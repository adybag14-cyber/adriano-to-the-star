# Planet Features Test Suite

This directory contains tests for all planet features in the Adriano To The Star platform.

## Test Files

### Integration Tests
- `planet-features-integration.test.js` - Tests integration of all planet features with the main application

### Unit Tests
- `planet-trading-marketplace.test.js` - Unit tests for the planet trading marketplace

## Running Tests

### Using Jest

```bash
npm install --save-dev jest
npm test
```

### Using Node.js

```bash
node tests/planet-features-integration.test.js
node tests/planet-trading-marketplace.test.js
```

## Test Coverage

### Integration Tests
- ✅ Marketplace features initialization
- ✅ Dashboard features initialization
- ✅ Database features initialization
- ✅ Feature integration together
- ✅ Error handling
- ✅ Missing container handling

### Unit Tests
- ✅ Marketplace initialization
- ✅ Creating listings
- ✅ Buying planets
- ✅ Getting listings
- ✅ Error handling
- ✅ Data validation

## Mocking

Tests use mocks for:
- Supabase client
- DOM elements
- Browser APIs
- Local storage

## Adding New Tests

1. Create a new test file in the `tests/` directory
2. Follow the existing test structure
3. Use descriptive test names
4. Include both positive and negative test cases
5. Test error handling

## Example Test

```javascript
describe('Feature Name', () => {
    test('does something', () => {
        const result = feature.doSomething();
        expect(result).toBe(expected);
    });
});
```

