import { Pool, PoolConnection as MySequelizeConnection } from "mysql2/promise";

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
  ) => { connection: string; error?: string };
}

export interface DatabaseInstance {
  initializeConnection: () => Promise<void>;
  query: (sql: string | string[], params?: any[]) => Promise<any[]>;
  transaction?: (isolationLevel?: string) => Promise<TransactionMethods>;
  releaseConnection: () => Promise<void>;
  terminate: () => Promise<void>;
}

declare module "express-serve-static-core" {
  interface Request {
    tralse_db_mysql?: Record<string, DatabaseInstance>;
  }
}
