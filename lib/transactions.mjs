import { getDbObject, updateDbObject } from "./object.mjs";

import { log } from "../util/console.mjs";
import { TransactionError, DatabaseError } from "../errors/error.mjs";
import { manageDeadlocks } from "./deadlock.mjs";

/**
 
 * @typedef {import("../types/index").TransactionMethods} TransactionMethods
 */

/**
 * Initializes a transaction.
 *
 * @param {Object} req - The request object.
 * @param {string} dbName - The name of the database connection.
 * @param {string} [isolationLevel="READ COMMITTED"] - The transaction isolation level.
 * @returns {Promise<TransactionMethods>} - The transaction methods.
 * @throws {TransactionError} - If there is an error initializing the transaction.
 */
export const initializeDbTransaction = async (
  req,
  dbName,
  isolationLevel = "READ COMMITTED"
) => {
  return await manageDeadlocks(3, async () => {
    /**
     * Initializes a transaction.
     *
     * @param {string|string[]} sql - The SQL query or queries to execute.
     * @param {any|any[]} [params=[]] - The parameters for the SQL query or queries.
     * @param {Function} [generateReferenceNo=null] - A function to generate a reference number.
     * @returns {Promise<any|any[]>} - The result of the query or queries.
     * @throws {TransactionError} - If there is an error initializing the transaction.
     */
    const initTransaction = async (
      sql,
      params = [],
      generateReferenceNo = null
    ) => {
      try {
        const { connection } = getDbObject(req);

        await connection.beginTransaction({ isolationLevel });

        let queryResult;
        if (Array.isArray(sql)) {
          if (!Array.isArray(params) || sql.length !== params.length) {
            throw new DatabaseError("Mismatched SQL queries and parameters.");
          }
          queryResult = [];
          for (let i = 0; i < sql.length; i++) {
            const [rows] = await connection.execute(sql[i], params[i]);
            queryResult.push(rows);
          }
        } else {
          const [rows] = await connection.execute(sql, params);
          queryResult = rows;
        }
        log(dbName, "Transaction query executed successfully.");
        const referenceNo = generateReferenceNo
          ? generateReferenceNo()
          : "refNo";
        const transactionData = {
          referenceNo,
        };

        updateDbObject(req, transactionData);
        log(dbName, "Success: Reference no: " + referenceNo);
        return queryResult;
      } catch (error) {
        log(dbName, `Transaction initialization interrupted: ${error.message}`);
        await rollbackTransaction();
        throw new TransactionError(
          `Failed to initialize transaction: ${error.message}`
        );
      }
    };

    /**
     * Commits a transaction.
     *
     * @returns {Promise<void>} - Promise indicating success or failure of the commit operation.
     * @throws {TransactionError} - If there is an error committing the transaction.
     */
    const commitTransaction = async () => {
      const { connection, referenceNo } = getDbObject(req);

      try {
        await connection.commit();
        log(
          `${dbName}_transact_${referenceNo}`,
          "Transaction committed successfully."
        );
      } catch (error) {
        await rollbackTransaction();
        log(
          `${dbName}_transact_${referenceNo}`,
          `Failed to commit transaction: ${error.message}`
        );
        throw new TransactionError(
          `Failed to commit transaction: ${error.message}`
        );
      }
    };

    /**
     * Rolls back a transaction.
     *
     * @returns {Promise<void>} - Promise indicating success or failure of the rollback operation.
     * @throws {TransactionError} - If there is an error rolling back the transaction.
     */
    const rollbackTransaction = async () => {
      const { connection, referenceNo } = getDbObject(req);

      try {
        await connection.rollback();
        log(
          `${dbName}_transact_${referenceNo}`,
          "Transaction rolled back successfully."
        );
      } catch (error) {
        log(
          `${dbName}_transact_${referenceNo}`,
          `Failed to rollback transaction: ${error.message}`
        );
        throw new TransactionError(
          `Failed to rollback transaction: ${error.message}`
        );
      }
    };

    /**
     * Retrieves records related to the transaction.
     *
     * @returns {Object} - Object containing transaction-related records.
     */
    const retrieveRecords = () => {
      let dbObject;
      try {
        dbObject = getDbObject(req);
        return { ...dbObject, connection: "initialized" };
      } catch (error) {
        return { connection: "not initialized", error: error.message };
      }
    };

    return {
      init: initTransaction,
      commit: commitTransaction,
      rollback: rollbackTransaction,
      retrieve: retrieveRecords,
    };
  });
};
