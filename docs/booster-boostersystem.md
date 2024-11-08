# Documentation Système de Boosters

## Booster Class
Représente un pack de cartes individuel dans le jeu.

### Propriétés Statiques
```javascript
static TYPES = {
    BASIC: 'basic',    // Pack de base (5 cartes)
    PREMIUM: 'premium', // Pack premium (10 cartes)
    SPECIAL: 'special'  // Pack spécial (5 cartes rares+)
}

static CONFIGS = {
    // Configuration détaillée de chaque type
    // Définit : cardCount, cost, weights
}
```

### Propriétés Privées
- `#id`: Identifiant unique du pack
- `#type`: Type du pack
- `#purchaseDate`: Date d'achat
- `#opened`: État d'ouverture
- `#cards`: Cartes contenues

### Méthodes Principales
- `constructor(type)`: Crée un nouveau pack
- `setCards(cards[])`: Définit les cartes obtenues
- `toJSON()`: Sérialise pour sauvegarde
- `static fromJSON()`: Recrée depuis une sauvegarde

### Getters
- `id`: Obtient l'ID
- `type`: Obtient le type
- `isOpened`: Vérifie si ouvert
- `cards`: Obtient les cartes
- `cost`: Obtient le coût
- `cardCount`: Obtient le nombre de cartes
- `weights`: Obtient les poids de rareté

## BoosterSystem Class
Gère l'ensemble du système de packs et leur ouverture.

### Événements
```javascript
static EVENTS = {
    BOOSTER_PURCHASED: 'booster:purchased',
    BOOSTER_OPENED: 'booster:opened',
    BOOSTER_ERROR: 'booster:error',
    PITY_UPDATED: 'booster:pity-updated'
}
```

### Système de Pitié
```javascript
static PITY_THRESHOLDS = {
    legendary: 50,  // Garantie après 50 packs
    epic: 20,      // Garantie après 20 packs
    rare: 10       // Garantie après 10 packs
}
```

### Méthodes Principales
- `purchaseBooster(type, currencySystem)`: Achat d'un pack
- `openBooster(booster)`: Ouverture d'un pack
- `getStatistics()`: Obtient les statistiques
- `getHistory(limit)`: Obtient l'historique
- `save()`: Sauvegarde l'état
- `load(saveData)`: Charge un état

### Statistiques Suivies
- Nombre total de packs ouverts
- Distribution des raretés
- Compteurs de pitié
- Historique des ouvertures

### Dépendances
- Requiert un CardSystem pour la création des cartes
- Intégration avec le système de monnaie

### Utilisation
```javascript
const boosterSystem = new BoosterSystem(cardSystem);
const booster = boosterSystem.purchaseBooster('basic', currencySystem);
const cards = boosterSystem.openBooster(booster);
```
