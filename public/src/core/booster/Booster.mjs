// Booster.mjs
export class Booster {
    static TYPES = {
        BASIC: 'basic',
        PREMIUM: 'premium',
        SPECIAL: 'special'
    };

    static CONFIGS = {
        [Booster.TYPES.BASIC]: {
            cardCount: 5,
            cost: 100,
            weights: {
                common: 70,
                uncommon: 20,
                rare: 8,
                epic: 1.8,
                legendary: 0.2
            }
        },
        [Booster.TYPES.PREMIUM]: {
            cardCount: 10,
            cost: 250,
            weights: {
                common: 60,
                uncommon: 25,
                rare: 10,
                epic: 4,
                legendary: 1
            }
        },
        [Booster.TYPES.SPECIAL]: {
            cardCount: 5,
            cost: 500,
            weights: {
                common: 0,
                uncommon: 50,
                rare: 30,
                epic: 15,
                legendary: 5
            }
        }
    };

    #id;
    #type;
    #purchaseDate;
    #opened;
    #cards;

    /**
     * @param {string} type - Type du booster (basic, premium, special)
     * @throws {Error} Si le type est invalide
     */
    constructor(type) {
        if (!Booster.CONFIGS[type]) {
            throw new Error(`Type de booster invalide: ${type}`);
        }

        this.#id = crypto.randomUUID();
        this.#type = type;
        this.#purchaseDate = new Date();
        this.#opened = false;
        this.#cards = null;
    }

    /**
     * Marque le booster comme ouvert et stocke ses cartes
     * @param {Array<Card>} cards - Cartes obtenues
     * @throws {Error} Si le booster est déjà ouvert
     */
    setCards(cards) {
        if (this.#opened) {
            throw new Error('Ce booster a déjà été ouvert');
        }

        const config = Booster.CONFIGS[this.#type];
        if (cards.length !== config.cardCount) {
            throw new Error(`Nombre de cartes incorrect. Attendu: ${config.cardCount}, Reçu: ${cards.length}`);
        }

        this.#cards = cards;
        this.#opened = true;
    }

    /**
     * @returns {string} L'ID du booster
     */
    get id() {
        return this.#id;
    }

    /**
     * @returns {string} Le type du booster
     */
    get type() {
        return this.#type;
    }

    /**
     * @returns {Date} La date d'achat
     */
    get purchaseDate() {
        return new Date(this.#purchaseDate);
    }

    /**
     * @returns {boolean} Si le booster a été ouvert
     */
    get isOpened() {
        return this.#opened;
    }

    /**
     * @returns {Array<Card>|null} Les cartes du booster ou null si non ouvert
     */
    get cards() {
        return this.#cards ? [...this.#cards] : null;
    }

    /**
     * @returns {number} Le coût du booster
     */
    get cost() {
        return Booster.CONFIGS[this.#type].cost;
    }

    /**
     * @returns {number} Le nombre de cartes dans le booster
     */
    get cardCount() {
        return Booster.CONFIGS[this.#type].cardCount;
    }

    /**
     * @returns {Object} Les poids de rareté du booster
     */
    get weights() {
        return { ...Booster.CONFIGS[this.#type].weights };
    }

    /**
     * Sérialise le booster pour la sauvegarde
     * @returns {Object} Représentation JSON du booster
     */
    toJSON() {
        return {
            id: this.#id,
            type: this.#type,
            purchaseDate: this.#purchaseDate.toISOString(),
            opened: this.#opened,
            cards: this.#cards ? this.#cards.map(card => card.id) : null
        };
    }

    /**
     * Crée un booster à partir d'une sauvegarde
     * @param {Object} data - Données de sauvegarde
     * @param {CardSystem} cardSystem - Pour récupérer les cartes
     * @returns {Booster} Instance de Booster
     */
    static fromJSON(data, cardSystem) {
        const booster = new Booster(data.type);
        booster.#id = data.id;
        booster.#purchaseDate = new Date(data.purchaseDate);
        booster.#opened = data.opened;

        if (data.cards) {
            booster.#cards = data.cards.map(cardId => cardSystem.getCard(cardId))
                .filter(card => card !== null);
        }

        return booster;
    }
}