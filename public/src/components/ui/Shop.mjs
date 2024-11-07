export class Shop {
    #container;
    #state;

    constructor(containerId = 'mainContent') {
        this.#container = document.getElementById(containerId);
        if (!this.#container) {
            throw new Error('Container not found');
        }

        // État initial du shop
        this.#state = {
        };
    }

    init() {
        this.#render();
    }

    #render() {
        this.#container.innerHTML = `
            <div class="shop-content">
                <h2 class="shop-title">Shop</h2>
                <div class="shop-items grid">
                    <div class="shop-item">
                        <h3 class="shop-item_title">Click Power</h3>
                        <p class="shop-item_cost">Cost: 10</p>
                        <p class="shop-item_description">Increase your click power by 1</p>
                        <button id="buyClickPower">Buy</button>
                    </div>
                    <div class="shop-item">
                        <h3 class="shop-item_title">Auto Click Power</h3>
                        <p class="shop-item_cost">Cost: 10</p>
                        <p class="shop-item_description">Increase your click power by 1</p>
                        <button id="buyAutoClickPower">Buy</button>
                    </div>
                </div>
            </div>
        `;
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

    // Pour le nettoyage quand on quitte le shop
    destroy() {
        const clickButton = document.getElementById('clickButton');
        if (clickButton) {
            clickButton.removeEventListener('click', this.#handleClick);
        }
    }
}