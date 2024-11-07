import { EventEmitter } from '../../utils/EventEmitter.mjs';

export class AutoClickManager extends EventEmitter {
    static EVENTS = {
        GENERATOR_BOUGHT: 'generator:bought',
        GENERATOR_UPGRADED: 'generator:upgraded',
        TICK: 'generator:tick'
    };

    #generators;
    #currencySystem;
    #tickInterval;
    #isRunning;

    constructor(currencySystem) {
        super();

        if (!currencySystem) {
            throw new Error('CurrencySystem is required for AutoClickManager');
        }

        this.#currencySystem = currencySystem;
        this.#generators = new Map();
        this.#isRunning = false;
        this.#tickInterval = null;

        // Structure d'un générateur:
        // {
        //     id: string,
        //     level: number,
        //     baseProduction: number,
        //     baseCost: number,
        //     currentProduction: number,
        //     lastPurchaseCost: number
        // }
    }

    // Getters
    get generators() {
        return Array.from(this.#generators.values());
    }

    get totalProductionPerSecond() {
        return this.generators.reduce((total, gen) => total + gen.currentProduction, 0);
    }

    // Méthodes de gestion des générateurs
    addGenerator(id, baseProduction, baseCost) {
        if (this.#generators.has(id)) {
            return false;
        }

        const generator = {
            id,
            level: 0,
            baseProduction,
            baseCost,
            currentProduction: 0,
            lastPurchaseCost: baseCost
        };

        this.#generators.set(id, generator);
        return true;
    }

    buyGenerator(id) {
        const generator = this.#generators.get(id);
        if (!generator) return false;

        const cost = this.#calculateUpgradeCost(generator);

        if (!this.#currencySystem.removeCurrency(cost)) {
            return false;
        }

        generator.level += 1;
        generator.lastPurchaseCost = cost;
        generator.currentProduction = this.#calculateProduction(generator);

        this.emit(AutoClickManager.EVENTS.GENERATOR_BOUGHT, {
            id,
            level: generator.level,
            cost,
            production: generator.currentProduction
        });

        if (!this.#isRunning) {
            this.start();
        }

        return true;
    }

    // Méthodes de tick et production
    start(tickRate = 1000) {
        if (this.#isRunning) return;

        this.#isRunning = true;
        this.#tickInterval = setInterval(() => this.#tick(), tickRate);
    }

    stop() {
        if (!this.#isRunning) return;

        this.#isRunning = false;
        clearInterval(this.#tickInterval);
        this.#tickInterval = null;
    }

    // Méthodes de sauvegarde
    save() {
        const saveData = {
            generators: Array.from(this.#generators.entries())
        };

        try {
            localStorage.setItem('autoClickManager', JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save AutoClickManager:', error);
            return false;
        }
    }

    load() {
        try {
            const savedData = localStorage.getItem('autoClickManager');
            if (!savedData) return false;

            const data = JSON.parse(savedData);
            this.#generators = new Map(data.generators);

            // Redémarrer la production si des générateurs sont actifs
            if (this.totalProductionPerSecond > 0) {
                this.start();
            }

            return true;
        } catch (error) {
            console.error('Failed to load AutoClickManager:', error);
            return false;
        }
    }

    // Méthodes privées
    #tick() {
        const totalProduction = this.totalProductionPerSecond;

        if (totalProduction > 0) {
            this.#currencySystem.addCurrency(totalProduction);

            this.emit(AutoClickManager.EVENTS.TICK, {
                production: totalProduction,
                generators: this.generators
            });
        }
    }

    #calculateUpgradeCost(generator) {
        // Formule: baseCost * (1.15 ^ level)
        return Math.floor(generator.baseCost * Math.pow(1.15, generator.level));
    }

    #calculateProduction(generator) {
        // Formule: baseProduction * level
        return generator.baseProduction * generator.level;
    }
}