import { Card } from '../../public/src/core/cards/card.mjs';

const test = {
    results: { passed: 0, failed: 0 },
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    },
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}\nAttendu: ${expected}\nReçu: ${actual}`);
        }
    },
    run(name, fn) {
        try {
            fn();
            console.log(`✅ ${name}`);
            this.results.passed++;
        } catch (error) {
            console.error(`❌ ${name}:`);
            console.error(`   ${error.message}`);
            this.results.failed++;
        }
    },
    summary() {
        console.log('\n=== Résumé des Tests ===');
        console.log(`✅ Réussis: ${this.results.passed}`);
        console.log(`❌ Échoués: ${this.results.failed}`);
        console.log('====================\n');
    }
};


// Tests de création et propriétés de base
test.run('Création d\'une carte basique', () => {
    const card = new Card({
        id: 'test-1',
        name: 'Test Card'
    });
    test.assert(card instanceof Card, 'Devrait être une instance de Card');
    test.assertEqual(card.id, 'test-1', 'ID incorrect');
    test.assertEqual(card.name, 'Test Card', 'Nom incorrect');
    test.assertEqual(card.rarity, Card.RARITY.COMMON, 'Rareté par défaut incorrecte');
    test.assertEqual(card.amount, 1, 'Quantité initiale incorrecte');
});

test.run('Validation des paramètres requis', () => {
    try {
        new Card({});
        test.assert(false, 'Devrait lever une erreur pour paramètres manquants');
    } catch (error) {
        test.assert(error.message.includes('ID et nom sont requis'),
            'Message d\'erreur incorrect pour paramètres manquants');
    }
});

// Tests de rareté et valeur
test.run('Calcul de valeur selon la rareté', () => {
    const rarityTests = [
        { rarity: Card.RARITY.COMMON, expectedMultiplier: 1 },
        { rarity: Card.RARITY.UNCOMMON, expectedMultiplier: 2 },
        { rarity: Card.RARITY.RARE, expectedMultiplier: 5 },
        { rarity: Card.RARITY.EPIC, expectedMultiplier: 12 }, // 10 * 1.2
        { rarity: Card.RARITY.LEGENDARY, expectedMultiplier: 37.5 } // 25 * 1.5
    ];

    rarityTests.forEach(({ rarity, expectedMultiplier }) => {
        const card = new Card({
            id: 'test',
            name: 'Test',
            rarity,
            baseValue: 100
        });
        const expectedValue = Math.floor(100 * expectedMultiplier);
        test.assertEqual(
            card.getCurrentValue(),
            expectedValue,
            `Valeur incorrecte pour rareté ${rarity}`
        );
    });
});

// Tests de gestion des copies
test.run('Gestion des copies', () => {
    const card = new Card({ id: 'test', name: 'Test' });

    // Test addCopy
    card.addCopy(2);
    test.assertEqual(card.amount, 3, 'Ajout de copies incorrect');

    // Test removeCopy
    const removeSuccess = card.removeCopy(2);
    test.assert(removeSuccess, 'Retrait de copies devrait réussir');
    test.assertEqual(card.amount, 1, 'Retrait de copies incorrect');

    // Test retrait impossible
    const removeFail = card.removeCopy(2);
    test.assert(!removeFail, 'Retrait impossible devrait échouer');
    test.assertEqual(card.amount, 1, 'Quantité ne devrait pas changer après échec');
});

// Tests de verrouillage
test.run('Verrouillage et déverrouillage', () => {
    const card = new Card({ id: 'test', name: 'Test' });

    test.assert(!card.isLocked, 'Carte ne devrait pas être verrouillée initialement');

    card.lock();
    test.assert(card.isLocked, 'Carte devrait être verrouillée après lock()');

    card.unlock();
    test.assert(!card.isLocked, 'Carte ne devrait plus être verrouillée après unlock()');
});

// Tests de vente
test.run('Vente de cartes', () => {
    const card = new Card({
        id: 'test',
        name: 'Test',
        baseValue: 100,
        amount: 3
    });

    // Test vente normale
    const value = card.sell(2);
    test.assertEqual(value, 200, 'Valeur de vente incorrecte');
    test.assertEqual(card.amount, 1, 'Quantité restante incorrecte après vente');

    // Test vente carte verrouillée
    card.lock();
    try {
        card.sell(1);
        test.assert(false, 'Devrait lever une erreur pour carte verrouillée');
    } catch (error) {
        test.assert(error.message.includes('verrouillée'),
            'Message d\'erreur incorrect pour carte verrouillée');
    }
});

// Tests de sérialisation
test.run('Sérialisation et désérialisation', () => {
    const originalCard = new Card({
        id: 'test',
        name: 'Test Card',
        description: 'Test Description',
        rarity: Card.RARITY.RARE,
        baseValue: 100,
        amount: 2
    });

    // Test toJSON
    const json = originalCard.toJSON();
    test.assert(json.id === 'test', 'ID manquant dans JSON');
    test.assert(json.name === 'Test Card', 'Nom manquant dans JSON');
    test.assert(json.rarity === Card.RARITY.RARE, 'Rareté manquante dans JSON');

    // Test fromJSON
    const reconstructedCard = Card.fromJSON(json);
    test.assertEqual(reconstructedCard.id, originalCard.id, 'ID incorrect après reconstruction');
    test.assertEqual(reconstructedCard.name, originalCard.name, 'Nom incorrect après reconstruction');
    test.assertEqual(reconstructedCard.rarity, originalCard.rarity, 'Rareté incorrecte après reconstruction');
    test.assertEqual(reconstructedCard.amount, originalCard.amount, 'Quantité incorrecte après reconstruction');
});

// Tests de clonage
test.run('Clonage de carte', () => {
    const original = new Card({
        id: 'test',
        name: 'Test Card',
        description: 'Test Description',
        rarity: Card.RARITY.RARE,
        baseValue: 100,
        amount: 3
    });

    const clone = original.clone();
    test.assertEqual(clone.id, original.id, 'ID incorrect dans le clone');
    test.assertEqual(clone.name, original.name, 'Nom incorrect dans le clone');
    test.assertEqual(clone.rarity, original.rarity, 'Rareté incorrecte dans le clone');
    test.assertEqual(clone.amount, 1, 'Le clone devrait avoir une seule copie');
});

// Affichage du résumé des tests
test.summary();