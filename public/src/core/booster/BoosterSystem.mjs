import { EventEmitter } from '../../utils/EventEmitter.mjs';

/**
 * @typedef {Object} BoosterConfig
 * @property {number} cardCount - Nombre de cartes dans le booster
 * @property {number} cost - Coût du booster
 * @property {Object.<string, number>} weights - Poids des raretés
 */

/**
 * @typedef {Object} Booster
 * @property {string} id - Identifiant unique du booster
 * @property {string} type - Type du booster
 * @property {Date} purchaseDate - Date d'achat
 * @property {boolean} opened - État d'ouverture
 * @property {Array<Card>|null} cards - Cartes obtenues
 */

/**
 * @typedef {Object} BoosterHistory
 * @property {string} id - Identifiant du booster
 * @property {string} type - Type du booster
 * @property {Date} openDate - Date d'ouverture
 * @property {Array<{id: string, rarity: string}>} cards - Cartes obtenues
 */

/**
 * Système de gestion des boosters et de leur ouverture
 */
export class BoosterSystem {
    /** @type {Object.<string, string>} */
    static EVENTS = {
        BOOSTER_PURCHASED: 'booster:purchased',
        BOOSTER_OPENED: 'booster:opened',
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
    #eventEmitter;
    #pityCounters;
    #boosterHistory;
    #statistics;

    /**
     * @param {import('./CardSystem').CardSystem} cardSystem - Système de gestion des cartes
     * @throws {Error} Si cardSystem n'est pas fourni
     */
    constructor(cardSystem) {
        if (!cardSystem) {
            throw new Error('CardSystem is required');
        }

        this.#cardSystem = cardSystem;
        this.#eventEmitter = new EventEmitter();
        this.#pityCounters = {
            legendary: 0,
            epic: 0,
            rare: 0
        };
        this.#boosterHistory = [];
        this.#statistics = {
            totalOpened: 0,
            rarityDistribution: {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            }
        };
    }

    /**
     * Abonne un callback à un événement
     * @param {string} event - Type d'événement
     * @param {Function} callback - Fonction à appeler
     */
    on(event, callback) {
        this.#eventEmitter.on(event, callback);
    }

    /**
     * Désabonne un callback d'un événement
     * @param {string} event - Type d'événement
     * @param {Function} callback - Fonction à retirer
     */
    off(event, callback) {
        this.#eventEmitter.off(event, callback);
    }

    /**
     * Achète un booster du type spécifié
     * @param {string} type - Type de booster
     * @param {Object} currencySystem - Système de monnaie
     * @returns {Booster|null} Le booster acheté ou null en cas d'erreur
     */
    purchaseBooster(type, currencySystem) {
        const config = this.#getBoosterConfig(type);

        if (!config) {
            this.#eventEmitter.emit(BoosterSystem.EVENTS.BOOSTER_ERROR, {
                message: `Invalid booster type: ${type}`
            });
            return null;
        }

        if (!currencySystem.canSpend(config.cost)) {
            this.#eventEmitter.emit(BoosterSystem.EVENTS.BOOSTER_ERROR, {
                message: `Not enough currency. Required: ${config.cost}`
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

        this.#eventEmitter.emit(BoosterSystem.EVENTS.BOOSTER_PURCHASED, { booster });
        return booster;
    }

    /**
     * Ouvre un booster et génère ses cartes
     * @param {Booster} booster - Booster à ouvrir
     * @returns {Array<import('./Card').Card>|null} Cartes obtenues ou null si erreur
     */
    openBooster(booster) {
        if (!booster || booster.opened) {
            this.#eventEmitter.emit(BoosterSystem.EVENTS.BOOSTER_ERROR, {
                message: 'Invalid or already opened booster'
            });
            return null;
        }

        const config = this.#getBoosterConfig(booster.type);
        const cards = [];
        let highestRarity = 'common';

        for (let i = 0; i < config.cardCount; i++) {
            const rarity = this.#determineCardRarity(booster.type);
            const card = this.#cardSystem.createCard(rarity);
            cards.push(card);

            this.#statistics.rarityDistribution[rarity]++;
            if (this.#getRarityValue(rarity) > this.#getRarityValue(highestRarity)) {
                highestRarity = rarity;
            }
        }

        this.#updatePityCounters(highestRarity);

        booster.opened = true;
        booster.cards = cards;
        this.#statistics.totalOpened++;
        this.#boosterHistory.push({
            id: booster.id,
            type: booster.type,
            openDate: new Date(),
            cards: cards.map(card => ({
                id: card.id,
                rarity: card.rarity
            }))
        });

        this.#eventEmitter.emit(BoosterSystem.EVENTS.BOOSTER_OPENED, { booster, cards });
        return cards;
    }

    /**
     * Obtient la configuration d'un type de booster
     * @private
     * @param {string} type - Type de booster
     * @returns {Object} Configuration du booster
     */
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

    /**
     * Détermine la rareté d'une carte en tenant compte du système de pitié
     * @private
     * @param {string} boosterType - Type de booster
     * @returns {string} Rareté déterminée
     */
    #determineCardRarity(boosterType) {
        const config = this.#getBoosterConfig(boosterType);

        // Vérification de la pitié, en commençant par la rareté la plus élevée
        // Pour être sûr de ne pas manquer une garantie
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

        this.#eventEmitter.emit(BoosterSystem.EVENTS.PITY_UPDATED, {
            counters: { ...this.#pityCounters }
        });
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
            pityCounters: { ...this.#pityCounters },
            boosterHistory: [...this.#boosterHistory],
            statistics: { ...this.#statistics }
        };
    }

    /**
     * Charge un état sauvegardé
     * @param {Object} saveData - Données de sauvegarde
     */
    load(saveData) {
        if (!saveData) return;

        this.#pityCounters = { ...saveData.pityCounters };
        this.#boosterHistory = [...saveData.boosterHistory];
        this.#statistics = { ...saveData.statistics };
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