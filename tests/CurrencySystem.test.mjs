// tests/CurrencySystem.test.mjs

import { CurrencySystem } from '../core/currency/CurrencySystem.mjs';

class TestRunner {
    #tests = [];
    #beforeEach = null;
    #afterEach = null;

    constructor(testSuiteName) {
        this.testSuiteName = testSuiteName;
        this.successes = 0;
        this.failures = 0;
    }

    beforeEach(fn) {
        this.#beforeEach = fn;
    }

    afterEach(fn) {
        this.#afterEach = fn;
    }

    test(name, fn) {
        this.#tests.push({ name, fn });
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected} but got ${actual}`);
                }
                return true;
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
                return true;
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
                return true;
            },
            toBeTrue: () => {
                if (actual !== true) {
                    throw new Error(`Expected true but got ${actual}`);
                }
                return true;
            },
            toBeFalse: () => {
                if (actual !== false) {
                    throw new Error(`Expected false but got ${actual}`);
                }
                return true;
            }
        };
    }

    async run() {
        console.log(`\n🧪 Running test suite: ${this.testSuiteName}`);
        console.log('=======================================');

        for (const { name, fn } of this.#tests) {
            try {
                // Setup
                if (this.#beforeEach) await this.#beforeEach();

                // Run test
                await fn();

                // Cleanup
                if (this.#afterEach) await this.#afterEach();

                console.log(`✅ ${name}`);
                this.successes++;
            } catch (error) {
                console.log(`❌ ${name}`);
                console.log(`   Error: ${error.message}`);
                this.failures++;
            }
        }

        console.log('\n=======================================');
        console.log(`Results: ${this.successes} passed, ${this.failures} failed`);
        console.log('=======================================\n');
    }
}

// Tests pour CurrencySystem
const runner = new TestRunner('CurrencySystem Tests');

// Setup
runner.beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
});

// Tests
runner.test('should initialize with default values', () => {
    const system = new CurrencySystem();
    runner.expect(system.currency).toBe(0);
    runner.expect(system.baseClickValue).toBe(1);
    runner.expect(system.multiplier).toBe(1);
});

runner.test('should add currency correctly', () => {
    const system = new CurrencySystem();
    const success = system.addCurrency(100);
    runner.expect(success).toBeTrue();
    runner.expect(system.currency).toBe(100);
});

runner.test('should not add negative currency', () => {
    const system = new CurrencySystem(100);
    const success = system.addCurrency(-50);
    runner.expect(success).toBeFalse();
    runner.expect(system.currency).toBe(100);
});

runner.test('should remove currency correctly', () => {
    const system = new CurrencySystem(100);
    const success = system.removeCurrency(50);
    runner.expect(success).toBeTrue();
    runner.expect(system.currency).toBe(50);
});

runner.test('should not remove more currency than available', () => {
    const system = new CurrencySystem(100);
    const success = system.removeCurrency(150);
    runner.expect(success).toBeFalse();
    runner.expect(system.currency).toBe(100);
});

runner.test('should handle click with multiplier', () => {
    const system = new CurrencySystem(0, 10); // baseClickValue = 10
    system.addMultiplier(1); // multiplier = 2
    system.handleClick();
    runner.expect(system.currency).toBe(20); // 10 * 2
});

runner.test('should format currency correctly', () => {
    const system = new CurrencySystem(1234567);
    runner.expect(system.formattedCurrency).toBe('1.2M ¤');
});

runner.test('should emit events on currency update', () => {
    const system = new CurrencySystem();
    let eventFired = false;
    let eventData = null;

    system.on(CurrencySystem.EVENTS.CURRENCY_UPDATED, (data) => {
        eventFired = true;
        eventData = data;
    });

    system.addCurrency(100);

    runner.expect(eventFired).toBeTrue();
    runner.expect(eventData.newValue).toBe(100);
    runner.expect(eventData.gained).toBe(100);
});

runner.test('should save and load correctly', () => {
    const system = new CurrencySystem(1000);
    system.addMultiplier(2);

    // Save
    const saveSuccess = system.save();
    runner.expect(saveSuccess).toBeTrue();

    // Create new instance and load
    const newSystem = new CurrencySystem();
    const loadSuccess = newSystem.load();

    runner.expect(loadSuccess).toBeTrue();
    runner.expect(newSystem.currency).toBe(1000);
    runner.expect(newSystem.multiplier).toBe(3); // 1 (base) + 2 (added)
});

// Run all tests
runner.run().then(() => {
    console.log('Testing completed!');
});