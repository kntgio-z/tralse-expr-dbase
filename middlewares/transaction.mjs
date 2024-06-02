import { defluent } from "../lib/fluent/index.mjs";

/**
 * Initialize database transaction and execute SQL query.
 * @param {string} dbName - The name of the database.
 * @param {string} sql - The SQL query to execute.
 * @param {Array} [params=[null]] - Parameters for the SQL query.
 * @returns {Function} Middleware function.
 */
export const initialize =
  (dbName, sql, params = [null]) =>
  /**
   * Middleware to initialize connection, run SQL, and handle errors.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   */
  async (req, res, next) => {
    const { initializeConnection, transaction: transactionCallback } =
      req.tralse_db_mysql[dbName];
    req.tralse_db_mysql.middleware = {};
    try {
      await initializeConnection();
      const { init } = await transactionCallback();

      const result = await init(sql, defluent(params));
      res.tralse_db_mysql.middleware.result = result;
    } catch (error) {
      res.tralse_db_mysql.middleware = {
        result: null,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack,
        },
      };
    } finally {
      next();
    }
  };

/**
 * Commit the current transaction.
 *
 * @param {string} dbName - The name of the database.
 * @returns {Function} Middleware function.
 */
export const commit =
  (dbName) =>
  /**
   * Middleware to commit transaction and handle errors.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   */
  async (req, res, next) => {
    const { transaction: transactionCallback, releaseConnection } =
      req.tralse_db_mysql[dbName];

    try {
      const { commit } = await transactionCallback();

      await commit();
      res.tralse_db_mysql.middleware.error = {};
    } catch (error) {
      res.tralse_db_mysql.middleware = {
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack,
        },
      };
    } finally {
      await releaseConnection();
      next();
    }
  };

/**
 * Rollback the current transaction.
 *
 * @param {string} dbName - The name of the database.
 * @returns {Function} Middleware function.
 */
export const rollback =
  (dbName) =>
  /**
   * Middleware to rollback transaction and handle errors.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   */
  async (req, res, next) => {
    const { transaction: transactionCallback, releaseConnection } =
      req.tralse_db_mysql[dbName];

    try {
      const { rollback } = await transactionCallback();

      await rollback();
      res.tralse_db_mysql.middleware.error = {};
    } catch (error) {
      res.tralse_db_mysql.middleware = {
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack,
        },
      };
    } finally {
      await releaseConnection();
      next();
    }
  };

/**
 * Get the result of the last middleware operation.
 *
 * @param {Object} res - The result object.
 * @returns {Object} The result of the middleware operation.
 */
export const getResult = (res) => {
  return res.tralse_db_mysql.middleware;
};
