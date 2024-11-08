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

    constructor(initialCurrency = 0, baseClickValue = 1) {
        super();
        this.#currency = initialCurrency;
        this.#baseClickValue = baseClickValue;
        this.#multiplier = 1;
        this.#lastUpdate = Date.now();
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
    add(amount) {
        if (amount <= 0) return false;

        const oldValue = this.#currency;
        this.#currency += amount;

        if (window.achievementSystem) {
            window.achievementSystem.checkAchievement('first-coins', this.#currency);
            window.achievementSystem.checkAchievement('millionaire', this.#currency);
        }

        this.emit(CurrencySystem.EVENTS.CURRENCY_UPDATED, {
            oldValue,
            newValue: this.#currency,
            gained: amount
        });

        return true;
    }

    spend(amount) {
        if (amount <= 0 || this.#currency < amount) return false;

        const oldValue = this.#currency;
        this.#currency -= amount;

        this.emit(CurrencySystem.EVENTS.CURRENCY_UPDATED, {
            oldValue,
            newValue: this.#currency,
            spent: amount
        });

        return true;
    }

    canSpend(amount) {
        return amount > 0 && this.#currency >= amount;
    }

    handleClick() {
        const clickValue = this.#baseClickValue * this.#multiplier;
        return this.add(clickValue);
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
        return {
            currency: this.#currency,
            baseClickValue: this.#baseClickValue,
            multiplier: this.#multiplier,
            lastUpdate: this.#lastUpdate
        };
    }

    load(data) {
        if (!data) return false;

        try {
            this.#currency = Number(data.currency);
            this.#baseClickValue = Number(data.baseClickValue);
            this.#multiplier = Number(data.multiplier);
            this.#lastUpdate = data.lastUpdate;

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

    // Méthode privée pour le formatage des nombres
    #formatNumber(number) {
        if (number < 1000) return number.toString();

        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const magnitude = Math.floor(Math.log10(number) / 3);
        const scaled = number / Math.pow(1000, magnitude);
        const suffix = suffixes[magnitude];

        return `${scaled.toFixed(1)}${suffix}`;
    }
}