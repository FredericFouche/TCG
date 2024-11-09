import { EventEmitter } from './EventEmitter.mjs';

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
        BOOSTERS: 'boosters'
    };

    #autoSaveInterval;
    #notificationSystem;

    constructor(notificationSystem, autoSaveInterval = 60000) {
        super();
        this.#notificationSystem = notificationSystem;
        this.#setupAutoSave(autoSaveInterval);
    }

    hasSaveData() {
        const hasVisited = localStorage.getItem(SaveManager.SAVE_KEYS.HAS_VISITED);
        const hasGenerators = localStorage.getItem(SaveManager.SAVE_KEYS.GENERATORS);

        return hasVisited === 'true' && hasGenerators !== null;
    }

    async loadAll() {
        console.group('📂 Chargement des données');
        try {
            // 1. Vérifier si on a des données à charger
            const hasGenerators = localStorage.getItem(SaveManager.SAVE_KEYS.GENERATORS);
            const hasCurrency = localStorage.getItem(SaveManager.SAVE_KEYS.CURRENCY);

            if (!hasGenerators && !hasCurrency) {
                console.log('ℹ️ Aucune donnée à charger');
                console.groupEnd();
                return false;
            }

            // 2. Charger d'abord la currency (nécessaire pour les générateurs)
            if (hasCurrency && window.currencySystem) {
                console.log('💰 Chargement currency');
                const currencyData = JSON.parse(hasCurrency);
                window.currencySystem.load(currencyData);
            }

            // 3. Initialiser les générateurs de base si nécessaire
            if (window.autoClickManager && !window.autoClickManager.hasGenerators) {
                console.log('🔧 Initialisation des générateurs de base');
                window.autoClickManager.addGenerator('Basic', 1, 10, 'Générateur de base');
                window.autoClickManager.addGenerator('Advanced', 8, 100, 'Générateur avancé');
                window.autoClickManager.addGenerator('Pro', 47, 1000, 'Générateur pro');
                window.autoClickManager.addGenerator('Elite', 260, 10000, 'Générateur élite');
            }

            // 4. Charger l'état des générateurs
            if (hasGenerators && window.autoClickManager) {
                console.log('⚙️ Chargement générateurs');
                const generatorsData = JSON.parse(hasGenerators);
                window.autoClickManager.load(generatorsData);
            }

            // 5. Charger les achievements après tout le reste
            const achievementsData = localStorage.getItem(SaveManager.SAVE_KEYS.ACHIEVEMENTS);
            if (achievementsData && window.achievementSystem) {
                console.log('🏆 Chargement achievements');
                window.achievementSystem.load(JSON.parse(achievementsData));
            }

            // 6. Charger les boosters en dernier
            const boostersData = localStorage.getItem(SaveManager.SAVE_KEYS.BOOSTERS);
            if (boostersData && window.boosterSystem) {
                console.log('📦 Chargement boosters');
                window.boosterSystem.load(JSON.parse(boostersData));
            }

            console.log('✅ Chargement terminé');
            this.emit(SaveManager.EVENTS.LOAD_COMPLETED);
            this.#notificationSystem?.showSuccess('Partie chargée avec succès !');

            // Forcer une sauvegarde immédiate pour assurer la cohérence
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

    saveAll() {
        console.group('💾 Sauvegarde globale');
        try {
            if (window.autoClickManager) {
                console.log('⚙️ Sauvegarde des générateurs');
                const generatorsData = window.autoClickManager.save();
                if (generatorsData) {
                    const hasGenerators = generatorsData.generators &&
                        Array.isArray(generatorsData.generators) &&
                        generatorsData.generators.length > 0;

                    if (hasGenerators) {
                        console.log('📊 État des générateurs:',
                            generatorsData.generators.map(g => ({
                                id: g.id,
                                niveau: g.level,
                                production: g.currentProduction
                            }))
                        );
                        localStorage.setItem(
                            SaveManager.SAVE_KEYS.GENERATORS,
                            JSON.stringify(generatorsData)
                        );
                        console.log('✅ Générateurs sauvegardés');
                    } else {
                        console.warn('⚠️ Données de générateurs invalides');
                    }
                } else {
                    console.warn('⚠️ Pas de données de générateurs à sauvegarder');
                }
            }

            if (window.currencySystem) {
                console.log('💰 Sauvegarde de la currency');
                const currencyData = window.currencySystem.save();
                if (currencyData) {
                    localStorage.setItem(
                        SaveManager.SAVE_KEYS.CURRENCY,
                        JSON.stringify(currencyData)
                    );
                    console.log('✅ Currency sauvegardée:', currencyData);
                }
            }

            if (window.achievementSystem) {
                console.log('🏆 Sauvegarde des achievements');
                const achievementsData = window.achievementSystem.save();
                if (achievementsData) {
                    localStorage.setItem(
                        SaveManager.SAVE_KEYS.ACHIEVEMENTS,
                        JSON.stringify(achievementsData)
                    );
                    console.log('✅ Achievements sauvegardés');
                }
            }

            if (window.boosterSystem) {
                console.log('📦 Sauvegarde des boosters');
                const boostersData = window.boosterSystem.save();
                if (boostersData) {
                    localStorage.setItem(
                        SaveManager.SAVE_KEYS.BOOSTERS,
                        JSON.stringify(boostersData)
                    );
                    console.log('✅ Boosters sauvegardés');
                }
            }

            localStorage.setItem(SaveManager.SAVE_KEYS.HAS_VISITED, 'true');

            this.emit(SaveManager.EVENTS.SAVE_COMPLETED);
            this.#notificationSystem?.showSuccess('Partie sauvegardée !');

            console.log('✅ Sauvegarde globale terminée');
            console.groupEnd();
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            this.emit(SaveManager.EVENTS.SAVE_ERROR, error);
            this.#notificationSystem?.showError('Erreur lors de la sauvegarde');
            console.groupEnd();
            return false;
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

        this.#autoSaveInterval = setInterval(() => {
            this.saveAll();
        }, interval);
    }
}