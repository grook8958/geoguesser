import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-firestore.js";
import ScoreboardDocument from './ScoreboardDocument.js';

/**
 * @typedef {Object} FirebaseConfig
 * @property {string} apiKey
 * @property {string} authDomain
 * @property {string} projectId
 * @property {string} storageBucket
 * @property {string} messagingSenderId
 * @property {string} appId
 * @property {string} measurementId
 */

/**
 * @typedef {Object} DatabaseOptions
 * @property {FirebaseConfig} firebaseConfig The configuration to access the database (API key, etc...)
 * @property {boolean} debug Wether to log events in the console
 */

/**
 * @typedef {Object} DatabaseScoreboardDocumentObject
 * @property {string} name
 * @property {string} mode
 * @property {number} score
 * @property {string} time
 */

/**
 * Manages DB interactions to keep track of scores
 */
class ScoreboardDatabase {
    /**
     * 
     * @param {DatabaseOptions} options 
     */
    constructor(options) {

        /**
         * The Database's Options
         * @type {DatabaseOptions}
         */
        this.options = options;

        /**
         * The Firebase app
         */
        this.app = initializeApp(this.options.firebaseConfig);

        /**
         * The database
         */
        this.db = getFirestore(this.app);
    }

    /**
     * 
     * @param {string} collectionName 
     * @param {DatabaseScoreboardDocumentObject|ScoreboardDocument} document 
     */
    async addScoreboardData(collectionName, document) {
        if (document instanceof ScoreboardDocument) {document = document.toJSON()};
        try {
            // Reference to the collection where you want to add data
            const docRef = await addDoc(collection(this.db, collectionName), document);
            if (this.options.debug) console.log("Document written with ID: ", docRef.id);
        } catch (e) {
            if (this.options.debug) console.error("Error adding document: ", e);
        }
    }

    /**
     * Gets all the scoreboard data
     * @param {string} collectionName
     * @returns {Array<ScoreboardDocument>}
     */
    async getAllScoreboardData(collectionName) {
        try {
            // Reference to the collection
            const querySnapshot = await getDocs(collection(this.db, collectionName));
  
            // Loop through all documents and log their data
            const docs = [];
            querySnapshot.forEach((doc) => {
                if (this.options.debug) console.log(`${doc.id} =>`, doc.data());
                return docs.push(new ScoreboardDocument(doc.data()));
            });
            return docs;
        } catch (e) {
        if (this.options.debug) console.error("Error reading documents: ", e);
        }
    }

    /**
     * Get all the documents corresponding to "mode"
     * @param {Array<DatabaseScoreboardDocumentObject|ScoreboardDocument>} docs 
     * @param {string} mode
     * @return {Array<DatabaseScoreboardDocumentObject|ScoreboardDocument>}
     */
    static getDocMode(docs, mode) {
        console.log(docs)
        return docs.filter(doc => {
            if (doc.mode === mode) {
                return doc;
            }
        });
    }

    /**
     * Get all the docs of 'Pin' mode
     * @param {Array<DatabaseScoreboardDocumentObject|ScoreboardDocument>} docs 
     * @returns {Array<DatabaseScoreboardDocumentObject|ScoreboardDocument>}
     */
    static getDocPin(docs) {
        return this.getDocMode(docs, 'Pin');
    }

    /**
     * Get all the docs of 'Type' mode
     * @param {Array<DatabaseScoreboardDocumentObject|Scoreboard Document>} docs 
     * @returns {Array<DatabaseScoreboardDocumentObject|ScoreboardDocument>}
     */
    static getDocType(docs) {
        return this.getDocMode(docs, 'Type');
    }

    /**
     * Get all the docs of 'Type (Hard)' mode
     * @param {Array<DatabaseScoreboardDocumentObject|ScoreboardDocument>} docs 
     * @returns {Array<DatabaseScoreboardDocumentObject|ScoreboardDocument>}
     */
    static getDocTypeHard(docs) {
        return this.getDocMode(docs, 'Type (Hard)');
    }

    /**
     * Sort the docs by highest score and lowest time
     * @param {Array<DatabaseScoreboardDocumentObject|ScoreboardDocument>} docs 
     * @returns {Array<DatabaseScoreboardDocumentObject|ScoreboardDocument>}
     */
    static sortDocs(docs) {
        return docs.sort((a, b) => {
            const aTime = Number(a.time.split(':')[1]) + (Number(a.time.split(':')[0])*60);
            const bTime = Number(b.time.split(':')[1]) + (Number(b.time.split(':')[0])*60);
            if (a.score !== b.score) {
                return b.score - a.score;
            }
            return aTime - bTime;
        });
    }
    
}

export default ScoreboardDatabase;