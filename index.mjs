import {
  getDbObject,
  serializeConnection,
  dispatchDbObject,
} from "./lib/object.mjs";
import { executeDbQuery } from "./lib/query.mjs";

import { log } from "./util/console.mjs";
import { DatabaseError } from "./errors/error.mjs";
import { initializeDbTransaction } from "./lib/transactions.mjs";

/**
 * @typedef {import("./types/index").Connection} Connection
 
 * @typedef {import("./types/index").QueryResult} QueryResult
 * @typedef {import("./types/index").DatabaseObject} DatabaseObject
 * @typedef {import("./types/index").TransactionMethods} TransactionMethods
 * @typedef {import("./types/index").DatabaseInstance} DatabaseInstance
 */

/**
 * Initializes the database and provides query and transaction methods.
 *
 * @param {Object} req - The request object.
 * @param {import('mysql2/promise').Pool} pool - The database connection pool.
 * @param {string} dbName - The name of the database.
 * @param {boolean} enableTransactions - Whether to enable transaction support.
 * @returns {Promise<DatabaseInstance>} - The initialized database object.
 * @throws {DatabaseError} - If there is an error initializing the database.
 */
const initializeDatabase = async (req, pool, dbName, enableTransactions) => {
  const initializeConnection = async () => {
    try {
      console.log("hi im from initialize");
      const connection = await pool.getConnection();
      serializeConnection(req, connection);
      console.log("hi");
      log(dbName, "Connection initialized.");
    } catch (error) {
      console.log(error);
      throw new DatabaseError(`Error initializing database.${error}`);
    }
  };

  const query = async (sql, params = []) => {
    return await executeDbQuery(req, dbName, sql, params);
  };

  const transaction = async (isolationLevel = "READ COMMITTED") => {
    return await initializeDbTransaction(req, dbName, isolationLevel);
  };

  const releaseConnection = async () => {
    const { connection } = getDbObject(req, dbName);

    dispatchDbObject(req, dbName);
    await connection.release();
  };

  const terminate = async () => {
    if (pool) {
      try {
        await pool.end();
        log(dbName, "Database connection pool terminated.");
      } catch (error) {
        log(
          dbName,
          `Failed to terminate database connection pool: ${error.message}`
        );
        throw new DatabaseError(
          `Failed to terminate database connection pool: ${error.message}`
        );
      }
    }
  };

  return enableTransactions
    ? { initializeConnection, query, transaction, releaseConnection, terminate }
    : { initializeConnection, query, releaseConnection, terminate };
};

/**
 * Middleware to attach TralseMySQL to requests.
 *
 * @param {import('mysql2/promise').Pool} pool - The database connection pool.
 * @param {string} dbName - The name of the database.
 * @param {boolean} [enableTransactions=false] - Whether to enable transaction support.
 * @returns {Function} - The middleware function.
 */
export const TralseMySQL =
  (pool, dbName, enableTransactions = false) =>
  async (req, res, next) => {
    try {
      req.tralse_db_mysql = req.tralse_db_mysql || {};
      const dbInstance = await initializeDatabase(
        req,
        pool,
        dbName,
        enableTransactions
      );
      req.tralse_db_mysql[dbName] = dbInstance;

      next();
    } catch (error) {
      log(dbName, error.message);
      return res.status(500).json({
        status: 500,
        code: "DATABASE_INIT_ERROR",
        error: "Error initializing database.",
      });
    }
  };
