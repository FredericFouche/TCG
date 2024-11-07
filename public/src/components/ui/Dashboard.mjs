// src/modules/Dashboard.mjs
export class Dashboard {
    #container;
    #state;

    constructor(containerId = 'mainContent') {
        this.#container = document.getElementById(containerId);
        if (!this.#container) {
            throw new Error('Container not found');
        }

        // État initial du dashboard
        this.#state = {
            currency: 0,
            clickPower: 1,
            autoClickPower: 0
        };
    }

    init() {
        this.#render();
        this.#bindEvents();
    }

    #render() {
        this.#container.innerHTML = `
            <div class="dashboard">
                <div class="stats-container">
                    <div class="currency-display">
                        <h2>Currency</h2>
                        <p id="currencyAmount">${this.#state.currency}</p>
                    </div>
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
            clickButton.addEventListener('click', () => this.#handleClick());
        }
    }

    #handleClick() {
        this.#state.currency += this.#state.clickPower;
        this.#updateUI();
    }

    #updateUI() {
        const currencyDisplay = document.getElementById('currencyAmount');
        if (currencyDisplay) {
            currencyDisplay.textContent = this.#state.currency;
        }
    }

    // Pour le nettoyage quand on quitte le dashboard
    destroy() {
        const clickButton = document.getElementById('clickButton');
        if (clickButton) {
            clickButton.removeEventListener('click', this.#handleClick);
        }
    }
}