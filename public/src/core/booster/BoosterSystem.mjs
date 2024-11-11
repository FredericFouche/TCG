import { EventEmitter } from '../../utils/EventEmitter.mjs';

export class BoosterSystem extends EventEmitter {
    /** @type {Object.<string, string>} */
    static EVENTS = {
        BOOSTER_PURCHASED: 'booster:purchased',
        BOOSTER_OPENED: 'booster:opened',
        BOOSTER_OPEN_REQUESTED: 'booster:open-requested',
        BOOSTER_ERROR: 'booster:error',
        PITY_UPDATED: 'booster:pity-updated'
    };

    /** @type {Object.<string, number>} */
    static PITY_THRESHOLDS = {
        legendary: 50,
        epic: 20,
        rare: 10
    };

    #cardSystem;
    #pityCounters;
    #boosterHistory;
    #statistics;
    #boosters;

    constructor(cardSystem) {
        super();
        if (!cardSystem) {
            throw new Error('CardSystem is required');
        }

        this.#cardSystem = cardSystem;
        this.#pityCounters = { legendary: 0, epic: 0, rare: 0 };
        this.#boosterHistory = [];
        this.#statistics = {
            totalOpened: 0,
            rarityDistribution: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }
        };
        this.#boosters = new Map();
    }

    purchaseBooster(type, currencySystem) {
        const config = this.#getBoosterConfig(type);

        if (!config) {
            this.emit(BoosterSystem.EVENTS.BOOSTER_ERROR, {
                message: `Invalid booster type: ${type}`
            });
            return null;
        }

        if (!currencySystem || typeof currencySystem.canSpend !== 'function' || typeof currencySystem.spend !== 'function') {
            this.emit(BoosterSystem.EVENTS.BOOSTER_ERROR, {
                message: `Invalid currency system provided`
            });
            return null;
        }

        currencySystem.spend(config.cost);

        const booster = {
            id: crypto.randomUUID(),
            type,
            purchaseDate: new Date(),
            opened: false,
            cards: null
        };

        this.#boosters.set(booster.id, booster);
        this.emit(BoosterSystem.EVENTS.BOOSTER_PURCHASED, { booster });
        return booster;
    }

    openBooster(boosterId) {
        const booster = this.#boosters.get(boosterId);
        if (!booster) {
            this.emit(BoosterSystem.EVENTS.BOOSTER_ERROR, {
                message: `Booster with ID ${boosterId} not found`
            });
            return null;
        }

        if (booster.opened) {
            this.emit(BoosterSystem.EVENTS.BOOSTER_ERROR, {
                message: `Booster with ID ${boosterId} is already opened`
            });
            return null;
        }

        // Génération des cartes du booster
        const cards = this.#generateBoosterCards(booster.type);

        // Marquer le booster comme ouvert
        booster.opened = true;
        booster.cards = cards;

        // Mise à jour des statistiques
        this.#statistics.totalOpened++;
        cards.forEach(card => {
            this.#statistics.rarityDistribution[card.rarity]++;
        });

        // Sauvegarde de l'historique
        this.#boosterHistory.push({
            id: booster.id,
            type: booster.type,
            openDate: new Date(),
            cards: cards.map(card => ({ id: card.id, rarity: card.rarity }))
        });

        // Ajout des cartes à la collection du joueur
        cards.forEach(card => {
            this.#cardSystem.addCard(card);
        });

        // Émission de l'événement
        this.emit(BoosterSystem.EVENTS.BOOSTER_OPENED, { booster, cards });

        // Suppression du booster de la liste des boosters non ouverts
        this.#boosters.delete(boosterId);

        return cards;
    }

    #generateBoosterCards(boosterType) {
        const config = this.#getBoosterConfig(boosterType);
        const cards = [];
        let highestRarity = 'common';

        for (let i = 0; i < config.cardCount; i++) {
            const rarity = this.#determineCardRarity(boosterType);

            const card = this.#cardSystem.createCard(rarity);
            cards.push(card);

            if (this.#getRarityValue(rarity) > this.#getRarityValue(highestRarity)) {
                highestRarity = rarity;
            }
        }

        this.#updatePityCounters(highestRarity);
        return cards;
    }

    getUnusedBoosters() {
        return Array.from(this.#boosters.values()).filter(booster => !booster.opened);
    }

    #getBoosterConfig(type) {
        return {
            basic: {
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
            premium: {
                cardCount: 10,
                cost: 250,
                weights: {
                    common: 60,
                    uncommon: 25,
                    rare: 10,
                    epic: 4,
                    legendary: 1
                }
            }
        }[type];
    }

    #determineCardRarity(boosterType) {
        const config = this.#getBoosterConfig(boosterType);

        const rarities = Object.keys(BoosterSystem.PITY_THRESHOLDS);
        for (const rarity of rarities) {
            if (this.#pityCounters[rarity] >= BoosterSystem.PITY_THRESHOLDS[rarity]) {
                console.log(`Pitié activée pour ${rarity} après ${this.#pityCounters[rarity]} packs`);
                return rarity;
            }
        }

        // Tirage normal avec les poids de rareté
        const random = Math.random() * 100;
        let sum = 0;

        for (const [rarity, weight] of Object.entries(config.weights)) {
            sum += weight;
            if (random <= sum) {
                return rarity;
            }
        }

        return 'common'; // Fallback
    }

    /**
     * Met à jour les compteurs de pitié
     * @private
     * @param {string} highestRarity - Plus haute rareté obtenue dans le pack
     */
    #updatePityCounters(highestRarity) {
        // Incrémentation de tous les compteurs
        for (const rarity in this.#pityCounters) {
            this.#pityCounters[rarity]++;
        }

        // Reset des compteurs pour les raretés obtenues et inférieures
        const rarityValues = {
            common: 0,
            uncommon: 1,
            rare: 2,
            epic: 3,
            legendary: 4
        };

        const obtainedValue = rarityValues[highestRarity];
        for (const rarity in this.#pityCounters) {
            if (rarityValues[rarity] <= obtainedValue) {
                this.#pityCounters[rarity] = 0;
            }
        }

        this.emit(BoosterSystem.EVENTS.PITY_UPDATED, { counters: { ...this.#pityCounters } });
    }

    /**
     * Récupère la valeur numérique d'une rareté
     * @private
     * @param {string} rarity - Rareté à évaluer
     * @returns {number} Valeur de la rareté
     */
    #getRarityValue(rarity) {
        const values = {
            common: 0,
            uncommon: 1,
            rare: 2,
            epic: 3,
            legendary: 4
        };
        return values[rarity] || 0;
    }

    /**
     * Sauvegarde l'état du système
     * @returns {Object} État du système
     */
    save() {
        return {
            pityCounters: this.#pityCounters,
            boosterHistory: this.#boosterHistory,
            statistics: this.#statistics,
            boosters: Array.from(this.#boosters.values())
        };
    }

    /**
     * Charge un état sauvegardé
     * @param data - Données à charger
     */
    load(data) {
        if (data.pityCounters) this.#pityCounters = data.pityCounters;
        if (data.boosterHistory) this.#boosterHistory = data.boosterHistory;
        if (data.statistics) this.#statistics = data.statistics;
        if (data.boosters) {
            this.#boosters.clear();
            data.boosters.forEach(booster => {
                this.#boosters.set(booster.id, booster);
            });
        }
    }

    /**
     * Récupère les statistiques actuelles
     * @returns {Object} Statistiques et compteurs de pitié
     */
    getStatistics() {
        return {
            ...this.#statistics,
            pityCounters: { ...this.#pityCounters }
        };
    }

    /**
     * Récupère l'historique des dernières ouvertures
     * @param {number} [limit=10] - Nombre d'entrées à récupérer
     * @returns {Array<BoosterHistory>} Historique des ouvertures
     */
    getHistory(limit = 10) {
        return this.#boosterHistory.slice(-limit);
    }
}