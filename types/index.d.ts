declare module "tralsedb-express-mysql" {
  import {
    Pool,
    PoolConnection as MySequelizeConnection,
  } from "mysql2/promise";
  import { Request, Response, NextFunction } from "express";

  import { DatabaseInstance } from "./tralse";

  export * from "./tralse";

  export interface MySequelizePool extends Pool {}
  export interface Connection extends MySequelizeConnection {}

  export const TralseMySQL: (
    pool: MySequelizePool,
    dbName: string,
    enableTransactions?: boolean
  ) => (req: Request, res: Response, next: NextFunction) => Promise<void>;

  export const initializeDatabase: (
    req: Request,
    pool: MySequelizePool,
    dbName: string,
    enableTransactions: boolean
  ) => Promise<DatabaseInstance>;

  export function log(dbName: string, message: string): void;
}
