
/**
 * Generates a pseudorandom number between `min` and `max`
 * @param {number} min 
 * @param {number} max 
 * @returns 
 */
export function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Removes an element from the array
 * @param {any} item 
 * @param {Array<any>} array 
 */
export function removeItem(item, array) {
    const index = array.indexOf(item);
    if (index > -1) {
        array.splice(index, 1);
    }
}

export async function wait(time) {
    return await new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}