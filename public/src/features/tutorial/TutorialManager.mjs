export class TutorialManager {
    #container;
    #currentStep = 0;
    #steps = [
        {
            title: "🎮 Bienvenue dans Card Clicker!",
            message: "Préparez-vous à collectionner des cartes, générer des ressources et développer votre empire !",
            action: "C'est parti!",
            highlight: null
        },
        {
            title: "💰 Le Dashboard",
            message: "Voici votre tableau de bord principal. Cliquez pour gagner des pièces et commencer votre aventure.",
            action: "Cliquez 5 fois pour essayer",
            highlight: ".click-area",
            required: { clicks: 5 }
        },
        {
            title: "🤖 Automatisez vos gains",
            message: "Les générateurs produisent des pièces automatiquement. Plus vous en avez, plus vous gagnez!",
            action: "Achetez un générateur",
            highlight: ".generator-section",
            required: { purchase: true }
        },
        {
            title: "📦 Ouvrez des Boosters",
            message: "Les boosters contiennent des cartes de différentes raretés. Collectionnez-les toutes!",
            action: "Allons à la boutique",
            link: 'shop',
            highlight: ".shop-section"
        },
        {
            title: "🏆 Dernière étape",
            message: "N'oubliez pas de consulter vos achievements pour suivre votre progression et gagner des récompenses!",
            action: "Terminer le tutoriel",
            highlight: null
        }
    ];

    constructor() {
        this.#createContainer();
        this.#bindEvents();
    }

    #createContainer() {
        this.#container = document.createElement('div');
        this.#container.className = 'modal-overlay';
        document.body.appendChild(this.#container);
    }

    #bindEvents() {
        // Gestion des clics sur les boutons d'action
        this.#container.addEventListener('click', (e) => {
            if (e.target.matches('.modal-action-btn')) {
                const step = this.#steps[this.#currentStep];

                // Si l'étape a un lien de navigation
                if (step.link) {
                    document.querySelector(`[data-route="${step.link}"]`)?.click();
                }

                // Si pas de conditions requises, on avance
                if (!step.required) {
                    this.#progressTutorial();
                }
            }
        });

        // Écouteurs d'événements pour les conditions
        document.addEventListener('click', this.#handleClick.bind(this));
        document.addEventListener('generatorPurchased', this.#handleGeneratorPurchase.bind(this));
        document.addEventListener('boosterOpened', this.#handleBoosterOpen.bind(this));
    }

    #handleClick() {
        const currentStep = this.#steps[this.#currentStep];
        if (currentStep?.required?.clicks) {
            currentStep.required.clicks--;
            if (currentStep.required.clicks <= 0) {
                this.#progressTutorial();
            } else {
                // Mise à jour du texte du bouton avec le nombre de clics restants
                const actionBtn = this.#container.querySelector('.modal-action-btn');
                if (actionBtn) {
                    actionBtn.textContent = `Encore ${currentStep.required.clicks} clics`;
                }
            }
        }
    }

    #handleGeneratorPurchase() {
        const currentStep = this.#steps[this.#currentStep];
        if (currentStep?.required?.purchase) {
            this.#progressTutorial();
        }
    }

    #handleBoosterOpen() {
        const currentStep = this.#steps[this.#currentStep];
        if (currentStep?.required?.openBooster) {
            this.#progressTutorial();
        }
    }

    #renderStep() {
        const step = this.#steps[this.#currentStep];
        const totalSteps = this.#steps.length;

        this.#container.innerHTML = `
            <div class="tutorial-modal ${step.position}" role="dialog">
                <div class="modal-progress">
                    <div class="progress-bar" style="width: ${(this.#currentStep + 1) / totalSteps * 100}%"></div>
                </div>
                <div class="modal-content">
                    <h2 class="modal-title">${step.title}</h2>
                    <p class="modal-message">${step.message}</p>
                    <button class="modal-action-btn">${step.action}</button>
                </div>
                <div class="modal-step">${this.#currentStep + 1}/${totalSteps}</div>
            </div>
        `;

        if (step.highlight) {
            this.#highlightElement(step.highlight);
        }

        requestAnimationFrame(() => {
            this.#container.classList.add('visible');
            this.#container.querySelector('.tutorial-modal').classList.add('visible');
        });
    }

    #highlightElement(selector) {
        const element = document.querySelector(selector);
        if (!element) return;

        const highlight = document.createElement('div');
        highlight.className = 'modal-highlight';

        const rect = element.getBoundingClientRect();
        highlight.style.top = `${rect.top - 4}px`;
        highlight.style.left = `${rect.left - 4}px`;
        highlight.style.width = `${rect.width + 8}px`;
        highlight.style.height = `${rect.height + 8}px`;

        document.body.appendChild(highlight);
    }

    #progressTutorial() {
        document.querySelectorAll('.modal-highlight').forEach(el => el.remove());

        this.#currentStep++;
        if (this.#currentStep >= this.#steps.length) {
            this.complete();
            return;
        }

        this.#renderStep();
    }

    start() {
        if (localStorage.getItem('tutorialCompleted')) {
            return;
        }
        this.#renderStep();
    }

    complete() {
        localStorage.setItem('tutorialCompleted', 'true');
        this.#container.classList.remove('visible');
        setTimeout(() => this.#container.remove(), 300);
    }

    reset() {
        localStorage.removeItem('tutorialCompleted');
        this.#currentStep = 0;
        this.start();
    }
}