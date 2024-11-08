export class Card {
    // Propriétés statiques pour les raretés
    static RARITY = {
        COMMON: 'common',
        UNCOMMON: 'uncommon',
        RARE: 'rare',
        EPIC: 'epic',
        LEGENDARY: 'legendary'
    };

    // Multiplicateurs de valeur selon la rareté
    static RARITY_MULTIPLIER = {
        [Card.RARITY.COMMON]: 1,
        [Card.RARITY.UNCOMMON]: 2,
        [Card.RARITY.RARE]: 5,
        [Card.RARITY.EPIC]: 10,
        [Card.RARITY.LEGENDARY]: 25
    };

    // Propriétés privées
    #id;
    #name;
    #description;
    #image;
    #rarity;
    #baseValue;
    #acquiredDate;
    #isLocked;
    #amount;

    /**
     * @param {Object} params - Les paramètres de la carte
     * @param {string} params.id - Identifiant unique de la carte
     * @param {string} params.name - Nom de la carte
     * @param {string} params.description - Description de la carte
     * @param {string} params.image - URL ou chemin de l'image
     * @param {string} params.rarity - Rareté de la carte (utiliser Card.RARITY)
     * @param {number} params.baseValue - Valeur de base de la carte
     * @param {number} [params.amount=1] - Nombre initial de copies
     */
    constructor({
                    id,
                    name,
                    description = '',
                    image = null,
                    rarity = Card.RARITY.COMMON,
                    baseValue = 10,
                    amount = 1
                }) {
        // Validation des paramètres requis
        if (!id || !name) {
            throw new Error('ID et nom sont requis pour créer une carte');
        }

        // Validation de la rareté
        if (!Object.values(Card.RARITY).includes(rarity)) {
            throw new Error(`Rareté invalide: ${rarity}`);
        }

        this.#id = id;
        this.#name = name;
        this.#description = description;
        this.#image = image;
        this.#rarity = rarity;
        this.#baseValue = Math.max(0, baseValue); // Pas de valeur négative
        this.#acquiredDate = new Date();
        this.#isLocked = false;
        this.#amount = Math.max(1, amount); // Au moins 1 copie
    }

    // Getters
    get id() { return this.#id; }
    get name() { return this.#name; }
    get description() { return this.#description; }
    get image() { return this.#image; }
    get rarity() { return this.#rarity; }
    get baseValue() { return this.#baseValue; }
    get acquiredDate() { return new Date(this.#acquiredDate); }
    get isLocked() { return this.#isLocked; }
    get amount() { return this.#amount; }

    /**
     * Calcule la valeur actuelle de la carte en tenant compte de la rareté
     * @returns {number} La valeur calculée
     */
    getCurrentValue() {
        let value = this.#baseValue * Card.RARITY_MULTIPLIER[this.#rarity];

        // Bonus supplémentaires selon la rareté
        if (this.#rarity === Card.RARITY.LEGENDARY) {
            value *= 1.5; // +50% pour les légendaires
        } else if (this.#rarity === Card.RARITY.EPIC) {
            value *= 1.2; // +20% pour les épiques
        }

        return Math.floor(value);
    }

    /**
     * Verrouille la carte pour éviter la vente accidentelle
     * @returns {Card} La carte elle-même pour le chaînage
     */
    lock() {
        this.#isLocked = true;
        return this;
    }

    /**
     * Déverrouille la carte
     * @returns {Card} La carte elle-même pour le chaînage
     */
    unlock() {
        this.#isLocked = false;
        return this;
    }

    /**
     * Ajoute des copies de la carte
     * @param {number} quantity - Nombre de copies à ajouter
     * @returns {Card} La carte elle-même pour le chaînage
     */
    addCopy(quantity = 1) {
        if (quantity < 0) throw new Error('La quantité doit être positive');
        this.#amount += quantity;
        return this;
    }

    /**
     * Retire des copies de la carte
     * @param {null} quantity - Nombre de copies à retirer
     * @returns {boolean} true si le retrait a réussi, false sinon
     */
    removeCopy(quantity = 1) {
        if (quantity < 0) throw new Error('La quantité doit être positive');
        if (this.#amount >= quantity) {
            this.#amount -= quantity;
            return true;
        }
        return false;
    }

    /**
     * Vend des copies de la carte
     * @param {number} quantity - Nombre de copies à vendre
     * @returns {number} La valeur totale de la vente
     * @throws {Error} Si la carte est verrouillée ou si pas assez de copies
     */
    sell(quantity = 1) {
        if (this.#isLocked) {
            throw new Error("Impossible de vendre une carte verrouillée");
        }
        if (quantity < 0) {
            throw new Error("La quantité doit être positive");
        }
        if (this.#amount < quantity) {
            throw new Error("Pas assez de copies à vendre");
        }

        const totalValue = this.getCurrentValue() * quantity;
        this.removeCopy(quantity);
        return totalValue;
    }

    /**
     * Convertit la carte en objet JSON pour la sauvegarde
     * @returns {Object} Représentation JSON de la carte
     */
    toJSON() {
        return {
            id: this.#id,
            name: this.#name,
            description: this.#description,
            image: this.#image,
            rarity: this.#rarity,
            baseValue: this.#baseValue,
            acquiredDate: this.#acquiredDate.toISOString(),
            isLocked: this.#isLocked,
            amount: this.#amount
        };
    }

    /**
     * Crée une carte à partir d'un objet JSON
     * @param {Object} json - Objet JSON représentant une carte
     * @returns {Card} Nouvelle instance de carte
     */
    static fromJSON(json) {
        const card = new Card({
            id: json.id,
            name: json.name,
            description: json.description,
            image: json.image,
            rarity: json.rarity,
            baseValue: json.baseValue,
            amount: json.amount
        });

        card.#acquiredDate = new Date(json.acquiredDate);
        card.#isLocked = json.isLocked;
        return card;
    }

    /**
     * Crée une copie indépendante de la carte
     * @returns {Card} Nouvelle instance de carte avec les mêmes propriétés
     */
    clone() {
        return new Card({
            id: this.#id,
            name: this.#name,
            description: this.#description,
            image: this.#image,
            rarity: this.#rarity,
            baseValue: this.#baseValue,
            amount: 1
        });
    }
}

export default Card;