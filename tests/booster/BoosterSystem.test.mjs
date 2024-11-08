import { CardSystem } from '../../public/src/core/cards/CardSystem.mjs';
import { BoosterSystem } from '../../public/src/core/booster/BoosterSystem.mjs';

// Configuration initiale
let balance = 1000;
const cardSystem = new CardSystem();
const boosterSystem = new BoosterSystem(cardSystem);

const mockCurrency = {
    canSpend: (amount) => balance >= amount,
    spend: (amount) => {
        balance -= amount;
        updateUI();
    }
};

// Interface utilisateur
function updateUI() {
    document.getElementById('balance').textContent = balance;

    const stats = boosterSystem.getStatistics();
    document.getElementById('stats').innerHTML = `
        <p>Total ouvert: ${stats.totalOpened}</p>
        <p>Distribution:
            Common: ${stats.rarityDistribution.common},
            Uncommon: ${stats.rarityDistribution.uncommon},
            Rare: ${stats.rarityDistribution.rare},
            Epic: ${stats.rarityDistribution.epic},
            Legendary: ${stats.rarityDistribution.legendary}
        </p>
        <p>Pitié:
            Rare: ${stats.pityCounters.rare}/10,
            Epic: ${stats.pityCounters.epic}/20,
            Legendary: ${stats.pityCounters.legendary}/50
        </p>
    `;

    const history = boosterSystem.getHistory(5);
    document.getElementById('history').innerHTML = history.map(entry => `
        <p>${entry.type} - ${new Date(entry.openDate).toLocaleString()}</p>
        <small>${entry.cards.map(c => c.rarity).join(', ')}</small>
    `).join('');
}

function displayCards(cards) {
    document.getElementById('currentBooster').innerHTML = cards.map(card => `
        <div class="card ${card.rarity}">
            <h3>${card.name}</h3>
            <p>Rareté: ${card.rarity}</p>
        </div>
    `).join('');
}

function buyAndOpenBooster(type) {
    const booster = boosterSystem.purchaseBooster(type, mockCurrency);
    if (booster) {
        const cards = boosterSystem.openBooster(booster);
        displayCards(cards);
        updateUI();
    }
}

// Tests unitaires
const Tests = {
    async runAll() {
        const testOutput = document.getElementById('testOutput');
        testOutput.innerHTML = '';

        try {
            await this.testBoosterPurchase();
            await this.testBoosterOpening();
            await this.testPitySystem();
            await this.testStatistics();
            this.log('✨ Tous les tests ont réussi!', 'success');
        } catch (error) {
            this.log(`❌ Erreur: ${error.message}`, 'error');
        }
    },

    log(message, type = 'info') {
        const testOutput = document.getElementById('testOutput');
        testOutput.innerHTML += `<div class="${type}">${message}</div>`;
    },

    assert(condition, message) {
        if (!condition) {
            this.log(`❌ ${message}`, 'error');
            throw new Error(message);
        }
        this.log(`✅ ${message}`, 'success');
    },

    async testBoosterPurchase() {
        this.log('📦 Test Purchase');
        const testCardSystem = new CardSystem();
        const testBoosterSystem = new BoosterSystem(testCardSystem);

        const mockCurrency = {
            canSpend: () => true,
            spend: () => {}
        };

        const basicBooster = testBoosterSystem.purchaseBooster('basic', mockCurrency);
        this.assert(basicBooster !== null, 'Should create basic booster');
        this.assert(basicBooster.type === 'basic', 'Should be basic type');
        this.assert(!basicBooster.opened, 'Should not be opened');

        const poorCurrency = {
            canSpend: () => false,
            spend: () => {}
        };
        const failedBooster = testBoosterSystem.purchaseBooster('basic', poorCurrency);
        this.assert(failedBooster === null, 'Should fail when not enough currency');
    },

    async testBoosterOpening() {
        this.log('📦 Test Opening');
        const testCardSystem = new CardSystem();
        const testBoosterSystem = new BoosterSystem(testCardSystem);
        const mockCurrency = {
            canSpend: () => true,
            spend: () => {}
        };

        const basicBooster = testBoosterSystem.purchaseBooster('basic', mockCurrency);
        const basicCards = testBoosterSystem.openBooster(basicBooster);
        this.assert(basicCards.length === 5, 'Basic should give 5 cards');
        this.assert(basicBooster.opened, 'Should be marked as opened');

        const reopenedCards = testBoosterSystem.openBooster(basicBooster);
        this.assert(reopenedCards === null, 'Should not reopen booster');
    },

    async testPitySystem() {
        this.log('📦 Test Pity System');
        const testCardSystem = new CardSystem();
        const testBoosterSystem = new BoosterSystem(testCardSystem);
        const mockCurrency = {
            canSpend: () => true,
            spend: () => {}
        };

        for (let i = 0; i < 50; i++) {
            const booster = testBoosterSystem.purchaseBooster('basic', mockCurrency);
            testBoosterSystem.openBooster(booster);
        }

        const stats = testBoosterSystem.getStatistics();
        this.assert(stats.totalOpened === 50, 'Should track total opened');

        // Vérifie qu'au moins une légendaire a été obtenue (via pitié)
        this.assert(stats.rarityDistribution.legendary > 0, 'Should have obtained at least one legendary');
    },

    async testStatistics() {
        this.log('📦 Test Statistics');
        const testCardSystem = new CardSystem();
        const testBoosterSystem = new BoosterSystem(testCardSystem);
        const mockCurrency = {
            canSpend: () => true,
            spend: () => {}
        };

        for (let i = 0; i < 10; i++) {
            const booster = testBoosterSystem.purchaseBooster('basic', mockCurrency);
            testBoosterSystem.openBooster(booster);
        }

        const stats = testBoosterSystem.getStatistics();
        const history = testBoosterSystem.getHistory(5);

        this.assert(stats.totalOpened === 10, 'Should track total opened');
        this.assert(history.length === 5, 'Should limit history');
        this.assert(typeof stats.rarityDistribution === 'object', 'Should track rarity distribution');
    }
};

// Event listeners
document.getElementById('buyBasic').addEventListener('click',
    () => buyAndOpenBooster('basic'));
document.getElementById('buyPremium').addEventListener('click',
    () => buyAndOpenBooster('premium'));
document.getElementById('runTests').addEventListener('click',
    () => Tests.runAll());

// Initial UI update
updateUI();