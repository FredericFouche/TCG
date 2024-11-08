import { EventEmitter } from "../../utils/EventEmitter.mjs";

/**
 * CardSystem class
 * This class is responsible for managing the cards in the game.
 * It will handle cards characteristics, cards effects, cards interactions
 * and cards animations.
 * Cards are defined by:
 * - An id (unique)
 * - A name
 * - A rarity
 * - Stats
 * - Tags
 * - isLocked
 * - Date of Acquisition
 * - An image
 * - A value (for trading) depending on rarity and stats
 */
export class CardSystem extends EventEmitter {
    static RARITY = {
        COMMON: 'common',
        UNCOMMON: 'uncommon',
        RARE: 'rare',
        EPIC: 'epic',
        LEGENDARY: 'legendary'
    };

    static RARITY_MULTIPLIER = {
        [CardSystem.RARITY.COMMON]: 1,
        [CardSystem.RARITY.UNCOMMON]: 2,
        [CardSystem.RARITY.RARE]: 5,
        [CardSystem.RARITY.EPIC]: 10,
        [CardSystem.RARITY.LEGENDARY]: 25
    };

    #cards = new Map();
    #nextCardId = 1;

    constructor() {
        super();
    }

    /**
     * Create a new card
     * @param {string} name - The name of the card
     * @param {string} rarity - The rarity of the card
     * @param {object} stats - The stats of the card
     * @param {string[]} tags - The tags of the card
     * @param {string} imageUrl - The URL of the card image
     * @param {number} baseValue - The base value of the card
     * @returns {Card} The new card
     */
    createCard(name, rarity, stats, tags, imageUrl, baseValue) {
        const card = new Card({
            id: this.#nextCardId++,
            name,
            rarity,
            stats,
            tags,
            imageUrl,
            baseValue
        });
        this.#cards.set(card.id, card);
        this.emit('card-created', card);
        return card;
    }

    /**
     * Get a card by its id
     * @param {number} cardId - The id of the card
     * @returns {Card|undefined} The card with the given id, or undefined if not found
     */
    getCardById(cardId) {
        return this.#cards.get(cardId);
    }

    /**
     * Lock a card
     * @param {number} cardId - The id of the card to lock
     */
    lockCard(cardId) {
        const card = this.getCardById(cardId);
        if (card) {
            card.lock();
            this.emit('card-locked', card);
        }
    }

    /**
     * Unlock a card
     * @param {number} cardId - The id of the card to unlock
     */
    unlockCard(cardId) {
        const card = this.getCardById(cardId);
        if (card) {
            card.unlock();
            this.emit('card-unlocked', card);
        }
    }

    /**
     * Get the current value of a card
     * @param {number} cardId - The id of the card
     * @returns {number} The current value of the card
     */
    getCardValue(cardId) {
        const card = this.getCardById(cardId);
        if (card) {
            return card.getCurrentValue();
        }
        return 0;
    }

    /**
     * Sell a card
     * @param {number} cardId - The id of the card to sell
     * @param {number} quantity - The quantity of the card to sell
     * @returns {number} The total value received from the sale
     */
    sellCard(cardId, quantity = 1) {
        const card = this.getCardById(cardId);
        if (card) {
            const value = card.sell(quantity);
            this.emit('card-sold', card, value);
            return value;
        }
        return 0;
    }

    /**
     * Add a copy of a card to the player's collection
     * @param {number} cardId - The id of the card
     * @param {number} [quantity=1] - The quantity of the card to add
     */
    addCardCopies(cardId, quantity = 1) {
        const card = this.getCardById(cardId);
        if (card) {
            card.addCopy(quantity);
            this.emit('card-copies-added', card, quantity);
        }
    }

    /**
     * Remove a copy of a card from the player's collection
     * @param {number} cardId - The id of the card
     * @param {number} [quantity=1] - The quantity of the card to remove
     * @returns {boolean} True if the removal was successful, false otherwise
     */
    removeCardCopies(cardId, quantity = 1) {
        const card = this.getCardById(cardId);
        if (card) {
            const success = card.removeCopy(quantity);
            if (success) {
                this.emit('card-copies-removed', card, quantity);
            }
            return success;
        }
        return false;
    }

    /**
     * Save the current state of the card system
     * @returns {object} The saved state of the card system
     */
    save() {
        const savedCards = Array.from(this.#cards.values()).map(card => card.toJSON());
        return {
            cards: savedCards,
            nextCardId: this.#nextCardId
        };
    }

    /**
     * Load the saved state of the card system
     * @param {object} savedState - The saved state of the card system
     */
    load(savedState) {
        this.#cards.clear();
        savedState.cards.forEach(cardData => {
            const card = Card.fromJSON(cardData);
            this.#cards.set(card.id, card);
        });
        this.#nextCardId = savedState.nextCardId;
        this.emit('cards-loaded');
    }
}
