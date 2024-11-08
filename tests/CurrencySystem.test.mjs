// tests/index.test.mjs

import {CurrencySystem} from '../public/src/core/currency/CurrencySystem.mjs';
import {AutoClickManager} from '../public/src/features/auto-clicker/AutoClickManager.mjs';
import {AutoClickDisplay} from '../public/src/components/ui/AutoClickDisplay.mjs';

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
        this.#tests.push({name, fn});
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
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected value to be truthy but got ${actual}`);
                }
                return true;
            }
        };
    }

    async run() {
        console.log(`\n🧪 Running test suite: ${this.testSuiteName}`);
        console.log('=======================================');

        for (const {name, fn} of this.#tests) {
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
const currencyRunner = new TestRunner('CurrencySystem Tests');
currencyRunner.beforeEach(() => localStorage.clear());

currencyRunner.test('should initialize with default values', () => {
    const system = new CurrencySystem();
    currencyRunner.expect(system.currency).toBe(0);
    currencyRunner.expect(system.baseClickValue).toBe(1);
    currencyRunner.expect(system.multiplier).toBe(1);
});

currencyRunner.test('should add currency correctly', () => {
    const system = new CurrencySystem();
    const success = system.addCurrency(100);
    currencyRunner.expect(success).toBeTrue();
    currencyRunner.expect(system.currency).toBe(100);
});

currencyRunner.test('should not add negative currency', () => {
    const system = new CurrencySystem(100);
    const success = system.addCurrency(-50);
    currencyRunner.expect(success).toBeFalse();
    currencyRunner.expect(system.currency).toBe(100);
});

currencyRunner.test('should remove currency correctly', () => {
    const system = new CurrencySystem(100);
    const success = system.removeCurrency(50);
    currencyRunner.expect(success).toBeTrue();
    currencyRunner.expect(system.currency).toBe(50);
});

currencyRunner.test('should not remove more currency than available', () => {
    const system = new CurrencySystem(100);
    const success = system.removeCurrency(150);
    currencyRunner.expect(success).toBeFalse();
    currencyRunner.expect(system.currency).toBe(100);
});

currencyRunner.test('should handle click with multiplier', () => {
    const system = new CurrencySystem(0, 10); // baseClickValue = 10
    system.addMultiplier(1); // multiplier = 2
    system.handleClick();
    currencyRunner.expect(system.currency).toBe(20); // 10 * 2
});

currencyRunner.test('should format currency correctly', () => {
    const system = new CurrencySystem(1234567);
    currencyRunner.expect(system.formattedCurrency).toBe('1.2M ¤');
});

currencyRunner.test('should emit events on currency update', () => {
    const system = new CurrencySystem();
    let eventFired = false;
    let eventData = null;

    system.on(CurrencySystem.EVENTS.CURRENCY_UPDATED, (data) => {
        eventFired = true;
        eventData = data;
    });

    system.addCurrency(100);

    currencyRunner.expect(eventFired).toBeTrue();
    currencyRunner.expect(eventData.newValue).toBe(100);
    currencyRunner.expect(eventData.gained).toBe(100);
});

currencyRunner.test('should save and load correctly', () => {
    const system = new CurrencySystem(1000);
    system.addMultiplier(2);

    // Save
    const saveSuccess = system.save();
    currencyRunner.expect(saveSuccess).toBeTrue();

    // Create new instance and load
    const newSystem = new CurrencySystem();
    const loadSuccess = newSystem.load();

    currencyRunner.expect(loadSuccess).toBeTrue();
    currencyRunner.expect(newSystem.currency).toBe(1000);
    currencyRunner.expect(newSystem.multiplier).toBe(3); // 1 (base) + 2 (added)
});

// Tests pour AutoClickManager
const autoClickRunner = new TestRunner('AutoClickManager Tests');
autoClickRunner.beforeEach(() => localStorage.clear());

autoClickRunner.test('should initialize correctly', () => {
    const currency = new CurrencySystem(1000);
    const manager = new AutoClickManager(currency);

    autoClickRunner.expect(manager.totalProductionPerSecond).toBe(0);
    autoClickRunner.expect(manager.generators.length).toBe(0);
});

autoClickRunner.test('should add generator correctly', () => {
    const currency = new CurrencySystem(1000);
    const manager = new AutoClickManager(currency);

    const success = manager.addGenerator('gen1', 10, 100);
    autoClickRunner.expect(success).toBeTrue();
    autoClickRunner.expect(manager.generators.length).toBe(1);
});

autoClickRunner.test('should not add duplicate generator', () => {
    const currency = new CurrencySystem(1000);
    const manager = new AutoClickManager(currency);

    manager.addGenerator('gen1', 10, 100);
    const success = manager.addGenerator('gen1', 10, 100);
    autoClickRunner.expect(success).toBeFalse();
});

autoClickRunner.test('should buy generator successfully', () => {
    const currency = new CurrencySystem(1000);
    const manager = new AutoClickManager(currency);

    manager.addGenerator('gen1', 10, 100);
    const success = manager.buyGenerator('gen1');

    autoClickRunner.expect(success).toBeTrue();
    autoClickRunner.expect(currency.currency).toBe(900); // 1000 - 100
    autoClickRunner.expect(manager.totalProductionPerSecond).toBe(10);
});

autoClickRunner.test('should not buy generator without enough currency', () => {
    const currency = new CurrencySystem(50);
    const manager = new AutoClickManager(currency);

    manager.addGenerator('gen1', 10, 100);
    const success = manager.buyGenerator('gen1');

    autoClickRunner.expect(success).toBeFalse();
    autoClickRunner.expect(currency.currency).toBe(50);
});

autoClickRunner.test('should calculate increasing costs', () => {
    const currency = new CurrencySystem(1000);
    const manager = new AutoClickManager(currency);

    manager.addGenerator('gen1', 10, 100);
    manager.buyGenerator('gen1');
    const initialBalance = currency.currency;
    manager.buyGenerator('gen1');

    // Coût second achat = 100 * (1.15 ^ 1) = 115
    const expectedCost = Math.floor(100 * Math.pow(1.15, 1));
    autoClickRunner.expect(currency.currency).toBe(initialBalance - expectedCost);
});

autoClickRunner.test('should produce currency over time', async () => {
    const currency = new CurrencySystem(1000);
    const manager = new AutoClickManager(currency);

    manager.addGenerator('gen1', 10, 100);
    manager.buyGenerator('gen1');

    const initialBalance = currency.currency;

    // Attendre 1.1 secondes (un peu plus qu'un tick)
    await new Promise(resolve => setTimeout(resolve, 1100));

    autoClickRunner.expect(currency.currency).toBeGreaterThan(initialBalance);
});

autoClickRunner.test('should save and load correctly', () => {
    const currency = new CurrencySystem(1000);
    const manager = new AutoClickManager(currency);

    manager.addGenerator('gen1', 10, 100);
    manager.buyGenerator('gen1');

    manager.save();

    const newCurrency = new CurrencySystem(1000);
    const newManager = new AutoClickManager(newCurrency);
    newManager.load();

    autoClickRunner.expect(newManager.totalProductionPerSecond).toBe(10);
    autoClickRunner.expect(newManager.generators.length).toBe(1);
});

// Tests pour AutoClickDisplay
const displayRunner = new TestRunner('AutoClickDisplay Tests');

displayRunner.beforeEach(() => {
    // Setup du DOM pour les tests
    document.body.innerHTML = '<div id="mainContent"></div>';
    localStorage.clear();
});

displayRunner.test('should initialize display correctly', () => {
    const currency = new CurrencySystem(1000);
    window.autoClickManager = new AutoClickManager(currency); // Simuler le contexte global

    const display = new AutoClickDisplay();
    display.init();

    const container = document.getElementById('mainContent');
    displayRunner.expect(container.querySelector('.autoclicker-container')).toBeTruthy();
    displayRunner.expect(container.querySelector('.production-total')).toBeTruthy();
});

displayRunner.test('should display generators correctly', () => {
    const currency = new CurrencySystem(1000);
    const manager = new AutoClickManager(currency);
    window.autoClickManager = manager;

    // Ajouter quelques générateurs
    manager.addGenerator('gen1', 10, 100);
    manager.addGenerator('gen2', 20, 200);

    const display = new AutoClickDisplay();
    display.init();

    const container = document.getElementById('mainContent');
    const generators = container.querySelectorAll('.generator-card');
    displayRunner.expect(generators.length).toBe(2);
});

displayRunner.test('should update UI when generator is bought', () => {
    const currency = new CurrencySystem(1000);
    const manager = new AutoClickManager(currency);
    window.autoClickManager = manager;

    manager.addGenerator('gen1', 10, 100);

    const display = new AutoClickDisplay();
    display.init();

    // Simuler un clic sur le bouton d'achat
    const buyButton = document.querySelector('.buy-generator-btn');
    buyButton.click();

    const productionElement = document.querySelector('.production-total');
    displayRunner.expect(productionElement.textContent.includes('10')).toBeTrue();
});

displayRunner.test('should update production display on tick', async () => {
    const currency = new CurrencySystem(1000);
    const manager = new AutoClickManager(currency);
    window.autoClickManager = manager;

    manager.addGenerator('gen1', 10, 100);
    manager.buyGenerator('gen1');

    const display = new AutoClickDisplay();
    display.init();

    // Attendre un tick
    await new Promise(resolve => setTimeout(resolve, 1100));

    const productionElement = document.querySelector('.production-total');
    displayRunner.expect(productionElement.textContent.includes('10')).toBeTrue();
});

// Exécution chaînée des suites de tests
currencyRunner.run()
    .then(() => autoClickRunner.run())
    .then(() => displayRunner.run())
    .then(() => {
        console.log('All test suites completed! 🎉');
    });