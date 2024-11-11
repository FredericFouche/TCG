import {CollectionSystem} from "../../core/collection/CollectionSystem.mjs";

export class CollectionDisplay {
    #container;
    #collectionSystem;

    constructor(containerId) {
        this.#container = document.getElementById(containerId);
        if (!this.#container) {
            throw new Error(`Container with id ${containerId} not found`);
        }

        this.#collectionSystem = window.collectionSystem;
        if (!this.#collectionSystem) {
            throw new Error('Collection system not found');
        }
    }

    init() {
        this.#setupEventListeners();
        this.render();
    }

    destroy() {
        if (this.#collectionSystem) {
            this.#collectionSystem.off(CollectionSystem.EVENTS.STATS_UPDATED, this.render);
            this.#collectionSystem.off(CollectionSystem.EVENTS.VIEW_FILTERED, this.render);
        }
        this.#container.innerHTML = '';
    }

    #setupEventListeners() {
        // Bind pour conserver le contexte
        this.render = this.render.bind(this);

        // Écouter les événements du système de collection
        this.#collectionSystem.on(CollectionSystem.EVENTS.STATS_UPDATED, this.render);
        this.#collectionSystem.on(CollectionSystem.EVENTS.VIEW_FILTERED, this.render);
    }

    render() {
        const cards = this.#collectionSystem.getCardsView();
        const stats = this.#collectionSystem.getStats();

        this.#container.innerHTML = `
            <div class="collection-container">
                <div class="collection-stats">
                    <h2>Statistiques de Collection</h2>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Total des cartes :</span>
                            <span class="stat-value">${stats.totalCards}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Cartes uniques :</span>
                            <span class="stat-value">${stats.uniqueCards}</span>
                        </div>
                        ${Object.entries(stats.byRarity).map(([rarity, count]) => `
                            <div class="stat-item">
                                <span class="stat-label">${rarity} :</span>
                                <span class="stat-value">${count}</span>
                            </div>
                        `).join('')}
                        <div class="stat-item">
                            <span class="stat-label">Valeur totale :</span>
                            <span class="stat-value">${stats.totalValue}</span>
                        </div>
                    </div>
                </div>
                
                <div class="collection-cards">
                    <h2>Vos Cartes</h2>
                    <div class="cards-grid">
                        ${cards.map(card => `
                            <div class="card ${card.rarity}" data-card-id="${card.id}">
                                <div class="card-header">
                                    <h3>${card.name}</h3>
                                    <span class="card-amount">${card.amount}</span>
                                </div>
                                <div class="card-content">
                                    <p class="card-description">${card.description}</p>
                                    <p class="card-rarity">${card.rarity}</p>
                                    <p class="card-value">¤ ${card.getCurrentValue()}</p>
                                </div>
                                ${card.isLocked ? '<div class="card-locked">🔒</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}