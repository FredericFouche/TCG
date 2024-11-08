import {CardSystem} from "./CardSystem.mjs";

export class Card {
    #id;
    #name;
    #rarity;
    #stats;
    #tags;
    #imageUrl;
    #baseValue;
    #acquiredDate;
    #isLocked;
    #amount;

    constructor({ id, name, rarity, stats, tags, imageUrl, baseValue }) {
        this.#id = id;
        this.#name = name;
        this.#rarity = rarity;
        this.#stats = stats;
        this.#tags = tags;
        this.#imageUrl = imageUrl;
        this.#baseValue = baseValue;
        this.#acquiredDate = new Date();
        this.#isLocked = false;
        this.#amount = 1;
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get rarity() {
        return this.#rarity;
    }

    get stats() {
        return this.#stats;
    }

    get tags() {
        return this.#tags;
    }

    get imageUrl() {
        return this.#imageUrl;
    }

    get acquiredDate() {
        return new Date(this.#acquiredDate);
    }

    get isLocked() {
        return this.#isLocked;
    }

    get amount() {
        return this.#amount;
    }

    getCurrentValue() {
        const rarityMultiplier = CardSystem.RARITY_MULTIPLIER[this.#rarity];
        let value = this.#baseValue * rarityMultiplier;

        // Additional bonus for legendary and epic cards
        if (this.#rarity === CardSystem.RARITY.LEGENDARY) {
            value *= 1.5;
        } else if (this.#rarity === CardSystem.RARITY.EPIC) {
            value *= 1.2;
        }

        return Math.floor(value);
    }

    lock() {
        this.#isLocked = true;
        return this;
    }

    unlock() {
        this.#isLocked = false;
        return this;
    }

    addCopy(quantity = 1) {
        this.#amount += quantity;
        return this;
    }

    removeCopy(quantity = 1) {
        if (this.#amount >= quantity) {
            this.#amount -= quantity;
            return true;
        }
        return false;
    }

    sell(quantity = 1) {
        if (this.#isLocked) {
            throw new Error("Cannot sell a locked card");
        }

        if (this.#amount < quantity) {
            throw new Error("Not enough copies to sell");
        }

        const totalValue = this.getCurrentValue() * quantity;
        this.removeCopy(quantity);
        return totalValue;
    }

    toJSON() {
        return {
            id: this.#id,
            name: this.#name,
            rarity: this.#rarity,
            stats: this.#stats,
            tags: this.#tags,
            imageUrl: this.#imageUrl,
            baseValue: this.#baseValue,
            acquiredDate: this.#acquiredDate.toISOString(),
            isLocked: this.#isLocked,
            amount: this.#amount
        };
    }

    static fromJSON(json) {
        const card = new Card(json);
        card.#acquiredDate = new Date(json.acquiredDate);
        card.#isLocked = json.isLocked;
        card.#amount = json.amount;
        return card;
    }

    clone() {
        return new Card({
            id: this.#id,
            name: this.#name,
            rarity: this.#rarity,
            stats: this.#stats,
            tags: this.#tags,
            imageUrl: this.#imageUrl,
            baseValue: this.#baseValue
        });
    }
}