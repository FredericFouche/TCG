export class Toast {
    static #container;
    static #currentToast;

    static init() {
        // Créer le container s'il n'existe pas
        if (!this.#container) {
            this.#container = document.createElement('div');
            this.#container.className = 'toast-container';
            document.body.appendChild(this.#container);
        }
    }

    static show(message, type = 'info', duration = 3000) {
        this.init();

        // Si un toast existe déjà, le supprimer
        if (this.#currentToast) {
            this.#currentToast.remove();
        }

        // Créer le nouveau toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Stocker la référence au toast actuel
        this.#currentToast = toast;

        // Ajouter le toast au container
        this.#container.appendChild(toast);

        // Supprimer le toast après la durée spécifiée
        setTimeout(() => {
            if (toast === this.#currentToast) {
                toast.remove();
                this.#currentToast = null;
            }
        }, duration);
    }
}
// Toast.show('Partie sauvegardée !', 'success');
// Toast.show('Erreur de connexion', 'error');
// Toast.show('Attention !', 'warning');
// Toast.show('Nouvelle mise à jour disponible', 'info');