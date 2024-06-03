declare module "tralsedb-express-mysql" {
  import {
    Pool,
    PoolConnection as MySequelizeConnection,
  } from "mysql2/promise";
  import { Request, Response, NextFunction } from "express";

  export * from "./tralse";

  export interface MySequelizePool extends Pool {}
  export interface Connection extends MySequelizeConnection {}

  /**
   * Middleware to attach TralseMySQL to requests.
   *
   * @param {import('mysql2/promise').Pool} pool - The database connection pool.
   * @param {string} dbName - The name of the database.
   * @param {boolean} [enableTransactions=false] - Whether to enable transaction support.
   * @returns {(req: Request, res: Response, next: NextFunction) => Promise<void>} - The middleware function.
   */
  export const TralseMySQL: (
    /**
     * The database connection pool.
     */
    pool: MySequelizePool,
    /**
     * The name of the database.
     */
    dbName: string,
    /**
     * Whether to enable transaction support.
     */
    enableTransactions?: boolean
  ) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
