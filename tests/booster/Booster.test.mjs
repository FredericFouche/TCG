import { Card } from '../../public/src/core/cards/Card.mjs';
import { CardSystem } from '../../public/src/core/cards/CardSystem.mjs';
import { Booster } from '../../public/src/core/booster/Booster.mjs';

// Configuration initiale pour la démo
let balance = 1000;
const cardSystem = new CardSystem();

// Mock du système monétaire pour la démo
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
}

function displayBooster(booster) {
    const display = document.getElementById('currentBooster');
    if (!booster || !booster.cards) {
        display.innerHTML = '<p>Aucun booster ouvert</p>';
        return;
    }

    display.innerHTML = booster.cards.map(card => `
        <div class="card ${card.rarity}">
            <h3>${card.name}</h3>
            <p>Rareté: ${card.rarity}</p>
            <p>Valeur: ${card.getCurrentValue()}¤</p>
        </div>
    `).join('');
}

// Tests unitaires
const Tests = {
    async runAll() {
        const testOutput = document.getElementById('testOutput');
        testOutput.innerHTML = '';

        try {
            await this.testConstructor();
            await this.testGetters();
            await this.testCardManagement();
            await this.testTypeValidation();
            await this.testSerialization();
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
            throw new Error(message);
        }
        this.log(`✅ ${message}`, 'success');
    },

    async testConstructor() {
        this.log('🔨 Test du Constructeur', 'info');

        // Test constructeur normal
        const booster = new Booster(Booster.TYPES.BASIC);
        this.assert(booster instanceof Booster, 'Crée une instance de Booster');
        this.assert(typeof booster.id === 'string', 'Génère un ID unique');
        this.assert(booster.purchaseDate instanceof Date, 'Initialise la date d\'achat');

        // Test type invalide
        try {
            new Booster('invalid_type');
            throw new Error('Devrait échouer avec un type invalide');
        } catch (error) {
            this.assert(error.message.includes('invalide'), 'Rejette les types invalides');
        }
    },

    async testGetters() {
        this.log('📖 Test des Getters', 'info');

        const booster = new Booster(Booster.TYPES.BASIC);

        // Test des getters de base
        this.assert(booster.type === Booster.TYPES.BASIC, 'Getter type fonctionne');
        this.assert(booster.isOpened === false, 'Getter isOpened initial correct');
        this.assert(booster.cards === null, 'Getter cards initial correct');
        this.assert(booster.cost === Booster.CONFIGS[Booster.TYPES.BASIC].cost, 'Getter cost correct');
        this.assert(booster.cardCount === Booster.CONFIGS[Booster.TYPES.BASIC].cardCount, 'Getter cardCount correct');

        // Test de l'immutabilité des poids
        const weights1 = booster.weights;
        const weights2 = booster.weights;
        weights1.common = 999;
        this.assert(weights2.common !== 999, 'Les poids sont immutables');
    },

    async testCardManagement() {
        this.log('🎴 Test de la Gestion des Cartes', 'info');

        const booster = new Booster(Booster.TYPES.BASIC);
        const testCards = Array(5).fill(null).map((_, i) => new Card({
            id: `test-${i}`,
            name: `Test Card ${i}`,
            rarity: 'common'
        }));

        // Test setCards
        booster.setCards(testCards);
        this.assert(booster.isOpened === true, 'Marque le booster comme ouvert');
        this.assert(booster.cards.length === testCards.length, 'Stocke le bon nombre de cartes');

        // Test protection contre la modification
        const cards = booster.cards;
        cards.push(new Card({ id: 'extra', name: 'Extra', rarity: 'common' }));
        this.assert(booster.cards.length === testCards.length, 'Les cartes sont protégées contre la modification');

        // Test double ouverture
        try {
            booster.setCards(testCards);
            throw new Error('Devrait échouer à la réouverture');
        } catch (error) {
            this.assert(error.message.includes('déjà été ouvert'), 'Empêche la réouverture');
        }
    },

    async testTypeValidation() {
        this.log('🔍 Test de la Validation des Types', 'info');

        // Test tous les types valides
        Object.values(Booster.TYPES).forEach(type => {
            try {
                const booster = new Booster(type);
                this.assert(booster.type === type, `Type ${type} accepté`);
            } catch (error) {
                throw new Error(`Type valide ${type} rejeté`);
            }
        });

        // Test configurations
        Object.values(Booster.TYPES).forEach(type => {
            const booster = new Booster(type);
            const config = Booster.CONFIGS[type];
            this.assert(typeof config.cardCount === 'number', `Configuration cardCount existe pour ${type}`);
            this.assert(typeof config.cost === 'number', `Configuration cost existe pour ${type}`);
            this.assert(typeof config.weights === 'object', `Configuration weights existe pour ${type}`);
        });
    },

    async testSerialization() {
        this.log('💾 Test de la Sérialisation', 'info');

        const booster = new Booster(Booster.TYPES.BASIC);
        const testCards = Array(5).fill(null).map((_, i) => new Card({
            id: `test-${i}`,
            name: `Test Card ${i}`,
            rarity: 'common'
        }));
        booster.setCards(testCards);

        // Test toJSON
        const json = booster.toJSON();
        this.assert(json.id === booster.id, 'Sérialise l\'ID correctement');
        this.assert(json.type === booster.type, 'Sérialise le type correctement');
        this.assert(Array.isArray(json.cards), 'Sérialise les cartes correctement');
        this.assert(json.opened === true, 'Sérialise l\'état ouvert correctement');

        // Test fromJSON
        const restored = Booster.fromJSON(json, cardSystem);
        this.assert(restored instanceof Booster, 'Crée une instance de Booster');
        this.assert(restored.id === booster.id, 'Restaure l\'ID correctement');
        this.assert(restored.type === booster.type, 'Restaure le type correctement');
        this.assert(restored.isOpened === booster.isOpened, 'Restaure l\'état ouvert correctement');
    }
};

// Event listeners pour la démo
document.getElementById('runTests').addEventListener('click', () => Tests.runAll());
document.getElementById('buyBasic').addEventListener('click', () => {
    if (mockCurrency.canSpend(100)) {
        mockCurrency.spend(100);
        const booster = new Booster(Booster.TYPES.BASIC);
        // Simulation d'ouverture
        const testCards = Array(5).fill(null).map((_, i) => new Card({
            id: `test-${i}`,
            name: `Card ${i}`,
            rarity: Math.random() > 0.7 ? 'rare' : 'common'
        }));
        booster.setCards(testCards);
        displayBooster(booster);
    }
});

document.getElementById('buyPremium').addEventListener('click', () => {
    if (mockCurrency.canSpend(250)) {
        mockCurrency.spend(250);
        const booster = new Booster(Booster.TYPES.PREMIUM);
        // Simulation d'ouverture
        const testCards = Array(10).fill(null).map((_, i) => new Card({
            id: `test-${i}`,
            name: `Card ${i}`,
            rarity: Math.random() > 0.6 ? 'rare' : 'common'
        }));
        booster.setCards(testCards);
        displayBooster(booster);
    }
});

// Initial UI update
updateUI();