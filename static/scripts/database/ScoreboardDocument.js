/**
 * @typedef {Object} DatabaseScoreboardDocumentObject
 * @property {string} name
 * @property {string} mode
 * @property {number} score
 * @property {string} time
 */

class ScoreboardDocument { 
    /**
     * @param {DatabaseScoreboardDocumentObject} data
     */
    constructor(data) {
        /**
         * The name of the person
         * @type {string}
         */
        this.name = data.name ?? null;

        /**
         * The mode on which the score was made
         * @type {string}
         */
        this.mode = data.mode ?? null;

        /**
         * The actual score (0-100)
         * @type {number}
         */
        this.score = data.score ?? null;

        /**
         * The time taken
         * @type {string}
         */
        this.time = data.time ?? null;
    }

    toJSON() {
        const { name, mode, score, time } = this;
        return { name, mode, score, time };
    }
}

export default ScoreboardDocument;