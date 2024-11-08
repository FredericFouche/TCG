import { EventEmitter } from '../../utils/EventEmitter.mjs';

export class AutoClickManager extends EventEmitter {
    static EVENTS = {
        GENERATOR_BOUGHT: 'generator:bought',
        GENERATOR_UPGRADED: 'generator:upgraded',
        GENERATOR_ADDED: 'generator:added',
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

        this.emit(AutoClickManager.EVENTS.GENERATOR_ADDED, { generator });

        return true;
    }

    buyGenerator(id) {
        const generator = this.#generators.get(id);
        if (!generator) {
            console.error(`Generator ${id} not found`);
            return false;
        }

        const cost = this.#calculateUpgradeCost(generator);

        // Vérifier si le joueur peut dépenser
        if (!this.#currencySystem.canSpend?.(cost)) {
            if (!this.#currencySystem.removeCurrency?.(cost)) {
                return false;
            }
        } else {
            if (!this.#currencySystem.spend?.(cost)) {
                return false;
            }
        }

        // Mettre à jour le générateur
        generator.level += 1;
        generator.lastPurchaseCost = cost;
        generator.currentProduction = this.#calculateProduction(generator);

        // Émettre l'événement d'achat
        this.emit(AutoClickManager.EVENTS.GENERATOR_BOUGHT, {
            id,
            level: generator.level,
            cost,
            production: generator.currentProduction,
            generator
        });

        if (!this.#isRunning) {
            this.start();
        }

        if (window.achievementSystem) {
            // Utiliser this.generators au lieu de this.getAllGenerators()
            window.achievementSystem.checkAchievement('first-generator', this.generators);
            window.achievementSystem.checkAchievement('generator-master', this.generators);
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
            generators: Array.from(this.#generators.entries()),
            isRunning: this.#isRunning
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

            // Redémarrer la production si nécessaire
            if (data.isRunning || this.totalProductionPerSecond > 0) {
                this.start();
            }

            // Émettre un événement pour chaque générateur chargé
            this.generators.forEach(generator => {
                this.emit(AutoClickManager.EVENTS.GENERATOR_ADDED, { generator });
            });

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
            // Support des deux méthodes possibles d'ajout de monnaie
            if (this.#currencySystem.addCurrency) {
                this.#currencySystem.addCurrency(totalProduction);
            } else if (this.#currencySystem.add) {
                this.#currencySystem.add(totalProduction);
            }

            // Émettre l'événement de tick avec toutes les informations nécessaires
            this.emit(AutoClickManager.EVENTS.TICK, {
                production: totalProduction,
                generators: this.generators,
                timestamp: Date.now()
            });
        }
    }

    #calculateUpgradeCost(generator) {
        return Math.floor(generator.baseCost * Math.pow(1.15, generator.level));
    }

    #calculateProduction(generator) {
        return generator.baseProduction * generator.level;
    }
}