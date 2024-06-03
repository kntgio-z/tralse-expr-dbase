import { Pool, PoolConnection as MySequelizeConnection } from "mysql2/promise";

export interface MySequelizePool extends Pool {}
export interface Connection extends MySequelizeConnection {}

export interface DatabaseObject {
  connection: Connection;
  referenceNo?: string | null;
}

export interface TransactionMethods {
  /**
   * Initializes a transaction.
   *
   * @param {string|string[]} sql - The SQL query or queries to execute.
   * @param {any|any[]} [params=[]] - The parameters for the SQL query or queries.
   * @param {Function} [generateReferenceNo=null] - A function to generate a reference number.
   * @returns {Promise<any|any[]>} - The result of the query or queries.
   * @throws {TransactionError} - If there is an error initializing the transaction.
   */
  init: (
    sql: string | string[],
    params?: any[],
    generateReferenceNo?: (() => string) | null
  ) => Promise<any[]>;
  /**
   * Commits a transaction.
   *
   * @returns {Promise<void>} - Promise indicating success or failure of the commit operation.
   * @throws {TransactionError} - If there is an error committing the transaction.
   */
  commit: () => Promise<void>;
  /**
   * Rolls back a transaction.
   *
   * @returns {Promise<void>} - Promise indicating success or failure of the rollback operation.
   * @throws {TransactionError} - If there is an error rolling back the transaction.
   */
  rollback: () => Promise<void>;
  /**
   * Retrieves records related to the transaction.
   *
   * @returns {Object} - Object containing transaction-related records.
   */
  retrieve: (
    req: Request,
    dbName: string
  ) => { connection: string; error?: string };
}
export interface DatabaseInstance {
  /**
   * Initializes a database connection and attaches it to the request object.
   *
   * @returns {Promise<void>}
   * @throws {DatabaseError} - If there is an error initializing the connection.
   */
  initializeConnection: () => Promise<void>;
  /**
   * Executes a database query.
   *
   * @param {string} sql - The SQL query to execute.
   * @param {Array<any>} [params=[]] - The parameters for the SQL query.
   * @returns {Promise<any>} - The result of the query.
   */
  query: (sql: string | string[], params?: any[]) => Promise<any[]>;
  /**
   * Initializes a database transaction.
   *
   * @param {string} [isolationLevel="READ COMMITTED"] - The isolation level for the transaction.
   * @returns {Promise<TransactionMethods>} - The transaction methods.
   */
  transaction?: (isolationLevel?: string) => Promise<TransactionMethods>;
  /**
   * Releases the current database connection.
   *
   * @returns {Promise<void>}
   */
  releaseConnection: () => Promise<void>;
  /**
   * Terminates the database connection pool.
   *
   * @returns {Promise<void>}
   * @throws {DatabaseError} - If there is an error terminating the connection pool.
   */
  terminate: () => Promise<void>;
}

declare module "express-serve-static-core" {
  interface Request {
    tralse_db_mysql?: Record<string, DatabaseInstance>;
  }
}
