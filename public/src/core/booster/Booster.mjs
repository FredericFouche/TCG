export class Booster {
    #id;
    #name;
    #price;
    #cardCount;
    #rarityDistribution;
    #cards = [];

    constructor(id, name, price, cardCount, rarityDistribution) {
        this.#id = id;
        this.#name = name;
        this.#price = price;
        this.#cardCount = cardCount;
        this.#rarityDistribution = rarityDistribution;
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get price() {
        return this.#price;
    }

    /**
     * Open the booster pack and return the cards inside
     * @returns {Card[]} The cards obtained from opening the booster pack
     */
    open() {
        if (this.#cards.length === 0) {
            this.#generateCards();
        }
        return this.#cards.splice(0);
    }

    /**
     * Generate the cards inside the booster pack
     */
    #generateCards() {
        for (let i = 0; i < this.#cardCount; i++) {
            const rarity = this.#getRandomRarity();
            this.#cards.push(this.cardSystem.createCard(
                `Card ${i + 1}`,
                rarity,
                {},
                [],
                `/assets/cards/${rarity}.png`,
                10
            ));
        }
    }

    /**
     * Get a random rarity based on the rarity distribution
     * @returns {string} The randomly selected rarity
     */
    #getRandomRarity() {
        const rarityKeys = Object.keys(this.#rarityDistribution);
        let randomValue = Math.random();
        let cumulativeWeight = 0;

        for (const rarity of rarityKeys) {
            cumulativeWeight += this.#rarityDistribution[rarity];
            if (randomValue <= cumulativeWeight) {
                return rarity;
            }
        }

        return CardSystem.RARITY.COMMON;
    }

    toJSON() {
        return {
            id: this.#id,
            name: this.#name,
            price: this.#price,
            cardCount: this.#cardCount,
            rarityDistribution: this.#rarityDistribution
        };
    }

    static fromJSON(json, cardSystem) {
        const booster = new Booster(
            json.id,
            json.name,
            json.price,
            json.cardCount,
            json.rarityDistribution
        );
        booster.cardSystem = cardSystem;
        return booster;
    }
}