import { EventEmitter } from './EventEmitter.mjs';
import {NumberFormatter} from "./NumberFormatter.mjs";

export class SaveManager extends EventEmitter {
    static EVENTS = {
        SAVE_COMPLETED: 'save-completed',
        LOAD_COMPLETED: 'load-completed',
        SAVE_ERROR: 'save-error',
        LOAD_ERROR: 'load-error'
    };

    static SAVE_KEYS = {
        CURRENCY: 'currencySystem',
        GENERATORS: 'generators',
        ACHIEVEMENTS: 'achievements',
        HAS_VISITED: 'hasVisitedBefore',
        BOOSTERS: 'boosters',
        COLLECTION: 'collection',
        CARDS: 'cardCollection'
    };

    static OFFLINE_CONFIG = {
        MAX_OFFLINE_TIME: 86400,
        MIN_SAVE_INTERVAL: 1500
    };

    #autoSaveInterval;
    #notificationSystem;
    #lastSaveTimestamp = 0;
    #lastUpdate = Date.now();
    #isSaving = false;

    constructor(notificationSystem, autoSaveInterval = 5000) {
        super();
        this.#notificationSystem = notificationSystem;
        this.#setupAutoSave(autoSaveInterval);

        window.addEventListener('beforeunload', () => {
            this.saveAll(true).then(r => { if (r) this.#notificationSystem?.showInfo('Sauvegarde effectuée') });
        });
    }

    hasSaveData() {
        const hasVisited = localStorage.getItem(SaveManager.SAVE_KEYS.HAS_VISITED);
        const hasGenerators = localStorage.getItem(SaveManager.SAVE_KEYS.GENERATORS);

        return hasVisited === 'true' && hasGenerators !== null;
    }

    async loadAll() {
        console.group('📂 Chargement des données');
        try {
            const savedData = {
                currency: localStorage.getItem(SaveManager.SAVE_KEYS.CURRENCY),
                generators: localStorage.getItem(SaveManager.SAVE_KEYS.GENERATORS),
                achievements: localStorage.getItem(SaveManager.SAVE_KEYS.ACHIEVEMENTS),
                boosters: localStorage.getItem(SaveManager.SAVE_KEYS.BOOSTERS),
                cards: localStorage.getItem(SaveManager.SAVE_KEYS.CARDS),
                collection: localStorage.getItem(SaveManager.SAVE_KEYS.COLLECTION)
            };

            if (!savedData.currency && !savedData.generators) {
                console.log('ℹ️ Aucune donnée à charger');
                console.groupEnd();
                return false;
            }

            const parsedData = Object.entries(savedData).reduce((acc, [key, value]) => {
                if (value) {
                    try {
                        acc[key] = JSON.parse(value);
                    } catch (e) {
                        console.warn(`⚠️ Erreur parsing ${key}:`, e);
                    }
                }
                return acc;
            }, {});

            if (parsedData.generators?.lastUpdate) {
                console.log('⏰ Calcul des gains hors-ligne');
                this.#processOfflineGains(parsedData.generators.lastUpdate);
            }

            if (parsedData.currency && window.currencySystem) {
                console.log('💰 Chargement currency');
                window.currencySystem.load(parsedData.currency);
            }

            if (window.autoClickManager) {
                if (parsedData.generators?.generators?.length > 0) {
                    console.log(`⚙️ Chargement de ${parsedData.generators.generators.length} générateurs`);
                    window.autoClickManager.load(parsedData.generators);
                } else if (!window.autoClickManager.hasGenerators) {
                    console.log('🔧 Initialisation des générateurs de base');
                    const defaultGenerators = [
                        ['Basic', 1, 10, 'Générateur de base'],
                        ['Advanced', 8, 100, 'Générateur avancé'],
                        ['Pro', 47, 1000, 'Générateur pro'],
                        ['Elite', 260, 10000, 'Générateur élite']
                    ];
                    defaultGenerators.forEach(([id, prod, cost, desc]) =>
                        window.autoClickManager.addGenerator(id, prod, cost, desc));
                }
            }

            if (parsedData.cards && window.cardSystem) {
                console.log('🎴 Chargement système de cartes');
                window.cardSystem.load(parsedData.cards);
            }

            if (parsedData.collection && window.collectionSystem) {
                console.log('📚 Chargement collection');
                window.collectionSystem.load(parsedData.collection);
            }

            if (parsedData.achievements && window.achievementSystem) {
                console.log('🏆 Chargement achievements');
                window.achievementSystem.load(parsedData.achievements);
            }

            if (parsedData.boosters && window.boosterSystem) {
                console.log('📦 Chargement boosters');
                window.boosterSystem.load(parsedData.boosters);
            }

            this.#lastUpdate = Date.now();
            console.log('✅ Chargement terminé');
            this.emit(SaveManager.EVENTS.LOAD_COMPLETED);
            this.#notificationSystem?.showSuccess('Partie chargée avec succès !');

            setTimeout(() => this.saveAll(), 1000);

            console.groupEnd();
            return true;

        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
            this.emit(SaveManager.EVENTS.LOAD_ERROR, error);
            this.#notificationSystem?.showError('Erreur lors du chargement de la sauvegarde');
            console.groupEnd();
            return false;
        }
    }

    async saveAll(force = false) {
        const now = Date.now();

        // Vérifier si on peut sauvegarder
        if (!force &&
            (this.#isSaving ||
                now - this.#lastSaveTimestamp < SaveManager.OFFLINE_CONFIG.MIN_SAVE_INTERVAL)) {
            return false;
        }

        try {
            this.#isSaving = true;

            const saveData = {
                timestamp: now,
                lastUpdate: this.#lastUpdate,
                generators: window.autoClickManager?.save(),
                currency: window.currencySystem?.save(),
                achievements: window.achievementSystem?.save(),
                boosters: window.boosterSystem?.save(),
                cards: window.cardSystem?.save(),
                collection: window.collectionSystem?.save()
            };

            // On vérifie qu'il y a des données à sauvegarder
            const hasData = Object.values(saveData).some(value => value !== undefined);
            if (!hasData) {
                return false;
            }

            // Sauvegarder chaque système
            for (const [key, value] of Object.entries(saveData)) {
                if (value) {
                    try {
                        const saveKey = SaveManager.SAVE_KEYS[key.toUpperCase()];
                        if (saveKey) {
                            localStorage.setItem(saveKey, JSON.stringify(value));
                        }
                    } catch (e) {
                        console.error(`Erreur lors de la sauvegarde de ${key}:`, e);
                    }
                }
            }

            this.#lastSaveTimestamp = now;
            this.#lastUpdate = now;
            localStorage.setItem(SaveManager.SAVE_KEYS.HAS_VISITED, 'true');

            this.emit(SaveManager.EVENTS.SAVE_COMPLETED);
            return true;
        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
            this.emit(SaveManager.EVENTS.SAVE_ERROR, error);
            return false;
        } finally {
            this.#isSaving = false;
        }
    }

    #notifyOfflineGains(offlineSeconds, gains, production) {
        const timeText = this.#formatOfflineTime(offlineSeconds);
        const gainText = `Gains hors-ligne :\n` +
            `+${NumberFormatter.format(gains)} ¤\n` +
            `(${timeText} à ${NumberFormatter.format(production)}/sec)`;

        this.#notificationSystem?.showSuccess(gainText);
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

    #processOfflineGains(lastUpdate) {
        const now = Date.now();
        const offlineSeconds = Math.min(
            Math.floor((now - lastUpdate) / 1000),
            SaveManager.OFFLINE_CONFIG.MAX_OFFLINE_TIME
        );

        const production = window.autoClickManager?.totalProductionPerSecond ?? 0;
        if (offlineSeconds > 0 && production > 0) {
            const gains = Math.floor(offlineSeconds * production);
            if (gains > 0) {
                window.currencySystem?.add(gains);
                this.#notifyOfflineGains(offlineSeconds, gains, production);
            }
        }
    }

    resetAll() {
        try {
            localStorage.clear();
            this.#notificationSystem?.showSuccess('Toutes les données ont été réinitialisées');
            return true;
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            this.#notificationSystem?.showError('Erreur lors de la réinitialisation');
            return false;
        }
    }

    #setupAutoSave(interval) {
        if (this.#autoSaveInterval) {
            clearInterval(this.#autoSaveInterval);
        }

        console.log('⚙️ Configuration de l\'autosave toutes les', interval, 'ms');

        this.#autoSaveInterval = setInterval(async () => {
            try {
                await this.saveAll();
            } catch (error) {
                console.error('❌ Erreur lors de l\'autosave:', error);
                this.emit(SaveManager.EVENTS.SAVE_ERROR, error);
            }
        }, interval);

        window.addEventListener('beforeunload', () => {
            if (this.#autoSaveInterval) {
                clearInterval(this.#autoSaveInterval);
            }
        });
    }
}