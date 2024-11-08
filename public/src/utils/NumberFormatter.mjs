export class NumberFormatter {
    static #suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];

    static format(number, decimals = 1) {
        if (number === undefined || number === null || isNaN(number)) {
            return '0';
        }

        const num = Number(number);
        if (isNaN(num)) {
            return '0';
        }

        if (num < 1000) {
            return num.toFixed(0);
        }

        const magnitude = Math.floor(Math.log10(num) / 3);
        const scaled = num / Math.pow(1000, magnitude);
        return `${scaled.toFixed(decimals)}${this.#suffixes[Math.min(magnitude, this.#suffixes.length - 1)]}`;
    }

    static formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds} secondes`;
        }
        if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        const hours = Math.floor(seconds / 3600);
        return `${hours} heure${hours > 1 ? 's' : ''}`;
    }
}