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


    static MAX_OFFLINE_TIME = 86400;
    static MIN_SAVE_INTERVAL = 30000;

    #generators;
    #currencySystem;
    #tickInterval;
    #isRunning;
    #totalProduction;
    #lastSaveTimestamp = 0;
    #lastUpdate;

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
        this.#lastUpdate = Date.now();
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
        console.group('🔄 Chargement AutoClickManager');
        console.log('Données reçues:', data);

        if (!data) {
            console.warn('❌ Pas de données à charger');
            console.groupEnd();
            return false;
        }

        try {
            // Arrêt de la production existante
            console.log('🛑 Arrêt de la production existante');
            this.stop();
            this.#generators.clear();

            // Chargement des générateurs
            if (data.generators && Array.isArray(data.generators)) {
                console.log('⚙️ Chargement des générateurs:', data.generators);

                data.generators.forEach(generator => {
                    // Vérification des données requises
                    if (!generator.id || typeof generator.level !== 'number' ||
                        !generator.baseProduction || !generator.baseCost) {
                        console.warn('⚠️ Données de générateur invalides:', generator);
                        return;
                    }

                    // Création du générateur avec toutes ses propriétés
                    const newGenerator = {
                        id: generator.id,
                        level: generator.level || 0,
                        baseProduction: generator.baseProduction,
                        baseCost: generator.baseCost,
                        currentProduction: generator.baseProduction * generator.level,
                        description: generator.description || '',
                        lastPurchaseCost: this.#calculateUpgradeCost({
                            baseCost: generator.baseCost,
                            level: Math.max(0, generator.level - 1)
                        })
                    };

                    console.log(`📊 Configuration du générateur ${generator.id}:`, {
                        niveau: newGenerator.level,
                        production: newGenerator.currentProduction,
                        derniercout: newGenerator.lastPurchaseCost
                    });

                    this.#generators.set(generator.id, newGenerator);
                });

                // Recalcul de la production totale
                this.#totalProduction = Array.from(this.#generators.values())
                    .reduce((total, gen) => total + gen.currentProduction, 0);

                console.log('💰 Production totale calculée:', this.#totalProduction);
            } else {
                console.warn('⚠️ Pas de générateurs dans les données');
            }

            // Gestion du lastUpdate
            if (data.lastUpdate) {
                console.log('⏰ Traitement du temps offline depuis:', new Date(data.lastUpdate));
                this.#processOfflineProgress(data.lastUpdate);
            }

            // Mise à jour du lastUpdate
            this.#lastUpdate = Date.now();
            console.log('📅 Nouveau lastUpdate:', new Date(this.#lastUpdate));

            // Notification de la mise à jour de production
            this.emit(AutoClickManager.EVENTS.PRODUCTION_UPDATED, {
                totalProduction: this.#totalProduction
            });

            // Démarrage si production > 0
            if (this.#totalProduction > 0) {
                console.log('▶️ Démarrage de la production:', this.#totalProduction, '/sec');
                this.start();
            } else {
                console.log('⏸️ Pas de production active');
            }

            console.groupEnd();
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
            console.groupEnd();
            return false;
        }
    }

    #calculateUpgradeCost({ baseCost, level }) {
        return Math.floor(baseCost * Math.pow(1.15, level));
    }

    save() {
        const now = Date.now();

        if (now - this.#lastSaveTimestamp < AutoClickManager.MIN_SAVE_INTERVAL) {
            console.log('⏳ Sauvegarde ignorée (trop rapprochée)');
            return null;
        }

        const saveData = {
            generators: Array.from(this.#generators.values()).map(gen => ({
                id: gen.id,
                level: gen.level,
                baseProduction: gen.baseProduction,
                baseCost: gen.baseCost,
                currentProduction: gen.currentProduction,
                description: gen.description
            })),
            totalProduction: this.#totalProduction,
            lastUpdate: this.#lastUpdate
        };

        this.#lastSaveTimestamp = now;
        return saveData;
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

    #processOfflineProgress(lastUpdate) {
        console.group('🕒 Traitement de la production offline');

        if (!lastUpdate) {
            console.warn('❌ Pas de lastUpdate, arrêt du calcul');
            console.groupEnd();
            return;
        }

        const now = Date.now();
        const lastUpdateDate = new Date(lastUpdate);

        if (lastUpdate > now) {
            console.warn('⚠️ lastUpdate dans le futur, utilisation du now');
            lastUpdate = now;
        }

        console.log('⏱️ Timestamps:', {
            lastUpdate: lastUpdateDate,
            now: new Date(now),
            difference: now - lastUpdate
        });

        let offlineTime = Math.floor((now - lastUpdate) / 1000);

        if (offlineTime < 0) {
            console.warn('⚠️ Temps offline négatif, correction à 0');
            offlineTime = 0;
        }

        console.log('⌛ Temps offline initial:', offlineTime, 'secondes');

        const previousOfflineTime = offlineTime;
        offlineTime = Math.min(offlineTime, AutoClickManager.MAX_OFFLINE_TIME);

        if (previousOfflineTime !== offlineTime) {
            console.log('⚠️ Temps offline limité:', {
                avant: previousOfflineTime,
                après: offlineTime,
                maxPermis: AutoClickManager.MAX_OFFLINE_TIME
            });
        }

        if (offlineTime > 0 && this.#totalProduction > 0) {
            const offlineProduction = Math.floor(offlineTime * this.#totalProduction);

            console.log('📊 Production finale calculée:', {
                tempsOffline: offlineTime,
                productionParSec: this.#totalProduction,
                productionTotale: offlineProduction
            });

            if (offlineProduction > 0) {
                const addSuccess = this.#currencySystem.add(offlineProduction);
                console.log('💰 Ajout de la production:', {
                    montant: offlineProduction,
                    succès: addSuccess ? '✅' : '❌'
                });

                if (addSuccess) {
                    this.#emitOfflineProgress(offlineTime, offlineProduction);
                }
            }
        } else {
            console.log('ℹ️ Pas de production offline à calculer');
        }

        this.#lastUpdate = now;

        console.groupEnd();
    }

    #emitOfflineProgress(time, production) {
        this.emit(AutoClickManager.EVENTS.OFFLINE_PROGRESS, {
            time,
            production,
            productionPerSecond: this.#totalProduction
        });

        const timeText = this.#formatOfflineTime(time);
        const notifText = `Gains hors-ligne :\n` +
            `+${this.#formatNumber(production)} ¤\n` +
            `(${timeText} à ${this.#formatNumber(this.#totalProduction)}/sec)`;

        if (window.notificationSystem) {
            window.notificationSystem.showSuccess(notifText);
        }
    }

    #formatOfflineTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        let timeText = '';
        if (hours > 0) {
            timeText += `${hours}h `;
        }
        if (minutes > 0 || hours === 0) {
            timeText += `${minutes}min`;
        }
        return timeText;
    }

    #formatNumber(number) {
        if (number < 1000) return number.toString();
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const magnitude = Math.floor(Math.log10(number) / 3);
        const scaled = number / Math.pow(1000, magnitude);
        return `${scaled.toFixed(1)}${suffixes[magnitude]}`;
    }

}
