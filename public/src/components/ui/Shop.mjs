// Définition des types d'items disponibles dans la boutique
const SHOP_ITEM_TYPES = {
    CLICK_POWER: 'clickPower',
    AUTO_CLICK: 'autoClick',
    BOOSTER_PACK: 'boosterPack',
    UPGRADE: 'upgrade'
};

// Configuration des items de la boutique
const SHOP_ITEMS = [
    {
        id: 'clickPower1',
        type: SHOP_ITEM_TYPES.CLICK_POWER,
        title: 'Click Power',
        description: 'Increase your click power by 1',
        baseCost: 10,
        level: 1,
        maxLevel: 10,
        costMultiplier: 1.5,
        effect: {
            power: 1,
            type: 'additive'
        }
    },
    {
        id: 'autoClick1',
        type: SHOP_ITEM_TYPES.AUTO_CLICK,
        title: 'Auto Clicker',
        description: 'Generates 1 click per second',
        baseCost: 50,
        level: 1,
        maxLevel: 5,
        costMultiplier: 2,
        effect: {
            clicksPerSecond: 1
        }
    },
    {
        id: 'boosterPack1',
        type: SHOP_ITEM_TYPES.BOOSTER_PACK,
        title: 'Booster Pack',
        description: 'Get random Cards',
        baseCost: 100,
        level: 1,
        maxLevel: 15,
        costMultiplier: 1.25,
        effect: {
            type: 'boosterPack'
        }
    },
    {
        id: 'upgrade1',
        type: SHOP_ITEM_TYPES.UPGRADE,
        title: 'Upgrade',
        description: 'Upgrade your cards',
        baseCost: 1000,
        level: 1,
        maxLevel: 5,
        costMultiplier: 2,
        effect: {
            type: 'upgrade'
        }
    }
];

export class Shop {
    #container;
    #items;
    #callbacks;

    constructor(containerId = 'mainContent', callbacks = {}) {
        this.#container = document.getElementById(containerId);
        if (!this.#container) {
            throw new Error('Container not found');
        }

        // Copie profonde des items du shop pour pouvoir les modifier
        this.#items = structuredClone(SHOP_ITEMS);

        // Callbacks pour interagir avec le GameState
        this.#callbacks = {
            onPurchase: callbacks.onPurchase || (() => {}),
            canAfford: callbacks.canAfford || (() => true),
            getCurrentLevel: callbacks.getCurrentLevel || (() => 1)
        };
    }

    init() {
        this.#render();
        this.#attachEventListeners();
    }

    #generateItemHTML(item) {
        const currentLevel = this.#callbacks.getCurrentLevel(item.id);
        const cost = this.#calculateCost(item, currentLevel);
        const canAfford = this.#callbacks.canAfford(cost);
        const isMaxLevel = currentLevel >= item.maxLevel;

        return `
            <div class="shop-item glass" data-item-id="${item.id}">
                <h3 class="shop-item_title">${item.title}</h3>
                <p class="shop-item_level">Level: ${currentLevel}/${item.maxLevel}</p>
                <p class="shop-item_cost">${cost} ¤</p>
                <p class="shop-item_description">${item.description}</p>
                <button 
                    class="shop-item_button" 
                    ${!canAfford || isMaxLevel ? 'disabled' : ''}
                    data-item-id="${item.id}"
                >
                    ${isMaxLevel ? 'Max Level' : 'Buy'}
                </button>
            </div>
        `;
    }

    #calculateCost(item, currentLevel) {
        return Math.floor(item.baseCost * Math.pow(item.costMultiplier, currentLevel - 1));
    }

    #render() {
        this.#container.innerHTML = `
            <div class="shop-content">
                <h2 class="shop-title">Shop</h2>
                <div class="shop-items grid">
                    ${this.#items.map(item => this.#generateItemHTML(item)).join('')}
                </div>
            </div>
        `;
    }

    #attachEventListeners() {
        this.#container.querySelectorAll('.shop-item_button').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.dataset.itemId;
                const item = this.#items.find(i => i.id === itemId);
                if (item) {
                    this.#handlePurchase(item);
                }
            });
        });
    }

    #handlePurchase(item) {
        const currentLevel = this.#callbacks.getCurrentLevel(item.id);
        const cost = this.#calculateCost(item, currentLevel);

        if (this.#callbacks.canAfford(cost) && currentLevel < item.maxLevel) {
            this.#callbacks.onPurchase({
                itemId: item.id,
                cost: cost,
                effect: item.effect,
                newLevel: currentLevel + 1
            });

            this.#render();
            this.#attachEventListeners();
        }
    }

    destroy() {
        this.#container.innerHTML = '';
    }
}