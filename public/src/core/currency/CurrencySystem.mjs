// core/currency/CurrencySystem.mjs

import { EventEmitter } from '../../utils/EventEmitter.mjs';

export class CurrencySystem extends EventEmitter {
    static EVENTS = {
        CURRENCY_UPDATED: 'currency:updated',
        MULTIPLIER_UPDATED: 'currency:multiplier:updated'
    };

    #currency;
    #baseClickValue;
    #multiplier;
    #lastUpdate;
    #autoSaveInterval;

    constructor(initialCurrency = 0, baseClickValue = 1) {
        super();
        this.#currency = initialCurrency;
        this.#baseClickValue = baseClickValue;
        this.#multiplier = 1;
        this.#lastUpdate = Date.now();
        this.#autoSaveInterval = null;

        // Démarrer l'auto-save
        this.startAutoSave();
    }

    // Getters
    get currency() {
        return this.#currency;
    }

    get formattedCurrency() {
        return `${this.#formatNumber(this.#currency)} ¤`;
    }

    get multiplier() {
        return this.#multiplier;
    }

    get baseClickValue() {
        return this.#baseClickValue;
    }

    // Méthodes principales
    addCurrency(amount) {
        if (amount <= 0) return false;

        const oldValue = this.#currency;
        this.#currency += amount;

        // Émettre l'événement de mise à jour
        this.emit(CurrencySystem.EVENTS.CURRENCY_UPDATED, {
            oldValue,
            newValue: this.#currency,
            gained: amount
        });

        return true;
    }

    removeCurrency(amount) {
        if (amount <= 0 || this.#currency < amount) return false;

        const oldValue = this.#currency;
        this.#currency -= amount;

        // Émettre l'événement de mise à jour
        this.emit(CurrencySystem.EVENTS.CURRENCY_UPDATED, {
            oldValue,
            newValue: this.#currency,
            spent: amount
        });

        return true;
    }

    handleClick() {
        const clickValue = this.#baseClickValue * this.#multiplier;
        return this.addCurrency(clickValue);
    }

    addMultiplier(value) {
        if (value <= 0) return false;

        const oldMultiplier = this.#multiplier;
        this.#multiplier += value;

        this.emit(CurrencySystem.EVENTS.MULTIPLIER_UPDATED, {
            oldValue: oldMultiplier,
            newValue: this.#multiplier,
            added: value
        });

        return true;
    }

    // Méthodes de sauvegarde
    save() {
        const saveData = {
            currency: this.#currency,
            baseClickValue: this.#baseClickValue,
            multiplier: this.#multiplier,
            lastUpdate: this.#lastUpdate
        };

        try {
            localStorage.setItem('currencySystem', JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save currency system:', error);
            return false;
        }
    }

    load() {
        try {
            const savedData = localStorage.getItem('currencySystem');
            if (!savedData) return false;

            const data = JSON.parse(savedData);
            this.#currency = data.currency;
            this.#baseClickValue = data.baseClickValue;
            this.#multiplier = data.multiplier;
            this.#lastUpdate = data.lastUpdate;

            // Émettre l'événement de mise à jour après le chargement
            this.emit(CurrencySystem.EVENTS.CURRENCY_UPDATED, {
                newValue: this.#currency,
                loaded: true
            });

            return true;
        } catch (error) {
            console.error('Failed to load currency system:', error);
            return false;
        }
    }

    // Méthodes privées
    #formatNumber(number) {
        if (number < 1000) return number.toString();

        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const magnitude = Math.floor(Math.log10(number) / 3);
        const scaled = number / Math.pow(1000, magnitude);
        const suffix = suffixes[magnitude];

        return `${scaled.toFixed(1)}${suffix}`;
    }

    startAutoSave(interval = 60000) { // Par défaut : sauvegarde toutes les minutes
        if (this.#autoSaveInterval) clearInterval(this.#autoSaveInterval);
        this.#autoSaveInterval = setInterval(() => this.save(), interval);
    }

    stopAutoSave() {
        if (this.#autoSaveInterval) {
            clearInterval(this.#autoSaveInterval);
            this.#autoSaveInterval = null;
        }
    }
}