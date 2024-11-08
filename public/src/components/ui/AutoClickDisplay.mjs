import {AutoClickManager} from "../../features/auto-clicker/AutoClickManager.mjs";

export class AutoClickDisplay {
    #container;
    #state;
    #autoClickManager;
    #productionUpdateCallback;
    #generatorBoughtCallback;

    constructor() {
        this.#state = {
            totalProduction: 0,
            generators: [] // Liste des générateurs et leurs états
        };

        // Callbacks pour les événements
        this.#productionUpdateCallback = (data) => {
            this.#state.totalProduction = data.production;
            this.#state.generators = data.generators;
            this.#updateUI();
        };

        this.#generatorBoughtCallback = (data) => {
            // Mise à jour du state avec les nouvelles données
            this.#state.generators = this.#autoClickManager.generators;
            this.#render(); // Re-render complet pour mettre à jour l'UI
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
                <h1>Auto Clickers</h1>
                <div class="production-total">
                    Production par seconde : ${this.#state.totalProduction}
                </div>
                <div class="generators-list">
                    ${this.#renderGenerators()}
                </div>
            </div>
        `;
    }

    #updateUI() {
        // Mise à jour de l'interface quand l'état change
        const productionElement = this.#container.querySelector('.production-total');
        if (productionElement) {
            productionElement.textContent = `Production par seconde : ${this.#state.totalProduction}`;
        }
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
                <h3>Générateur ${generator.id}</h3>
                <p>Niveau : ${generator.level}</p>
                <p>Production : ${generator.currentProduction}/sec</p>
            </div>
            <div class="generator-actions">
                <button class="buy-generator-btn" 
                        data-generator-id="${generator.id}"
                        data-cost="${this.#calculateNextCost(generator)}">
                    Améliorer (${this.#calculateNextCost(generator)} coins)
                </button>
            </div>
        </div>
    `).join('');
    }

    #bindEvents() {
        const buyButtons = this.#container.querySelectorAll('.buy-generator-btn');

        buyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const generatorId = e.target.dataset.generatorId;

                const success = this.#autoClickManager.buyGenerator(generatorId);

                if (!success) {
                    button.classList.add('error');
                    setTimeout(() => button.classList.remove('error'), 500);
                }
            });
        });
    }

    #calculateNextCost(generator) {
        return Math.floor(generator.baseCost * Math.pow(1.15, generator.level));
    }
}