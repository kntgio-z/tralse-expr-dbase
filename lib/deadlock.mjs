import { log } from "../util/console.mjs";
import { DatabaseError } from "../errors/error.mjs";

/**
 * Manages deadlock retries for database queries with exponential backoff.
 *
 * @param {number} maxRetries - The maximum number of retries.
 * @param {Function} queryFunction - The callback function representing the query.
 * @param {number} [maxBackoffTime=8000] - The maximum backoff time in milliseconds.
 * @returns {Promise<any>} - Resolves when the query completes or retries are exhausted.
 * @throws {DatabaseError} - If the query encounters an error after maximum retries.
 */
export const manageDeadlocks = async (
  maxRetries,
  queryFunction,
  maxBackoffTime = 8000
) => {
  const executeQueryWithRetries = async (retryCount = 0) => {
    try {
      return await queryFunction();
    } catch (error) {
      if (
        retryCount < maxRetries &&
        (error.code === "ER_LOCK_DEADLOCK" ||
          error.code === "ER_LOCK_WAIT_TIMEOUT")
      ) {
        const backoffTime = Math.min(
          Math.pow(2, retryCount) * 100,
          maxBackoffTime
        ); // Exponential backoff with a cap
        log(
          "deadlockError",
          `Retrying query due to deadlock in ${backoffTime}ms: ${error.message}`,
          { retryCount }
        );
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        return executeQueryWithRetries(retryCount + 1);
      } else {
        console.log(error);
        throw new DatabaseError(
          `Database error after ${maxRetries} retries: ${error.message}`
        );
      }
    }
  };

  return await executeQueryWithRetries();
};
