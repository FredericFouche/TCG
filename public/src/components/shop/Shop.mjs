// Définition des types d'items disponibles dans la boutique
const SHOP_ITEM_TYPES = {
    BOOSTER_PACK: 'boosterPack',
    UPGRADE: 'upgrade'
};

const SHOP_ITEMS = [
    {
        id: 'basicBooster',
        type: SHOP_ITEM_TYPES.BOOSTER_PACK,
        title: 'Basic Booster',
        description: '5 cartes avec au moins 1 rare garantie',
        baseCost: 100,
        level: 1,
        maxLevel: 5,
        costMultiplier: 1,
        effect: {
            type: 'boosterPack',
            boosterType: 'basic'
        }
    },
    {
        id: 'premiumBooster',
        type: SHOP_ITEM_TYPES.BOOSTER_PACK,
        title: 'Premium Booster',
        description: '10 cartes avec meilleurs taux de rareté',
        baseCost: 250,
        level: 1,
        maxLevel: 10,
        costMultiplier: 1,
        effect: {
            type: 'boosterPack',
            boosterType: 'premium'
        }
    },
    {
        id: 'specialBooster',
        type: SHOP_ITEM_TYPES.BOOSTER_PACK,
        title: 'Special Booster',
        description: '5 cartes de rareté supérieure garanties',
        baseCost: 500,
        level: 1,
        maxLevel: 15,
        costMultiplier: 1,
        effect: {
            type: 'boosterPack',
            boosterType: 'special'
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