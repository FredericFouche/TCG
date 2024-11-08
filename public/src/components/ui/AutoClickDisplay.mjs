import {AutoClickManager} from "../../features/auto-clicker/AutoClickManager.mjs";
import {NotificationSystem} from "../../utils/NotificationSystem.mjs";

export class AutoClickDisplay {
    #container;
    #state;
    #autoClickManager;
    #generatorBoughtCallback;
    #notificationSystem;

    constructor() {
        this.#state = {
            totalProduction: 0,
            generators: []
        };

        this.#notificationSystem = NotificationSystem.getInstance();
        this.#autoClickManager = window.autoClickManager;

        this.#productionUpdateCallback = (data) => {
            this.#state.totalProduction = data.production;
            this.#state.generators = this.#autoClickManager.generators;
            this.#updateUI();
        };

        this.#generatorBoughtCallback = ({generator}) => {
            this.#state.generators = this.#autoClickManager.generators;
            this.#updateUI();
            this.#notificationSystem.showSuccess(`Générateur ${generator.id} amélioré au niveau ${generator.level} !`);
        };
    }

    init() {
        this.#container = document.getElementById('mainContent');
        if (!this.#container) {
            throw new Error('Container not found');
        }

        this.#autoClickManager = window.autoClickManager;
        if (!this.#autoClickManager) {
            throw new Error('AutoClickManager not found in window');
        }


        this.#state.totalProduction = this.#autoClickManager.totalProductionPerSecond;
        this.#state.generators = this.#autoClickManager.generators;


        this.#autoClickManager.on(AutoClickManager.EVENTS.TICK, this.#productionUpdateCallback);
        this.#autoClickManager.on(AutoClickManager.EVENTS.GENERATOR_BOUGHT, this.#generatorBoughtCallback);
        this.#autoClickManager.on(AutoClickManager.EVENTS.GENERATOR_ADDED, (data) => {
            this.#state.generators = this.#autoClickManager.generators;
            this.#updateUI();
        });
        this.#autoClickManager.on(AutoClickManager.EVENTS.PRODUCTION_UPDATED, this.#productionUpdateCallback);

        this.#render();
        this.#bindEvents();
    }

    #render() {
        const generatorsHtml = this.#renderGenerators();

        this.#container.innerHTML = `
            <div class="autoclicker-container">
                <h1 class="autoclicker-title">Auto Clickers</h1>
                <div class="production-total">
                    Production par seconde : ${this.#formatNumber(this.#state.totalProduction)}
                </div>
                <div class="generators-list">
                    ${generatorsHtml}
                </div>
            </div>
        `;
    }

    #renderGenerators() {
        const generators = this.#state.generators;

        if (!generators || generators.length === 0) {
            return '<p>Aucun générateur disponible</p>';
        }

        return generators.map(generator => `
            <div class="generator-card" data-generator-id="${generator.id}">
                <div class="generator-info">
                    <h3 class="generator-title">${generator.id}</h3>
                    <p class="generator-level">Niveau : ${generator.level}</p>
                    <p class="generator-desc">${generator.description || ''}</p>
                    <p class="generator-prod">Production : ${this.#formatNumber(generator.currentProduction)}/sec</p>
                </div>
                <div class="generator-actions">
                    <button class="buy-generator-btn" 
                            data-generator-id="${generator.id}"
                            data-cost="${this.#calculateNextCost(generator)}">
                        Améliorer (${this.#formatNumber(this.#calculateNextCost(generator))} ¤)
                    </button>
                </div>
            </div>
        `).join('');
    }

    #formatNumber(number) {
        if (number === undefined || number === null || isNaN(number)) {
            return this.#formatNumber(this.#state.totalProduction || 0);
        }

        const num = Number(number);
        if (isNaN(num)) {
            return this.#formatNumber(this.#state.totalProduction || 0);
        }

        if (num < 1000) {
            return num.toFixed(0);
        }

        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const magnitude = Math.floor(Math.log10(num) / 3);
        const scaled = num / Math.pow(1000, magnitude);
        return `${scaled.toFixed(1)}${suffixes[Math.min(magnitude, suffixes.length - 1)]}`;
    }

    #updateUI() {
        const productionElement = this.#container.querySelector('.production-total');
        if (productionElement) {
            const production = this.#state.totalProduction;
            productionElement.textContent = `Production par seconde : ${this.#formatNumber(production)}`;
        }

        this.#state.generators.forEach(generator => {
            const card = this.#container.querySelector(`[data-generator-id="${generator.id}"]`);
            if (card) {
                const level = generator.level;
                const production = generator.currentProduction;
                const nextCost = this.#calculateNextCost(generator);

                card.querySelector('.generator-level').textContent = `Niveau : ${level}`;
                card.querySelector('.generator-prod').textContent =
                    `Production : ${this.#formatNumber(production)}/sec`;

                const button = card.querySelector('.buy-generator-btn');
                if (button) {
                    button.dataset.cost = nextCost;
                    button.textContent = `Améliorer (${this.#formatNumber(nextCost)} ¤)`;
                }
            }
        });
    }

    #bindEvents() {
        this.#container.addEventListener('click', (e) => {
            if (e.target.classList.contains('buy-generator-btn')) {
                const generatorId = e.target.dataset.generatorId;
                const cost = parseInt(e.target.dataset.cost);

                if (!window.currencySystem.canSpend(cost)) {
                    e.target.classList.add('error');
                    setTimeout(() => e.target.classList.remove('error'), 500);
                    this.#notificationSystem.showError(`Pas assez de ressources ! (Coût: ${this.#formatNumber(cost)} ¤)`);
                    return;
                }

                const success = this.#autoClickManager.buyGenerator(generatorId);
                if (!success) {
                    this.#notificationSystem.showError('Erreur lors de l\'achat du générateur');
                }
            }
        });
    }

    #productionUpdateCallback = (data) => {
        const newProduction = data?.production;
        if (typeof newProduction === 'number' && !isNaN(newProduction)) {
            this.#state.totalProduction = newProduction;
        }

        const newGenerators = this.#autoClickManager.generators;
        if (Array.isArray(newGenerators) && newGenerators.length > 0) {
            this.#state.generators = newGenerators;
        }

        this.#updateUI();
    };

    #calculateNextCost(generator) {
        return Math.floor(generator.baseCost * Math.pow(1.15, generator.level));
    }

    destroy() {
        this.#autoClickManager?.off(AutoClickManager.EVENTS.TICK, this.#productionUpdateCallback);
        this.#autoClickManager?.off(AutoClickManager.EVENTS.GENERATOR_BOUGHT, this.#generatorBoughtCallback);
        this.#autoClickManager?.off(AutoClickManager.EVENTS.PRODUCTION_UPDATED, this.#productionUpdateCallback);
    }
}