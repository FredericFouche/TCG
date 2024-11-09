import { EventEmitter } from '../../utils/EventEmitter.mjs';
import { NumberFormatter } from '../../utils/NumberFormatter.mjs'

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
        return `${NumberFormatter.format(this.#currency)} ¤`;
    }

    get multiplier() {
        return this.#multiplier;
    }

    get baseClickValue() {
        return this.#baseClickValue;
    }

    add(amount) {
        console.group('💰 CurrencySystem.add()');
        console.log('Paramètres:', {
            montantDemandé: amount,
            montantActuel: this.#currency,
            timestamp: new Date()
        });

        if (amount <= 0) {
            console.warn('❌ Montant invalide');
            console.groupEnd();
            return false;
        }

        const oldValue = this.#currency;
        this.#currency += amount;

        console.log('💵 Mise à jour effectuée:', {
            ancien: oldValue,
            ajouté: amount,
            nouveau: this.#currency
        });

        if (window.achievementSystem) {
            window.achievementSystem.checkAchievement('first-coins', this.#currency);
            window.achievementSystem.checkAchievement('millionaire', this.#currency);
        }

        this.emit(CurrencySystem.EVENTS.CURRENCY_UPDATED, {
            oldValue,
            newValue: this.#currency,
            gained: amount
        });

        console.groupEnd();
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

    save() {
        return {
            currency: this.#currency,
            baseClickValue: this.#baseClickValue,
            multiplier: this.#multiplier
        };
    }

    load(data) {
        if (!data) return false;

        this.#currency = Number(data.currency) || 0;
        this.#baseClickValue = Number(data.baseClickValue) || 1;
        this.#multiplier = Number(data.multiplier) || 1;

        this.emit(CurrencySystem.EVENTS.CURRENCY_UPDATED, {
            newValue: this.#currency,
            loaded: true
        });

        return true;
    }
}