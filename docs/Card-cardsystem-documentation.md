# Documentation Technique - Système de Cartes

## 📝 Classe Card

### Description
Représente une carte individuelle dans le jeu avec ses propriétés et comportements.

### Propriétés
```javascript
{
    id: string,           // Identifiant unique
    name: string,         // Nom de la carte
    rarity: RARITY,       // Rareté (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)
    baseValue: number,    // Valeur de base
    image: string,        // URL de l'image
    description: string,  // Description
    amount: number,       // Nombre de copies
    isLocked: boolean    // État de verrouillage
}
```

### Méthodes clés
- `getCurrentValue()` : Calcule la valeur selon la rareté
- `addCopy(quantity)` : Ajoute des copies
- `removeCopy(quantity)` : Retire des copies
- `sell(quantity)` : Vend des copies
- `lock()/unlock()` : Gère le verrouillage

### Multiplicateurs de valeur
- COMMON: x1
- UNCOMMON: x2
- RARE: x5
- EPIC: x10 (+20%)
- LEGENDARY: x25 (+50%)

## 🗃️ Classe CardSystem

### Description
Gère la collection de cartes, leur persistance et les événements associés.

### Événements
```javascript
{
    CARD_ADDED: 'card:added',
    CARD_REMOVED: 'card:removed',
    CARD_UPDATED: 'card:updated',
    COLLECTION_LOADED: 'collection:loaded',
    COLLECTION_CLEARED: 'collection:cleared'
}
```

### Fonctionnalités principales
1. **Gestion des cartes**
   ```javascript
   addCard(card)      // Ajoute/met à jour une carte
   removeCard(cardId) // Supprime une carte
   getCard(cardId)    // Récupère une carte
   getCards(filters)  // Liste les cartes avec filtres
   ```

2. **Persistance**
   - Sauvegarde automatique dans localStorage
   - Chargement asynchrone à l'initialisation
   - Sérialisation/désérialisation JSON

3. **Statistiques**
   ```javascript
   getStats() // Retourne {
       totalCards: number,
       byRarity: Object,
       totalValue: number,
       uniqueCards: number
   }
   ```

### Utilisation
```javascript
const system = new CardSystem();
await system.initialized; // Attendre l'initialisation

// Ajouter une carte
const card = new Card({/*...*/});
system.addCard(card);

// Écouter les événements
system.on(CardSystem.EVENTS.CARD_ADDED, ({card}) => {
    // Traitement...
});
```

### Points d'attention
1. **Initialisation**
   - Attendre `system.initialized` avant utilisation
   - Événements émis pendant l'initialisation

2. **Persistance**
   - Sauvegarde automatique après chaque modification
   - Chargement asynchrone au démarrage

3. **Gestion mémoire**
   - Désabonner les événements quand nécessaire
   - Nettoyer avec `clearCollection()`
