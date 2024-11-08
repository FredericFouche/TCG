import {CurrencySystem} from "../../core/currency/CurrencySystem.mjs";

export class CurrencyDisplay {
    #container;
    #currencySystem;
    #displayElement;

    constructor(currencySystem) {
        this.#currencySystem = currencySystem;
        this.#init();
        this.#setupEventListeners();
    }

    #init() {
        // Créer le conteneur principal
        this.#container = document.createElement('div');
        this.#container.className = 'currency-display';

        // Créer l'élément d'affichage
        this.#displayElement = document.createElement('span');
        this.#displayElement.className = 'currency-amount';

        // Assembler les éléments
        this.#container.appendChild(this.#displayElement);

        // Mettre à jour l'affichage initial
        this.#updateDisplay();
    }

    #setupEventListeners() {
        // Écouter les mises à jour de la monnaie
        this.#currencySystem.on(
            CurrencySystem.EVENTS.CURRENCY_UPDATED,
            () => this.#updateDisplay()
        );
    }

    #updateDisplay() {
        this.#displayElement.textContent = this.#currencySystem.formattedCurrency;

        // Utiliser la classe CSS pour l'animation
        this.#container.classList.add('update-animation');
        setTimeout(() => {
            this.#container.classList.remove('update-animation');
        }, 100);
    }

    // Méthode pour monter le composant dans le DOM
    mount(parentElement) {
        if (parentElement) {
            parentElement.appendChild(this.#container);
        } else {
            document.body.appendChild(this.#container);
        }
    }

    // Méthode pour démonter le composant
    unmount() {
        this.#container.remove();
        // Nettoyage des event listeners
        this.#currencySystem.off(CurrencySystem.EVENTS.CURRENCY_UPDATED);
    }
}