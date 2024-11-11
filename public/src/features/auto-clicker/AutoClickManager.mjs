import {EventEmitter} from '../../utils/EventEmitter.mjs';
import {NumberFormatter} from "../../utils/NumberFormatter.mjs";
import {NotificationSystem} from "../../utils/NotificationSystem.mjs";

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
    get hasGenerators() {
        const count = this.#generators.size;
        return count > 0;
    }

    get generators() {
        return Array.from(this.#generators.values());
    }

    get totalProductionPerSecond() {
        return this.#totalProduction;
    }

    addGenerator(id, baseProduction, baseCost, description = '') {
        if (this.#generators.has(id)) {
            console.warn(`⚠️ Le générateur ${id} existe déjà`);
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
        const notificationSystem = NotificationSystem.getInstance();

        if (!this.#currencySystem.canSpend?.(cost)) {
            notificationSystem.showError(
                `Pas assez de ressources ! (Coût: ${NumberFormatter.format(cost)})`
            );
            return false;
        }

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

        notificationSystem.showSuccess(
            `Générateur ${generator.id} amélioré au niveau ${generator.level} !`
        );

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

        if (!data?.generators?.length) {
            console.log('❌ Pas de générateurs à charger');
            return false;
        }

        this.stop();

        data.generators.forEach(generator => {
            const existingGenerator = this.#generators.get(generator.id);
            if (existingGenerator) {
                existingGenerator.level = generator.level;
                existingGenerator.currentProduction = generator.baseProduction * generator.level;
                existingGenerator.lastPurchaseCost = generator.lastPurchaseCost;
            }
        });

        this.#updateTotalProduction();

        if (this.#totalProduction > 0) {
            this.start();
        }

        this.emit(AutoClickManager.EVENTS.GENERATOR_LOADED, {
            generators: this.generators
        });

        return true;
    }

    #calculateUpgradeCost({baseCost, level}) {
        return Math.floor(baseCost * Math.pow(1.15, level));
    }

    save() {
        return {
            generators: Array.from(this.#generators.values()).map(gen => ({
                id: gen.id,
                level: gen.level,
                baseProduction: gen.baseProduction,
                baseCost: gen.baseCost,
                description: gen.description,
                lastPurchaseCost: gen.lastPurchaseCost
            })),
            lastUpdate: Date.now(),
            totalProduction: this.#totalProduction
        };
    }

    start(tickRate = 1000) {
        if (this.#isRunning) {
            this.stop();
        }

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
