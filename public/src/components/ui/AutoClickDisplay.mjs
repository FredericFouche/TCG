import {AutoClickManager} from "../../features/auto-clicker/AutoClickManager.mjs";
import {NotificationSystem} from "../../utils/NotificationSystem.mjs";

export class AutoClickDisplay {
    #container;
    #state;
    #autoClickManager;
    #productionUpdateCallback;
    #generatorBoughtCallback;
    #notificationSystem;

    constructor() {
        this.#state = {
            totalProduction: 0,
            generators: []
        };

        this.#notificationSystem = NotificationSystem.getInstance();

        // Vos callbacks existants...
        this.#productionUpdateCallback = (data) => {
            this.#state.totalProduction = data.production;
            this.#state.generators = data.generators;
            this.#updateUI();
        };

        this.#generatorBoughtCallback = (data) => {
            this.#state.generators = this.#autoClickManager.generators;
            this.#render();

            // Notification de succès après un achat
            this.#notificationSystem.showSuccess(`Générateur ${data.id} amélioré au niveau ${data.level} !`);
        };
    }

    init() {
        this.#container = document.getElementById('mainContent');
        if (!this.#container) {
            throw new Error('Container not found');
        }

        // Correction de la casse
        this.#autoClickManager = window.autoClickManager;
        if (!this.#autoClickManager) {
            throw new Error('AutoClickManager not found in window');
        }

        // Initialisation du state avec les générateurs existants
        this.#state.generators = this.#autoClickManager.generators;

        // Souscription aux événements
        this.#autoClickManager.on(
            AutoClickManager.EVENTS.TICK,
            this.#productionUpdateCallback
        );

        this.#autoClickManager.on(
            AutoClickManager.EVENTS.GENERATOR_BOUGHT,
            this.#generatorBoughtCallback
        );

        this.#render();
        this.#bindEvents();
    }

    #render() {
        this.#container.innerHTML = `
            <div class="autoclicker-container">
                <h1 class="autoclicker-title">Auto Clickers</h1>
                <div class="production-total">
                    Production par seconde : ${this.#state.totalProduction}
                </div>
                <div class="generators-list">
                    ${this.#renderGenerators()}
                </div>
            </div>
        `;
    }

    destroy() {
        // Nettoyage des événements à la destruction
        this.#autoClickManager?.off(
            AutoClickManager.EVENTS.TICK,
            this.#productionUpdateCallback
        );
    }

    #renderGenerators() {
        if (!this.#state.generators.length) {
            return '<p>Aucun générateur disponible</p>';
        }

        return this.#state.generators.map(generator => `
        <div class="generator-card" data-generator-id="${generator.id}">
            <div class="generator-info">
                <h3 class="generator-title">Générateur ${generator.id}</h3>
                <p class="generator-desc">Niveau : ${generator.level}</p>
                <p class="generator-prod">Production : ${generator.currentProduction}/sec</p>
            </div>
            <div class="generator-actions">
                <button class="buy-generator-btn" 
                        data-generator-id="${generator.id}"
                        data-cost="${this.#calculateNextCost(generator)}">
                    Améliorer (${this.#calculateNextCost(generator)} )
                </button>
            </div>
        </div>
    `).join('');
    }

    #bindEvents() {
        this.#container.addEventListener('click', (e) => {
            if (e.target.classList.contains('buy-generator-btn')) {
                const generatorId = e.target.dataset.generatorId;
                const cost = parseInt(e.target.dataset.cost);

                const success = this.#autoClickManager.buyGenerator(generatorId);

                if (!success) {
                    e.target.classList.add('error');
                    setTimeout(() => e.target.classList.remove('error'), 500);

                    // Notification d'erreur
                    this.#notificationSystem.showError(
                        `Pas assez de ressources ! (Coût: ${cost})`
                    );
                }
            }
        });
    }

    #calculateNextCost(generator) {
        return Math.floor(generator.baseCost * Math.pow(1.15, generator.level));
    }

    #updateUI() {
        const productionElement = this.#container.querySelector('.production-total');
        if (productionElement) {
            productionElement.textContent = `Production par seconde : ${this.#state.totalProduction}`;
        }

        // Mettre à jour chaque générateur
        this.#state.generators.forEach(generator => {
            const card = this.#container.querySelector(`[data-generator-id="${generator.id}"]`);
            if (card) {
                card.querySelector('.generator-desc').textContent = `Niveau : ${generator.level}`;
                card.querySelector('.generator-prod').textContent = `Production : ${generator.currentProduction}/sec`;

                const button = card.querySelector('.buy-generator-btn');
                const nextCost = this.#calculateNextCost(generator);
                button.dataset.cost = nextCost;
                button.textContent = `Améliorer (${nextCost})`;
            }
        });
    }
}