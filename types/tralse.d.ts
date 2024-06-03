import { Pool, PoolConnection as MySequelizeConnection } from "mysql2/promise";
import { Request, Response, NextFunction } from "express";

export interface MySequelizePool extends Pool {}
export interface Connection extends MySequelizeConnection {}

export interface DatabaseObject {
  connection: Connection;
  referenceNo?: string | null;
}

export interface TransactionMethods {
  init: (
    sql: string | string[],
    params?: any[],
    generateReferenceNo?: (() => string) | null
  ) => Promise<any[]>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  retrieve: (
    req: Request,
    dbName: string
  ) => { connection: Connection; error?: string }; // Changed `connection: string` to `connection: Connection`
}

export interface DatabaseInstance {
  initializeConnection: () => Promise<void>;
  query: (sql: string | string[], params?: any[]) => Promise<any[]>;
  transaction?: (isolationLevel?: string) => Promise<TransactionMethods>;
  releaseConnection: () => Promise<void>;
  terminate: () => Promise<void>;
}

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

declare module "express-serve-static-core" {
  interface Request {
    tralse_db_mysql?: Record<string, DatabaseInstance>;
  }
}
