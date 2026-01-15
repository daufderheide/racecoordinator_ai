/**
 * Calculate the median of an array of numbers.  If the array is undefined or
 * empty, return 0.
 */
export function calculateMedian(arr: number[] | undefined): number {
    // Handle empty arrays
    if (arr === undefined || arr.length === 0) {
        return 0;
    }

    // Create a copy to avoid mutating the original array and sort it
    const sortedArr = [...arr].sort((a, b) => a - b);

    const mid = Math.floor(sortedArr.length / 2);

    // Check if the array length is odd
    if (sortedArr.length % 2 !== 0) {
        return sortedArr[mid]; // Return the middle element
    } else {
        // If even, return the average of the two middle elements
        const middleLeft = sortedArr[mid - 1];
        const middleRight = sortedArr[mid];
        return (middleLeft + middleRight) / 2;
    }
}

/**
 * Calculate the average of an array of numbers.  If the array is undefined or
 * empty, return 0.
 */
export function calculateAverage(arr: number[] | undefined): number {
    if (arr === undefined || arr.length === 0) {
        return 0;
    }
    return arr.reduce((a, b) => a + b) / arr.length;
}

