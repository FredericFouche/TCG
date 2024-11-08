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
        HAS_VISITED: 'hasVisitedBefore'
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

    loadAll() {
        try {
            // Charger d'abord les générateurs
            const generatorsData = localStorage.getItem(SaveManager.SAVE_KEYS.GENERATORS);
            if (generatorsData && window.autoClickManager) {
                const data = JSON.parse(generatorsData);
                window.autoClickManager.load(data);
            }

            // Ensuite le reste des données
            const currencyData = localStorage.getItem(SaveManager.SAVE_KEYS.CURRENCY);
            if (currencyData && window.currencySystem) {
                window.currencySystem.load(JSON.parse(currencyData));
            }

            const achievementsData = localStorage.getItem(SaveManager.SAVE_KEYS.ACHIEVEMENTS);
            if (achievementsData && window.achievementSystem) {
                window.achievementSystem.load(JSON.parse(achievementsData));
            }

            const loadedAny = Boolean(generatorsData || currencyData || achievementsData);
            if (loadedAny) {
                this.emit(SaveManager.EVENTS.LOAD_COMPLETED);
                this.#notificationSystem?.showSuccess('Partie chargée avec succès !');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            this.emit(SaveManager.EVENTS.LOAD_ERROR, error);
            this.#notificationSystem?.showError('Erreur lors du chargement de la sauvegarde');
            return false;
        }
    }

    saveAll() {
        try {
            if (window.autoClickManager) {
                const generatorsData = window.autoClickManager.save();
                localStorage.setItem(SaveManager.SAVE_KEYS.GENERATORS, JSON.stringify(generatorsData));
            }

            if (window.currencySystem) {
                const currencyData = window.currencySystem.save();
                localStorage.setItem(SaveManager.SAVE_KEYS.CURRENCY, JSON.stringify(currencyData));
            }

            if (window.achievementSystem) {
                const achievementsData = window.achievementSystem.save();
                localStorage.setItem(SaveManager.SAVE_KEYS.ACHIEVEMENTS, JSON.stringify(achievementsData));
            }

            localStorage.setItem(SaveManager.SAVE_KEYS.HAS_VISITED, 'true');

            this.emit(SaveManager.EVENTS.SAVE_COMPLETED);
            this.#notificationSystem?.showSuccess('Partie sauvegardée !');
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.emit(SaveManager.EVENTS.SAVE_ERROR, error);
            this.#notificationSystem?.showError('Erreur lors de la sauvegarde');
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