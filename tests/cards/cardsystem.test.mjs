import { Card } from '../../public/src/core/cards/Card.mjs';
import { CardSystem } from '../../public/src/core/cards/CardSystem.mjs';

const test = {
    results: { passed: 0, failed: 0 },
    testPromises: [],

    assert(condition, message) {
        if (!condition) throw new Error(message);
    },

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}\nAttendu: ${expected}\nReçu: ${actual}`);
        }
    },

    async run(name, fn) {
        const testPromise = (async () => {
            try {
                await fn();
                console.log(`✅ ${name}`);
                this.results.passed++;
            } catch (error) {
                console.error(`❌ ${name}:`);
                console.error(`   ${error.message}`);
                this.results.failed++;
            }
        })();

        this.testPromises.push(testPromise);
        return testPromise;
    },

    async summary() {
        await Promise.all(this.testPromises);

        console.log('\n=== Résumé des Tests ===');
        console.log(`✅ Réussis: ${this.results.passed}`);
        console.log(`❌ Échoués: ${this.results.failed}`);
        console.log('====================\n');
    }
};

function clearStorage() {
    localStorage.clear();
}

function createTestCard(id = 'test-1', rarity = Card.RARITY.COMMON) {
    return new Card({
        id,
        name: `Test Card ${id}`,
        rarity,
        baseValue: 100
    });
}

function cleanupTest() {
    clearStorage();
}

test.run('Initialisation du CardSystem', () => {
    clearStorage();
    const system = new CardSystem();
    test.assert(system instanceof CardSystem, 'Devrait être une instance de CardSystem');
    test.assertEqual(system.getCards().length, 0, 'Devrait commencer avec une collection vide');
    cleanupTest();
});

test.run('Ajout de cartes', () => {
    clearStorage();
    const system = new CardSystem();
    const card = createTestCard();

    // Test ajout simple
    let eventFired = false;
    system.on(CardSystem.EVENTS.CARD_ADDED, () => eventFired = true);

    const result = system.addCard(card);
    test.assert(result, 'Devrait retourner true pour un nouvel ajout');
    test.assert(eventFired, 'Devrait émettre l\'événement CARD_ADDED');
    test.assertEqual(system.getCards().length, 1, 'Devrait avoir une carte');

    eventFired = false;
    system.on(CardSystem.EVENTS.CARD_UPDATED, () => eventFired = true);

    const result2 = system.addCard(card);
    test.assert(!result2, 'Devrait retourner false pour une mise à jour');
    test.assert(eventFired, 'Devrait émettre l\'événement CARD_UPDATED');
    test.assertEqual(system.getCard(card.id).amount, 2, 'Devrait avoir mis à jour la quantité');
    cleanupTest();
});

test.run('Suppression de cartes', () => {
    clearStorage();
    const system = new CardSystem();
    const card = createTestCard();
    card.addCopy(1);
    system.addCard(card);

    let eventFired = false;
    system.on(CardSystem.EVENTS.CARD_UPDATED, () => eventFired = true);

    const result = system.removeCard(card.id, 1);
    test.assert(result, 'Devrait réussir la suppression partielle');
    test.assert(eventFired, 'Devrait émettre l\'événement CARD_UPDATED');

    eventFired = false;
    system.on(CardSystem.EVENTS.CARD_REMOVED, () => eventFired = true);

    const result2 = system.removeCard(card.id);
    test.assert(result2, 'Devrait réussir la suppression complète');
    test.assert(eventFired, 'Devrait émettre l\'événement CARD_REMOVED');
    test.assertEqual(system.getCards().length, 0, 'Collection devrait être vide');
    cleanupTest();
});

test.run('Filtrage des cartes', () => {
    clearStorage();
    const system = new CardSystem();

    system.addCard(createTestCard('common-1', Card.RARITY.COMMON));
    system.addCard(createTestCard('rare-1', Card.RARITY.RARE));
    system.addCard(createTestCard('rare-2', Card.RARITY.RARE));
    system.addCard(createTestCard('epic-1', Card.RARITY.EPIC));

    const rares = system.getCards({ rarity: Card.RARITY.RARE });
    test.assertEqual(rares.length, 2, 'Devrait trouver 2 cartes rares');

    const highValue = system.getCards({ minValue: 1000 });
    test.assert(highValue.length > 0, 'Devrait trouver des cartes de haute valeur');
    cleanupTest();
});

test.run('Calcul des statistiques', () => {
    clearStorage();
    const system = new CardSystem();

    system.addCard(createTestCard('common-1', Card.RARITY.COMMON));
    system.addCard(createTestCard('rare-1', Card.RARITY.RARE));

    const stats = system.getStats();
    test.assertEqual(stats.uniqueCards, 2, 'Devrait avoir 2 cartes uniques');
    test.assertEqual(stats.totalCards, 2, 'Devrait avoir 2 cartes au total');
    test.assert(stats.totalValue > 0, 'Devrait avoir une valeur totale positive');
    test.assert(stats.byRarity[Card.RARITY.COMMON] === 1, 'Devrait avoir 1 carte commune');
    cleanupTest();
});

test.run('Persistance des données', async () => {
    clearStorage();

    // Création et sauvegarde
    const firstSystem = new CardSystem();
    await firstSystem.initialized;  // attendre l'initialisation
    const card = createTestCard('test-persistence');
    firstSystem.addCard(card);

    // Attendre la sauvegarde
    await new Promise(resolve => setTimeout(resolve, 50));

    // Vérifier le storage
    const storageCheck = localStorage.getItem('cardCollection');
    if (!storageCheck) {
        throw new Error('Les données ont disparu du localStorage');
    }

    // Création du nouveau système
    const newSystem = new CardSystem();
    await newSystem.initialized;  // attendre l'initialisation

    // Vérification
    const cards = newSystem.getCards();
    test.assertEqual(cards.length, 1, 'Devrait avoir chargé une carte');
    test.assertEqual(cards[0].id, 'test-persistence', 'Devrait avoir la bonne carte');

    clearStorage();
});

test.run('Nettoyage de la collection', () => {
    clearStorage();
    const system = new CardSystem();
    system.addCard(createTestCard());

    let eventFired = false;
    system.on(CardSystem.EVENTS.COLLECTION_CLEARED, () => eventFired = true);

    const result = system.clearCollection();
    test.assert(result, 'Devrait réussir le nettoyage');
    test.assert(eventFired, 'Devrait émettre l\'événement COLLECTION_CLEARED');
    test.assertEqual(system.getCards().length, 0, 'Devrait avoir une collection vide');
    test.assertEqual(localStorage.getItem('cardCollection'), null, 'Devrait avoir vidé le localStorage');
    cleanupTest();
});

// Test des événements
test.run('Gestion des événements', () => {
    clearStorage();
    const system = new CardSystem();
    let eventCount = 0;

    const handler = () => eventCount++;
    system.on(CardSystem.EVENTS.CARD_ADDED, handler);

    system.addCard(createTestCard('test-1'));
    system.addCard(createTestCard('test-2'));

    test.assertEqual(eventCount, 2, 'Devrait avoir déclenché 2 événements');

    system.off(CardSystem.EVENTS.CARD_ADDED, handler);
    system.addCard(createTestCard('test-3'));

    test.assertEqual(eventCount, 2, 'Ne devrait pas avoir déclenché d\'événement supplémentaire');
    cleanupTest();
})

test.summary().catch(console.error);