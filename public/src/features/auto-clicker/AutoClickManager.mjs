import { EventEmitter } from '../../utils/EventEmitter.mjs';
import { NumberFormatter } from '../../utils/NumberFormatter.mjs';

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
        this.emit(AutoClickManager.EVENTS.GENERATOR_ADDED, { generator });
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
        console.log('🔄 Début du chargement des données:', data);
        if (!data) {
            console.log('❌ Pas de données à charger');
            return false;
        }

        try {
            console.log('🛑 Arrêt de la production existante');
            this.stop();
            this.#generators.clear();

            if (data.generators) {
                console.log('⚙️ Chargement des générateurs:', data.generators);
                data.generators.forEach(generator => {
                    const currentProduction = generator.baseProduction * generator.level;
                    console.log(`📊 Calcul production pour ${generator.id}:`, {
                        base: generator.baseProduction,
                        niveau: generator.level,
                        production: currentProduction
                    });
                    this.#generators.set(generator.id, {
                        ...generator,
                        currentProduction,
                        description: generator.description || ''
                    });
                });
            }

            this.#totalProduction = this.generators.reduce(
                (total, gen) => total + gen.currentProduction,
                0
            );
            console.log('💰 Production totale calculée:', this.#totalProduction);

            if (data.lastUpdate) {
                console.log('⏰ Traitement du temps offline depuis:', new Date(data.lastUpdate));
                this.#processOfflineProgress(data.lastUpdate);
            } else {
                console.log('⚠️ Pas de lastUpdate dans les données');
            }

            this.#lastUpdate = Date.now();
            console.log('📅 Nouveau lastUpdate:', new Date(this.#lastUpdate));

            this.emit(AutoClickManager.EVENTS.PRODUCTION_UPDATED, {
                totalProduction: this.#totalProduction
            });

            if (this.#totalProduction > 0) {
                console.log('▶️ Démarrage de la production:', this.#totalProduction, '/sec');
                this.start();
            } else {
                console.log('⏸️ Pas de production, pas de démarrage');
            }

            console.log('✅ Chargement terminé avec succès');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
            return false;
        }
    }

    save() {
        console.log('💾 Début de la sauvegarde');
        const saveData = {
            generators: this.generators.map(generator => {
                console.log(`📊 Sauvegarde générateur ${generator.id}:`, generator);
                return {
                    id: generator.id,
                    level: generator.level,
                    baseProduction: generator.baseProduction,
                    baseCost: generator.baseCost,
                    currentProduction: generator.currentProduction,
                    description: generator.description
                };
            }),
            totalProduction: this.#totalProduction,
            lastUpdate: Date.now()
        };

        console.log('📦 Données de sauvegarde complètes:', saveData);
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

    #calculateUpgradeCost(generator) {
        return Math.floor(generator.baseCost * Math.pow(1.15, generator.level));
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

    static MAX_OFFLINE_TIME = 24 * 60 * 60; // Maximum 24 heures d'offline en secondes

    #processOfflineProgress(lastUpdate) {
        console.log('🕒 Début du calcul de la production offline');

        if (!lastUpdate) {
            console.log('❌ Pas de lastUpdate, arrêt du calcul');
            return;
        }

        const now = Date.now();
        console.log('⏱️ Timestamps:', {
            lastUpdate,
            now,
            difference: now - lastUpdate
        });

        let offlineTime = Math.floor((now - lastUpdate) / 1000);
        console.log('⌛ Temps offline initial:', offlineTime, 'secondes');

        // Limitation du temps offline
        const previousOfflineTime = offlineTime;
        offlineTime = Math.min(offlineTime, AutoClickManager.MAX_OFFLINE_TIME);
        if (previousOfflineTime !== offlineTime) {
            console.log('⚠️ Temps offline limité:', {
                avant: previousOfflineTime,
                après: offlineTime,
                maxPermis: AutoClickManager.MAX_OFFLINE_TIME
            });
        }

        console.log('💰 Production actuelle:', this.#totalProduction, '/sec');

        if (offlineTime > 0 && this.#totalProduction > 0) {
            const offlineProduction = offlineTime * this.#totalProduction;
            console.log('📊 Calcul production:', {
                tempsOffline: offlineTime,
                productionParSec: this.#totalProduction,
                productionTotale: offlineProduction
            });

            if (offlineProduction > 0) {
                console.log('💵 Ajout des gains:', offlineProduction);
                this.#currencySystem.add(offlineProduction);

                this.emit(AutoClickManager.EVENTS.OFFLINE_PROGRESS, {
                    time: offlineTime,
                    production: offlineProduction,
                    productionPerSecond: this.#totalProduction
                });

                if (window.notificationSystem) {
                    const hours = Math.floor(offlineTime / 3600);
                    const minutes = Math.floor((offlineTime % 3600) / 60);
                    console.log('🕐 Formatage du temps:', {
                        heures: hours,
                        minutes: minutes,
                        secondesInitiales: offlineTime
                    });

                    let timeText = '';
                    if (hours > 0) {
                        timeText += `${hours}h `;
                    }
                    if (minutes > 0 || hours === 0) {
                        timeText += `${minutes}min`;
                    }

                    console.log('📝 Texte temps formaté:', timeText);

                    const notifText = `Gains hors-ligne :\n` +
                        `+${NumberFormatter.format(offlineProduction)} ¤\n` +
                        `(${timeText} à ${NumberFormatter.format(this.#totalProduction)}/sec)`;

                    console.log('🔔 Texte notification:', notifText);
                    window.notificationSystem.showSuccess(notifText);
                } else {
                    console.warn('⚠️ Système de notification non disponible');
                }
            } else {
                console.log('⚠️ Production offline nulle, pas de gains à ajouter');
            }
        } else {
            console.log('ℹ️ Pas de production offline:', {
                tempsOffline: offlineTime,
                production: this.#totalProduction
            });
        }

        console.log('✅ Fin du calcul de la production offline');
    }
}