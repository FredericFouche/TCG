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
        this.initialized = this.#loadFromStorage();
    }

    /**
     * Crée une nouvelle carte avec la rareté spécifiée
     * @param {string} rarity - Rareté de la carte à créer
     * @returns {Card} Nouvelle carte créée
     */
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

        // On ajoute automatiquement la carte à la collection
        this.addCard(card);

        return card;
    }

    /**
     * Ajoute une carte à la collection
     * @param {Card} card - La carte à ajouter
     * @returns {boolean} true si ajoutée, false si mise à jour
     */
    addCard(card) {
        if (!(card instanceof Card)) {
            throw new Error('L\'objet doit être une instance de Card');
        }

        const existingCard = this.#cards.get(card.id);
        if (existingCard) {
            existingCard.addCopy(card.amount);
            this.#eventEmitter.emit(CardSystem.EVENTS.CARD_UPDATED, { card: existingCard });
            this.#saveToStorage();
            return false;
        }

        this.#cards.set(card.id, card);
        this.#eventEmitter.emit(CardSystem.EVENTS.CARD_ADDED, { card });
        this.#saveToStorage();
        return true;
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

            this.#saveToStorage();
            return true;
        }

        this.#cards.delete(cardId);
        this.#eventEmitter.emit(CardSystem.EVENTS.CARD_REMOVED, { cardId });
        this.#saveToStorage();
        return true;
    }

    /**
     * Récupère une carte par son ID
     * @param {string} cardId - L'ID de la carte
     * @returns {Card|null} La carte ou null si non trouvée
     */
    getCard(cardId) {
        return this.#cards.get(cardId) || null;
    }

    /**
     * Récupère toutes les cartes selon des critères
     * @param {Object} filters - Critères de filtrage
     * @returns {Card[]} Liste des cartes filtrées
     */
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

    /**
     * Obtient des statistiques sur la collection
     * @returns {Object} Statistiques de la collection
     */
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

    /**
     * Sauvegarde la collection dans le localStorage
     * @private
     */
    #saveToStorage() {
        console.log('Sauvegarde...');
        console.log('Cards à sauvegarder:', Array.from(this.#cards.values()));
        const saveData = Array.from(this.#cards.values()).map(card => card.toJSON());
        console.log('SaveData:', saveData);
        localStorage.setItem('cardCollection', JSON.stringify(saveData));
        console.log('Vérification après sauvegarde:', localStorage.getItem('cardCollection'));
    }

    async #loadFromStorage() {
        try {
            const saveData = localStorage.getItem('cardCollection');
            if (!saveData) {
                this.#eventEmitter.emit(CardSystem.EVENTS.COLLECTION_LOADED, {
                    cardCount: 0
                });
                return;
            }

            const cardDataArray = JSON.parse(saveData);
            this.#cards.clear();

            for (const cardData of cardDataArray) {
                const card = Card.fromJSON(cardData);
                this.#cards.set(card.id, card);
            }

            this.#eventEmitter.emit(CardSystem.EVENTS.COLLECTION_LOADED, {
                cardCount: this.#cards.size
            });
        } catch (error) {
            console.error('Erreur lors du chargement de la collection:', error);
            this.#eventEmitter.emit(CardSystem.EVENTS.COLLECTION_LOADED, {
                cardCount: 0,
                error
            });
        }
    }

    /**
     * Vide la collection
     * @returns {boolean} true si réussi
     */
    clearCollection() {
        this.#cards.clear();
        localStorage.removeItem('cardCollection');
        this.#eventEmitter.emit(CardSystem.EVENTS.COLLECTION_CLEARED);
        return true;
    }

    /**
     * Abonne une fonction à un événement
     * @param {string} event - Type d'événement
     * @param {Function} callback - Fonction à appeler
     */
    on(event, callback) {
        this.#eventEmitter.on(event, callback);
    }

    /**
     * Désabonne une fonction d'un événement
     * @param {string} event - Type d'événement
     * @param {Function} callback - Fonction à désabonner
     */
    off(event, callback) {
        this.#eventEmitter.off(event, callback);
    }
}