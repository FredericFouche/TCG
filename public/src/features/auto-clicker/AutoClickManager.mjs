import {EventEmitter} from '../../utils/EventEmitter.mjs';
import {NumberFormatter} from '../../utils/NumberFormatter.mjs';

export class AutoClickManager extends EventEmitter {
    static EVENTS = {
        GENERATOR_BOUGHT: 'generator:bought',
        GENERATOR_UPGRADED: 'generator:upgraded',
        GENERATOR_ADDED: 'generator:added',
        GENERATOR_LOADED: 'generator:loaded',
        PRODUCTION_UPDATED: 'generator:production-updated',
        TICK: 'generator:tick',
        OFFLINE_PROGRESS: 'generator:offline-progress'
    };


    #generators;
    #currencySystem;
    #tickInterval;
    #isRunning;
    #totalProduction;

    constructor(currencySystem) {
        super();

        if (!currencySystem) {
            throw new Error('CurrencySystem is required for AutoClickManager');
        }

        this.#currencySystem = currencySystem;
        this.#generators = new Map();
        this.#isRunning = false;
        this.#tickInterval = null;
        this.#totalProduction = 0;
    }

    // Getters
    get generators() {
        return Array.from(this.#generators.values());
    }

    get totalProductionPerSecond() {
        return this.#totalProduction;
    }

    get hasGenerators() {
        return this.#generators.size > 0;
    }

    addGenerator(id, baseProduction, baseCost, description = '') {
        if (this.#generators.has(id)) {
            return false;
        }

        const generator = {
            id,
            level: 0,
            baseProduction,
            baseCost,
            description,
            currentProduction: 0,
            lastPurchaseCost: baseCost
        };

        this.#generators.set(id, generator);
        this.emit(AutoClickManager.EVENTS.GENERATOR_ADDED, {generator});
        this.#updateTotalProduction();

        return true;
    }

    buyGenerator(id) {
        const generator = this.#generators.get(id);
        if (!generator) {
            console.error(`Generator ${id} not found`);
            return false;
        }

        const cost = this.#calculateUpgradeCost(generator);

        if (!this.#currencySystem.spend?.(cost)) {
            return false;
        }

        generator.level += 1;
        generator.lastPurchaseCost = cost;
        generator.currentProduction = this.#calculateProduction(generator);

        this.#updateTotalProduction();

        this.emit(AutoClickManager.EVENTS.GENERATOR_BOUGHT, {
            generator,
            cost
        });

        if (!this.#isRunning && this.#totalProduction > 0) {
            this.start();
        }

        if (window.achievementSystem) {
            window.achievementSystem.checkAchievement('first-generator', this.generators);
            window.achievementSystem.checkAchievement('generator-master', this.generators);
        }

        return true;
    }

    stop() {
        if (!this.#isRunning) return;

        this.#isRunning = false;
        clearInterval(this.#tickInterval);
        this.#tickInterval = null;
    }

    load(data) {
        if (!data?.generators) return false;

        this.stop();
        this.#generators.clear();

        data.generators.forEach(generator => {
            if (!generator.id || !generator.baseProduction || !generator.baseCost) {
                return;
            }

            this.#generators.set(generator.id, {
                ...generator,
                currentProduction: this.#calculateProduction(generator)
            });
        });

        this.#updateTotalProduction();

        if (this.#totalProduction > 0) {
            this.start();
        }

        return true;
    }

    #calculateUpgradeCost({ baseCost, level }) {
        return Math.floor(baseCost * Math.pow(1.15, level));
    }

    save() {
        return {
            generators: Array.from(this.#generators.values()).map(gen => ({
                id: gen.id,
                level: gen.level,
                baseProduction: gen.baseProduction,
                baseCost: gen.baseCost,
                currentProduction: gen.currentProduction,
                description: gen.description
            })),
            totalProduction: this.#totalProduction
        };
    }

    start(tickRate = 1000) {
        if (this.#isRunning) {
            this.stop();
        }

        console.log('Démarrage du tick avec production de', this.#totalProduction, '/sec');
        this.#isRunning = true;
        this.#tickInterval = setInterval(() => this.#tick(), tickRate);
    }

    #tick() {
        if (this.#totalProduction > 0) {
            this.#currencySystem.add(this.#totalProduction);
            this.emit(AutoClickManager.EVENTS.TICK, {
                production: this.#totalProduction,
                generators: this.generators,
                timestamp: Date.now()
            });
        } else {
            console.log('Tick sans production');
        }
    }

    #calculateProduction(generator) {
        return generator.baseProduction * generator.level;
    }

    #updateTotalProduction() {
        this.#totalProduction = this.generators.reduce(
            (total, gen) => total + gen.currentProduction,
            0
        );

        this.emit(AutoClickManager.EVENTS.PRODUCTION_UPDATED, {
            totalProduction: this.#totalProduction
        });
    }
}
