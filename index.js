import HTMLSelectMenu from "./static/scripts/HTMLSelectMenu.js";
import * as Util from "./static/scripts/utils.js";
import games from "./static/games.json" with {type: 'json'};
import ScoreboardDatabase from './static/scripts/database/database.js';

/**
 * ===========================================
 *          DATABASE INITIALISATION
 * ===========================================
 */
const firebaseConfig = {
    apiKey: "AIzaSyAO1XqyAml7MVrkib91-v2nsgaZpstSFrQ", //Production Key
    authDomain: "geoguesser-9b056.firebaseapp.com",
    projectId: "geoguesser-9b056",
    storageBucket: "geoguesser-9b056.appspot.com",
    messagingSenderId: "220652800613",
    appId: "1:220652800613:web:be145751adf04b94dfd48c",
    measurementId: "G-2FY5ND2KJZ"
};

//Initialize Database
const db = new ScoreboardDatabase({
    debug: true,
    firebaseConfig: firebaseConfig
});

/**
 * Refresh and update the scoreboard
 */
async function refreshScoreboard() {
    const rawDocs = await db.getAllScoreboardData(gameSelector.data.selected);

    //Pin
    const pinTableBody = document.querySelector('#pin tbody');
    pinTableBody.innerHTML = '';
    
    const pinDocs = ScoreboardDatabase.sortDocs(ScoreboardDatabase.getDocPin(rawDocs));

    pinDocs.forEach(doc => {
        Util.populateTable(pinTableBody, doc);
    });

    //Type
    const typeTableBody = document.querySelector('#type tbody');
    typeTableBody.innerHTML = '';
    
    const typeDocs = ScoreboardDatabase.sortDocs(ScoreboardDatabase.getDocType(rawDocs));

    typeDocs.forEach(doc => {
        Util.populateTable(typeTableBody, doc);
    });

    //Type Hard
    const typeHardTableBody = document.querySelector('#type-hard tbody');
    typeHardTableBody.innerHTML = '';
    
    const typeHardDocs = ScoreboardDatabase.sortDocs(ScoreboardDatabase.getDocTypeHard(rawDocs));

    typeHardDocs.forEach(doc => {
        Util.populateTable(typeHardTableBody, doc);
    });
}

/**
 * =============================================
 *            GAME INITIALISATION
 * =============================================
 */
let gameStarted = 0 //0 = not started; 1 = started; -1 = game over
let score = 0;
let progress = 0; // Number of location done
let timer = null;
let failedAttempts = 0;


//Initialize de mode selector
const modeSelector = new HTMLSelectMenu('mode-selector', ['Pin', 'Type', 'Type (Hard)'], onModeSelect);
const gameSelector = new HTMLSelectMenu('game-selector', Object.keys(games), onGameSelect, {
    defaultValue: "English Counties"
});

/**
 * @typedef {Object} Pin
 * @property {string} name
 * @property {[number, number]} coordinates
 */

/**
 * @type {Array<Pin>}
 */
let pins = [null]; //default on page load

/**
 * @type {Array<Pin>}
 */
let remainingPins = [...pins];
let instructionPin;

/**
 * Function called whenever an new item is selected on the select menu
 * @param {string} item The item selected
 */
function onModeSelect(item) {
    clear()
    init(modeSelector.data.selected, gameSelector.data.selected)
}

/**
 * Function called whenever an new item is selected on the select menu
 * @param {Element} item The item selected
 */
function onGameSelect(item) {
    clear()
    document.getElementById('banner-subtitle').innerText = item.innerText;
    init(modeSelector.data.selected, gameSelector.data.selected);
}

/**
 * PAGE INITIALISATION
 */
window.addEventListener('load', () => {
    init(modeSelector.data.selected, gameSelector.data.selected);
})


/**
 * Set the backround image
 * @param {string} img_path 
 */
function setImg(img_path) {
    const imgEl = document.querySelector('.map');
    imgEl.src = img_path;
}

/**
 * Returns a random pin and removes it from the list
 * @param {Array<Pin>} pins 
 * @returns 
 */
function randomPin(pins) {
    const i = Util.getRandomNumber(0, pins.length-1);
    const pin = pins[i];
    pins.splice(i,1);
    return pin;
}

/**
 * Remove all the pins
 */
function clear() {
    const parent = document.getElementById('map-container');
    const pins = parent.querySelectorAll(".pin");
    for (const pin of pins) {
        if (pin.id !== "pin-template") {
            parent.removeChild(pin)
        }
    }
}

/**
 * Place all the pins 
 */
function placePins(pins) {
    const parent = document.getElementById('map-container');
    const template = document.getElementById('pin-template');
    for (const pin of pins) {
        const clone = template.cloneNode(true);
        clone.removeAttribute("id")
        clone.setAttribute('name', pin.name)
        parent.appendChild(clone);
        const pinEl = parent.querySelector(`[name="${pin.name}"]`);
        pinEl.style.bottom = `${pin.coordinates[0]}px`
        pinEl.style.right = `${pin.coordinates[1]}px`
        pinEl.children[1].innerHTML = pin.name;
        pinEl.addEventListener('click', pinOnClick)
        pinEl.children[2].addEventListener('keypress', pinOnEnter);
    }
}

/**
 * Initialize the game
 * @param {string} gamemode 
 */
async function init(gamemode, game) {
    // Import the game data file
    const res = await import(games[game].data_path, {with: {type: 'json'}});
    pins = res.default

    // Set the correct backround image
    setImg(games[game].map_img_path); 

    // Reset Main game variables
    failedAttempts = 0;
    remainingPins = [...pins];
    instructionPin = randomPin(remainingPins).name;
    gameStarted = 0;
    score = 0;
    progress = 0;

    const instructionsElement = document.getElementById('map-instructions-instruction');
    const scoreElement = document.getElementById('map-instructions-score');
    const progressElement = document.getElementById('map-instructions-progress');
    const timeElement = document.getElementById('map-instructions-time');
    clearInterval(timer); // Reset Timer
    placePins(pins);

    // Display the correct instruction and setup the beginning of the game
    switch(gamemode) {
        case('Pin'):
            instructionsElement.innerHTML = `Click on <strong>${instructionPin}</strong>`;
            break;
        case('Type'):
            instructionsElement.innerText = `Type the name of the ${games[game].instruction_name} in the box`;
            const pin = document.querySelector(`[name="${instructionPin}"]`)
            showInput(pin);
            break;
        case('Type (Hard)'):
            instructionsElement.innerText = `Type the name of the ${games[game].instruction_name} in the box`;
            const pin2 = document.querySelector(`[name="${instructionPin}"]`)
            showInput(pin2);
            break;
    }
    progressElement.innerText = `0/${pins.length}`;
    timeElement.innerHTML = '0:00';
    scoreElement.innerHTML = '0%';
    refreshScoreboard();
    updateProgress();
}


/**
 * Failed pin state (attempts > 3)
 * @param {Element} pin 
 */
function failedPin(pin) {
    pin.classList.add('failed');
    pin.classList.remove('neutral', 'show-mistake-circle', 'show-mistake');
}

/**
 * Correct pin state (failedAttempts = 0)
 * @param {Element} pin 
 */
function correctPin(pin) {
    pin.classList.add('correct');
    pin.classList.remove('neutral');
}

/**
 * Wrong pin state (0 < failedAttempts < 3)
 * @param {Element} pin 
 */
function wrongPin(pin) {
    pin.classList.add('wrong');
    pin.classList.remove('neutral');
}

/**
 * Show the mistake (failedAttempts = 3)
 * @param {Element} pin 
 */
async function showMistakePin(pin) {
    pin.classList.add('show-mistake', 'show-mistake-circle');
    pin.classList.remove('neutral');
    await Util.wait(2000)
    pin.classList.remove('show-mistake-circle');
}

/**
 * Show the input of a pin
 * @param {Element} pin
 */
function showInput(pin) {
    pin.classList.add('show-input');
    const input = pin.children[2].children[1];
    input.select();
    return;
}

/**
 * Hide the input of a pin
 * @param {Element} pin
 */
function hideInput(pin) {
    pin.classList.remove('show-input');
    return;
}

/**
 * Peak the name of the pin
 * @param {Element} pin 
 */
function peak(pin) {
    pin.classList.add('peak');
}

/**
 * Starts updating the timer
 * @returns {number} The ID of the interval bound to the timer
 */
function startTimer() {
    const time = document.getElementById("map-instructions-time")
    let seconds = 0
    let minutes = 0
    return setInterval(() => {
        if (seconds === 59) {
            minutes += 1;
            seconds = 0;
        } else {
            seconds += 1;
        }
        time.innerText = `${minutes}:${seconds < 10 ? 0 : ''}${seconds}`
    }, 1000)
}

/**
 * Clear the classes of the pin
 * @param {Element} pin 
 */
function clearPin(pin) {
    if (!pin) return;
    pin.classList.remove(pin.classList.remove('peak', 'show-mistake-circle', 'show-mistake'))
}

/**
 * Hint answer
 * @param {Element} pin
 * @param {Number} failedAttempts
 */
function hintAnswer(pin, failedAttempts) {
    pin.classList.add('show-hint')
    const answer = pin.getAttribute('name');
    const hintElement = pin.querySelector('.hint');
    const answerArray = answer.split('');
    let hintArray = [...answerArray]
    hintArray.forEach((e, i) => hintArray[i] = '*');

    //Progressilvely uncover some letters
    switch (failedAttempts) {
        case 1:
            break;
        case 2:
            hintArray[hintArray.length-1] = answer[answer.length-1];
            break;
        case 3:
            hintArray[hintArray.length-1] = answer[answer.length-1];
            hintArray[0] = answer[0];
            break;
        case 4:
            hintArray[hintArray.length-1] = answer[answer.length-1];
            hintArray[0] = answer[0];
            hintArray[hintArray.length-2] = answer[answer.length-2];
            hintArray[1] = answer[1];
            break;
        default:
            hintArray = answerArray;
            break;
    }
    //Show the hint
    hintElement.innerHTML = `Hint: ${hintArray.join('')}`;
}

/**
 * Wrong answer input
 * @param {Element} pin
 */
function wrongAnswer(pin) {
    pin.classList.add('wrong-answer');
}

/**
 * The last clicked pin
 * @type {Element}
 */
let lastClickedPin = null;

/**
 * Event Handler when a pin is clicked
 * @param {Event} event 
 */
async function pinOnClick(event) {
    //Check gamemode
    if (modeSelector.data.selected !== 'Pin') return;
    if (gameStarted == -1) return;

    //Start timer + game
    if (gameStarted == 0) {timer = startTimer();}
    gameStarted = 1

    // Get the corrent pin
    const answerPin = document.querySelector(`[name="${instructionPin}"]`);

    /**
     * The pin that was clicked
     * @type {Element}
     */
    const pin = event.target;
    const pinName = pin.getAttribute("name");

    //Clear last pin && correct pin
    clearPin(lastClickedPin);
    lastClickedPin = pin;

    // Clicked wrong pin
    if (pinName != instructionPin) {
        failedAttempts++;
        peak(pin);
        if (failedAttempts >= 3) {
            showMistakePin(answerPin);
            return;
        } else {
            return;
        }
    }

    /**
     * Score Calculations:
     * - Each pin worth 30pts
     * - Correct = 30pts
     * - 1 failed attempt = 20pts
     * - 2 failed attempts = 10pts
     * - 3+ failed attemps = 0pts
     */

    // Clicked correct pin
    switch(failedAttempts) {
        case(0):
            correctPin(answerPin);
            score += 30;
            break;
        case(1):
            wrongPin(answerPin);
            score += 20;
            break;
        case(2):
            wrongPin(answerPin);
            score += 10;
            break;
        default:
            failedPin(answerPin);
            break;
    }

    progress++;
    failedAttempts = 0;
    updateProgress();
    updateScore();
    updatePinInstruction();
}

/**
 * Event Handler for when a pin input is typed in
 * @param {Event} event 
 */
async function pinOnEnter(event) {
    //Check gamemode & game started
    if (modeSelector.data.selected !== 'Type' && modeSelector.data.selected !== 'Type (Hard)') return;
    if (gameStarted == -1) return;

    event.target.parentElement.parentElement.classList.remove('wrong-answer');

    //Check key & value typed
    if (event.key !== 'Enter') return;
    if (event.target.value.length <= 0) return;

    //If game not started start the game and timer
    if (gameStarted == 0) { timer = startTimer(); }
    gameStarted = 1;

    /**
     * The pin that was typed in
     * @type {HTMLInputElement}
     */ 
    const input = event.target;   
    const userEntry = input.value;

    //Check wether correct answer depending on Type or Type (Hard) gamemodes
    if (modeSelector.data.selected === 'Type') {
        if (Util.removeDiacritics(userEntry).toLowerCase() !== Util.removeDiacritics(instructionPin).toLowerCase()) {
            failedAttempts++
            wrongAnswer(input.parentElement.parentElement)
            hintAnswer(input.parentElement.parentElement, failedAttempts);
            return;
        }
    } else if (modeSelector.data.selected === 'Type (Hard)') {
        if (userEntry !== instructionPin) {
            failedAttempts++
            wrongAnswer(input.parentElement.parentElement);
            hintAnswer(input.parentElement.parentElement, failedAttempts);
            return;
        }
    }

    /**
     * Score Calculations:
     * - Each pin worth 30pts
     * - Correct = 30pts
     * - 1 failed attempt = 25pts
     * - 2 failed attempts = 20pts
     * - 3 failed attempts = 15pts
     * - 4 failed attemps = 10pts
     * - 5+ failed attemps = 0pts
     */

    // Clicked correct pin
    switch(failedAttempts) {
        case(0):
            correctPin(input.parentElement.parentElement);
            score += 30;
            break;
        case(1):
            wrongPin(input.parentElement.parentElement);
            score += 25;
            break;
        case(2):
            wrongPin(input.parentElement.parentElement);
            score += 15;
            break;
        case(3):
            wrongPin(input.parentElement.parentElement)
            score += 10;
            break;
        case(4):
            failedPin(input.parentElement.parentElement)
            score += 5;
            break;
        default:
            //5 or more
            failedPin(input.parentElement.parentElement);
            break;
    }

    progress++;
    failedAttempts = 0;
    hideInput(input.parentElement.parentElement);
    updateProgress();
    updateScore();
    updateTypeInstruction();
} 

/**
 * Update the progress
 */
function updateProgress() {
    const number = document.getElementById('map-instructions-progress');
    number.innerHTML = `${progress}/${pins.length}`;
}

/**
 * Update the Pin instructions and checks for game end
 * @returns {void} 
 */
function updatePinInstruction() {
    //If no more pins
    if (remainingPins.length == 0) {
        gameOver();
        return;
    }
    instructionPin = randomPin(remainingPins).name
    const instructions = document.getElementById('map-instructions-instruction');
    instructions.innerHTML = `Click on <strong>${instructionPin}</strong>`;
}

/**
 * Update the Type instructions and checks for game end
 * @returns {void} 
 */
function updateTypeInstruction() {
    //If no more pins
    if (remainingPins.length == 0) {
        gameOver();
        return;
    }
    instructionPin = randomPin(remainingPins).name
    const pin = document.querySelector(`[name="${instructionPin}"]`)
    showInput(pin);
}

/**
 * Update the score
 */
function updateScore() {
    const scorePerc = (score / (progress * 30) ) * 100; //Score depending on pins done
    const scoreElement = document.getElementById('map-instructions-score');
    scoreElement.innerHTML = `${Math.round(scorePerc)}%`;
}

/**
 * Handle the end of the game
 */
function gameOver() {
    clearInterval(timer); //Stops the timer
    const instructions = document.getElementById('map-instructions-instruction');
    instructions.innerHTML = `Gamer Over`;
    gameStarted = -1;

    //Show the end popup
    showEndPopup(document.getElementById('map-instructions-score').innerText, document.getElementById('map-instructions-time').innerText);
}

//Close end popup
const endPopup = document.querySelector('.end-popup');
const endPopupInput = endPopup.querySelector('input');
const saveScoreBtn = endPopup.querySelector('.btn.save-score');
document.querySelector('.end-popup .btn.close').addEventListener('click', closeEndPopup);

//Save score
saveScoreBtn.addEventListener('click', async (e) => {
    if (endPopupInput.value <= 0) {
        saveScoreBtn.classList.add('no-name-error');
        await Util.wait(3000);
        saveScoreBtn.classList.remove('no-name-error');
        return;
    }
    const score = endPopup.getAttribute('data-score');
    const time = endPopup.getAttribute('data-time');
    const mode = modeSelector.data.selected;
    const name = endPopupInput.value;
    endPopup.classList.add('wait');
    await db.addScoreboardData(gameSelector.data.selected, {
        mode: mode,
        name: name,
        score: Number.parseInt(score.replace('%', ''), 10),
        time: time,
    });
    endPopup.classList.add('remove');
    saveScoreBtn.classList.add('saved');
    refreshScoreboard();
})

//Restart game
document.querySelectorAll('.btn.restart').forEach(el =>el.addEventListener('click', (e) => {
    clear();
    init(modeSelector.data.selected, gameSelector.data.selected);
    closeEndPopup();
}));

/**
 * Show the end popup
 * @param {string} score 
 * @param {string} time 
 */
function showEndPopup(score, time) {
    if (!score) score = '100%'
    else if (!time) time = '1:00'
    endPopup.classList.add('show');
    const scoreEl = endPopup.querySelector('.end-popup .body span.score');
    const timeEl = endPopup.querySelector('.end-popup .body span.time');
    endPopup.setAttribute('data-score', score);
    endPopup.setAttribute('data-time', time);
    scoreEl.innerHTML = `Score: <strong>${score}</strong>`;
    timeEl.innerHTML = `Time: <strong>${time}</strong>`;
}

// Close the end popup
function closeEndPopup() {
    endPopup.classList.remove('show');
}

