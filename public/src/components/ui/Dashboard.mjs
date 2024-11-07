// src/modules/Dashboard.mjs
import {CurrencySystem} from "../../core/currency/CurrencySystem.mjs";

export class Dashboard {
    #container;
    #state;
    #currencyUpdateCallback;
    #clickHandler;

    constructor() {
        this.#state = {
            currency: 0,
            clickPower: 1,
            autoClickPower: 0
        };

        this.#currencyUpdateCallback = (data) => {
            this.#state.currency = data.newValue;
            this.#updateUI();
        };

        // Préparation de la référence pour le click handler
        this.#clickHandler = () => {
            window.currencySystem?.handleClick();
        };
    }

    init() {
        this.#container = document.getElementById('mainContent');
        if (!this.#container) {
            throw new Error('Container not found');
        }

        // Une seule souscription aux événements
        window.currencySystem?.on(
            CurrencySystem.EVENTS.CURRENCY_UPDATED,
            this.#currencyUpdateCallback
        );

        this.#render();
        this.#bindEvents();
    }

    #render() {
        this.#container.innerHTML = `
            <div class="dashboard">
                <div class="stats-container">
                    <div class="power-display">
                        <h2>Click Power</h2>
                        <p>${this.#state.clickPower}</p>
                    </div>
                </div>
                <div class="click-area">
                    <button id="clickButton" class="main-click-button">
                        Click Me!
                    </button>
                </div>
            </div>
        `;
    }

    #bindEvents() {
        const clickButton = document.getElementById('clickButton');
        if (clickButton) {
            clickButton.addEventListener('click', this.#clickHandler);
        }
    }

    #updateUI() {
        const currencyDisplay = document.getElementById('currencyAmount');
        if (currencyDisplay) {
            currencyDisplay.textContent = this.#state.currency;
        }
    }

    destroy() {
        window.currencySystem?.off(
            CurrencySystem.EVENTS.CURRENCY_UPDATED,
            this.#currencyUpdateCallback
        );

        const clickButton = document.getElementById('clickButton');
        if (clickButton) {
            clickButton.removeEventListener('click', this.#clickHandler);
        }
    }
}