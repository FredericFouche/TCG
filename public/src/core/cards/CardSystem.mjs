import {EventEmitter} from '../../utils/EventEmitter.mjs';
import {Card} from './Card.mjs';


export class CardSystem {
    static EVENTS = {
        CARD_ADDED: 'card:added',
        CARD_REMOVED: 'card:removed',
        CARD_UPDATED: 'card:updated',
        COLLECTION_LOADED: 'collection:loaded',
        COLLECTION_CLEARED: 'collection:cleared'
    };

    static CARD_TEMPLATES = {
        common: {
            baseNames: ["Gobelin", "Soldat", "Archer", "Paysan", "Rat"],
            baseValue: 10
        },
        uncommon: {
            baseNames: ["Chevalier", "Mage", "Prêtre", "Voleur", "Druide"],
            baseValue: 25
        },
        rare: {
            baseNames: ["Capitaine", "Archimage", "Champion", "Assassin", "Oracle"],
            baseValue: 50
        },
        epic: {
            baseNames: ["Dragon", "Licorne", "Phénix", "Golem", "Hydre"],
            baseValue: 100
        },
        legendary: {
            baseNames: ["Ancien Dragon", "Roi des Rois", "Dieu Déchu", "Avatar", "Titan"],
            baseValue: 250
        }
    };

    #cards;
    #eventEmitter;
    #nextCardId;

    constructor() {
        this.#cards = new Map();
        this.#eventEmitter = new EventEmitter();
        this.#nextCardId = Date.now();
    }

    createCard(rarity) {
        const template = CardSystem.CARD_TEMPLATES[rarity];
        if (!template) {
            throw new Error(`Rareté invalide: ${rarity}`);
        }

        const randomName = template.baseNames[Math.floor(Math.random() * template.baseNames.length)];
        const id = `${rarity}_${this.#nextCardId++}`;

        const card = new Card({
            id,
            name: randomName,
            rarity,
            baseValue: template.baseValue,
            description: `Une carte ${rarity} représentant ${randomName}`
        });

        this.addCard(card);

        return card;
    }

    addCard(card) {
        if (!(card instanceof Card)) {
            throw new Error('L\'objet doit être une instance de Card');
        }

        const cardKey = `${card.rarity}_${card.name}`;

        const existingCard = Array.from(this.#cards.values())
            .find(c => `${c.rarity}_${c.name}` === cardKey);

        if (existingCard) {
            existingCard.addCopy(card.amount);
            this.#eventEmitter.emit(CardSystem.EVENTS.CARD_UPDATED, { card: existingCard });
            return false;
        }

        this.#cards.set(card.id, card);
        this.#eventEmitter.emit(CardSystem.EVENTS.CARD_ADDED, { card });
        return true;
    }

    migrateCards() {
        const cards = Array.from(this.#cards.values());
        const uniqueCards = new Map();

        cards.forEach(card => {
            const cardKey = `${card.rarity}_${card.name}`;
            if (uniqueCards.has(cardKey)) {
                const existingCard = uniqueCards.get(cardKey);
                existingCard.addCopy(card.amount);
            } else {
                uniqueCards.set(cardKey, card);
            }
        });

        this.#cards.clear();
        uniqueCards.forEach(card => {
            this.#cards.set(card.id, card);
        });

        this.#eventEmitter.emit(CardSystem.EVENTS.COLLECTION_LOADED, {
            cardCount: this.#cards.size
        });
    }

    removeCard(cardId, amount = null) {
        const card = this.#cards.get(cardId);
        if (!card) return false;

        if (amount !== null) {
            const success = card.removeCopy(amount);
            if (!success) return false;

            this.#eventEmitter.emit(CardSystem.EVENTS.CARD_UPDATED, { card });

            if (card.amount <= 0) {
                this.#cards.delete(cardId);
                this.#eventEmitter.emit(CardSystem.EVENTS.CARD_REMOVED, { cardId });
            }

            return true;
        }

        this.#cards.delete(cardId);
        this.#eventEmitter.emit(CardSystem.EVENTS.CARD_REMOVED, { cardId });
        return true;
    }

    getCard(cardId) {
        return this.#cards.get(cardId) || null;
    }

    getCards(filters = {}) {
        let cards = Array.from(this.#cards.values());

        if (filters.rarity) {
            cards = cards.filter(card => card.rarity === filters.rarity);
        }
        if (filters.locked !== undefined) {
            cards = cards.filter(card => card.isLocked === filters.locked);
        }
        if (filters.minValue) {
            cards = cards.filter(card => card.getCurrentValue() >= filters.minValue);
        }

        return cards;
    }

    getStats() {
        const stats = {
            totalCards: 0,
            byRarity: Object.values(Card.RARITY).reduce((acc, rarity) => {
                acc[rarity] = 0;
                return acc;
            }, {}),
            totalValue: 0,
            uniqueCards: this.#cards.size
        };

        for (const card of this.#cards.values()) {
            stats.totalCards += card.amount;
            stats.byRarity[card.rarity] += card.amount;
            stats.totalValue += card.getCurrentValue() * card.amount;
        }

        return stats;
    }

    clearCollection() {
        this.#cards.clear();
        this.#eventEmitter.emit(CardSystem.EVENTS.COLLECTION_CLEARED);
        return true;
    }

    on(event, callback) {
        this.#eventEmitter.on(event, callback);
    }

    off(event, callback) {
        this.#eventEmitter.off(event, callback);
    }

    save() {
        return {
            cards: Array.from(this.#cards.values()).map(card => card.toJSON()),
            nextCardId: this.#nextCardId
        };
    }

    load(saveData) {
        if (!saveData) return;

        try {
            this.#cards.clear();
            this.#nextCardId = saveData.nextCardId || Date.now();

            for (const cardData of saveData.cards) {
                const card = Card.fromJSON(cardData);
                this.#cards.set(card.id, card);
            }

            this.migrateCards();

            this.#eventEmitter.emit(CardSystem.EVENTS.COLLECTION_LOADED, {
                cardCount: this.#cards.size
            });
        } catch (error) {
            console.error('Erreur lors du chargement de la collection:', error);
        }
    }
}