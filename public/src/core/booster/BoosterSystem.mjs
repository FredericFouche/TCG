import { EventEmitter } from '../../utils/EventEmitter.mjs';
import { CardSystem } from './../cards/CardSystem.mjs';

export class BoosterSystem extends EventEmitter {
    #boosters = new Map();
    #nextBoosterId = 1;

    constructor(cardSystem) {
        super();
        this.cardSystem = cardSystem;
    }

    /**
     * Create a new booster pack
     * @param {string} name - The name of the booster pack
     * @param {number} price - The price of the booster pack
     * @param {number} cardCount - The number of cards in the booster pack
     * @param {object} [rarity] - The probability distribution of card rarities
     * @returns {Booster} The new booster pack
     */
    createBooster(name, price, cardCount, rarity = {
        [CardSystem.RARITY.COMMON]: 0.7,
        [CardSystem.RARITY.UNCOMMON]: 0.2,
        [CardSystem.RARITY.RARE]: 0.08,
        [CardSystem.RARITY.EPIC]: 0.02,
        [CardSystem.RARITY.LEGENDARY]: 0.005
    }) {
        const booster = new Booster(this.#nextBoosterId++, name, price, cardCount, rarity);
        this.#boosters.set(booster.id, booster);
        this.emit('booster-created', booster);
        return booster;
    }

    /**
     * Open a booster pack
     * @param {number} boosterId - The id of the booster pack to open
     * @returns {Card[]} The cards obtained from opening the booster pack
     */
    openBooster(boosterId) {
        const booster = this.#boosters.get(boosterId);
        if (booster) {
            const cards = booster.open();
            this.emit('booster-opened', booster, cards);
            return cards;
        }
        return [];
    }

    /**
     * Save the current state of the booster system
     * @returns {object} The saved state of the booster system
     */
    save() {
        return {
            boosters: Array.from(this.#boosters.values()).map(booster => booster.toJSON()),
            nextBoosterId: this.#nextBoosterId
        };
    }

    /**
     * Load the saved state of the booster system
     * @param {object} savedState - The saved state of the booster system
     */
    load(savedState) {
        this.#boosters.clear();
        savedState.boosters.forEach(boosterData => {
            const booster = Booster.fromJSON(boosterData, this.cardSystem);
            this.#boosters.set(booster.id, booster);
        });
        this.#nextBoosterId = savedState.nextBoosterId;
        this.emit('boosters-loaded');
    }
}
