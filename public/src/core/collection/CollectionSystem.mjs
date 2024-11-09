import { EventEmitter } from '../../utils/EventEmitter.mjs';
import {CardSystem} from "../cards/CardSystem.mjs";

export class CollectionSystem extends EventEmitter {
    static EVENTS = {
        STATS_UPDATED: 'collection:stats_updated',
        VIEW_FILTERED: 'collection:view_filtered',
        SORT_UPDATED: 'collection:sort_updated'
    };

    #cardSystem;
    #currentView = [];
    #currentSort = { field: 'rarity', direction: 'asc' };
    #currentFilter = {};

    constructor() {
        super();
        this.#cardSystem = window.cardSystem;
        if (!this.#cardSystem) {
            throw new Error('CardSystem is required for CollectionSystem');
        }
        this.#setupEventListeners();
    }

    #setupEventListeners() {
        this.#cardSystem.on(CardSystem.EVENTS.CARD_ADDED, ({card}) => {
            this.#updateView();
        });

        this.#cardSystem.on(CardSystem.EVENTS.CARD_REMOVED, ({cardId}) => {
            this.#updateView();
        });

        this.#cardSystem.on(CardSystem.EVENTS.CARD_UPDATED, ({card}) => {
            this.#updateView();
        });

        this.#cardSystem.on(CardSystem.EVENTS.COLLECTION_LOADED, () => {
            this.#updateView();
        });
    }

    getCardsView() {
        return this.#currentView;
    }

    getStats() {
        return this.#cardSystem.getStats();
    }

    setFilter(filter = {}) {
        this.#currentFilter = filter;
        this.#updateView();
    }

    setSort(field, direction = 'asc') {
        this.#currentSort = { field, direction };
        this.#updateView();
        this.emit(CollectionSystem.EVENTS.SORT_UPDATED, { field, direction });
    }

    #updateView() {
        // Récupérer les cartes avec les filtres actuels
        let cards = this.#cardSystem.getCards(this.#currentFilter);

        // Appliquer le tri
        cards.sort((a, b) => {
            let comparison = 0;
            switch (this.#currentSort.field) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'rarity':
                    const rarityOrder = {
                        common: 0,
                        uncommon: 1,
                        rare: 2,
                        epic: 3,
                        legendary: 4
                    };
                    comparison = rarityOrder[a.rarity] - rarityOrder[b.rarity];
                    break;
                case 'value':
                    comparison = a.getCurrentValue() - b.getCurrentValue();
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'acquiredDate':
                    comparison = a.acquiredDate.getTime() - b.acquiredDate.getTime();
                    break;
            }
            return this.#currentSort.direction === 'asc' ? comparison : -comparison;
        });

        this.#currentView = cards;
        this.emit(CollectionSystem.EVENTS.VIEW_FILTERED, {
            cards: this.#currentView,
            totalCards: cards.length,
            filter: this.#currentFilter,
            sort: this.#currentSort
        });

        const stats = this.getStats();
        this.emit(CollectionSystem.EVENTS.STATS_UPDATED, stats);
    }

    // Méthodes pour le SaveManager
    save() {
        return null;
    }

    load() {
        this.#updateView();
    }

    // Méthodes helpers pour les filtres courants
    filterByRarity(rarity) {
        this.setFilter({ rarity });
    }

    filterByValueRange(min, max) {
        this.setFilter({ minValue: min, maxValue: max });
    }

    filterLocked(locked = true) {
        this.setFilter({ locked });
    }

    clearFilters() {
        this.setFilter({});
    }
}