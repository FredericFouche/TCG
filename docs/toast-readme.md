# Système de Toast & Notifications

Un système léger de notifications toast avec une architecture événementielle pour découpler les composants UI des notifications.

## Structure

```
src/
├── components/
│   └── ui/
│       └── Toast.mjs         # Composant UI des toasts
├── utils/
│   └── NotificationSystem.mjs  # Système de gestion des notifications
└── index.mjs                 # Point d'entrée avec l'initialisation
```

## Installation

1. Ajoutez les fichiers dans votre structure de projet
2. Importez et initialisez le système dans votre point d'entrée

```javascript
// index.mjs
import { NotificationSystem } from './utils/NotificationSystem.mjs';
import { Toast } from './components/ui/Toast.mjs';

// Initialiser le système de notification
const notificationSystem = NotificationSystem.getInstance();

// Connecter le système de notification au Toast
notificationSystem.on(NotificationSystem.EVENTS.SHOW_NOTIFICATION, ({ type, message }) => {
    Toast.show(message, type);
});
```

## Utilisation

### Dans vos composants

```javascript
import { NotificationSystem } from '../../utils/NotificationSystem.mjs';

class MyComponent {
    constructor() {
        this.notifications = NotificationSystem.getInstance();
    }

    someMethod() {
        // Afficher une notification de succès
        this.notifications.showSuccess('Opération réussie !');

        // Afficher une erreur
        this.notifications.showError('Une erreur est survenue');

        // Afficher une info
        this.notifications.showInfo('Information importante');

        // Afficher un avertissement
        this.notifications.showWarning('Attention !');
    }
}
```

### Types de notifications disponibles

- `showSuccess(message)` - Pour les opérations réussies (bordure verte)
- `showError(message)` - Pour les erreurs (bordure rouge)
- `showWarning(message)` - Pour les avertissements (bordure orange)
- `showInfo(message)` - Pour les informations générales (bordure bleue)

### Personnalisation des toasts

Les toasts utilisent les variables CSS du thème pour les couleurs et l'espacement. Vous pouvez les personnaliser en modifiant ces variables ou en surchargeant les classes CSS :

```css
:root {
    /* Vos variables CSS existantes */
}

/* Personnalisation des types de toast */
.toast-success {
    border-left-color: #votre-couleur;
}
```

## Caractéristiques

- Un seul toast visible à la fois
- Animation d'entrée fluide
- Disparition automatique après 3 secondes
- Responsive design
- Support des appareils mobiles
- Faible couplage grâce au pattern Observer

## Best Practices

1. Évitez d'afficher trop de notifications en succession rapide
2. Utilisez des messages courts et clairs
3. Choisissez le bon type de notification selon le contexte
4. N'utilisez pas les notifications pour des informations critiques qui nécessitent une action de l'utilisateur

## Exemple d'utilisation dans AutoClickDisplay

```javascript
export class AutoClickDisplay {
    constructor() {
        this.notifications = NotificationSystem.getInstance();
    }

    #bindEvents() {
        this.#container.addEventListener('click', (e) => {
            if (e.target.classList.contains('buy-generator-btn')) {
                const generatorId = e.target.dataset.generatorId;
                const cost = parseInt(e.target.dataset.cost);
                
                const success = this.#autoClickManager.buyGenerator(generatorId);

                if (!success) {
                    this.notifications.showError(
                        `Pas assez de ressources ! (Coût: ${cost})`
                    );
                }
            }
        });
    }
}
```

## Notes techniques

- Utilise le pattern Singleton pour le NotificationSystem
- Le système est basé sur les événements pour un faible couplage
- Les toasts sont automatiquement supprimés après leur durée d'affichage
- Support complet de Safari mobile

## Limitations

- Un seul toast visible à la fois
- Pas de file d'attente pour les notifications
- Pas de support pour les notifications persistantes
- Pas de support pour les actions dans les notifications

## Support Navigateur

- Chrome (dernière version)
- Firefox (dernière version)
- Safari (dernière version)
- Edge (dernière version)
- Safari Mobile

