import { manageDeadlocks } from "./deadlock.mjs";
import { DatabaseError } from "../errors/error.mjs";
import { getDbObject } from "./object.mjs";
import { log } from "../util/console.mjs";

/**
 
 * @typedef {import("../types/index").QueryResult} QueryResult
 */

/**
 * Executes a database query with deadlock management.
 *
 * @param {Object} req - The request object.
 * @param {string} dbName - The name of the database connection.
 * @param {string|Array<string>} sql - The SQL query or queries to execute.
 * @param {Array<any>|Array<Array<any>>} [params=[]] - The parameters for the SQL query or queries.
 * @returns {Promise<QueryResult>} - The result of the query or queries.
 * @throws {DatabaseError} - If query execution fails.
 */
export const executeDbQuery = async (req, dbName, sql, params = []) => {
  return await manageDeadlocks(3, async () => {
    const { connection } = getDbObject(req);

    try {
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
      log(dbName, "Query executed successfully.");
      return queryResult;
    } catch (error) {
      log(dbName, `Query execution failed: ${error.message}`);
      throw new DatabaseError(`Query execution failed: ${error.message}`);
    }
  });
};
