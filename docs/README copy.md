# ExpressTralseDbMySql Middleware

ExpressTralseDbMySql is a middleware for managing database connections, queries, and transactions in an Express application which uses MySQL database. It handles deadlocks with exponential backoff and provides robust error handling.

## Key Features

- Deadlock management with exponential backoff
- Modular functions for database operations

## Installation

```bash
npm install mysql2
```

## Setup

```javascript
import { ExpressTralseDbMySql } from "./path/to/your/module";
import mysql from "mysql2/promise";

// Pool creation
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "test",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware usage
app.use(ExpressTralseDbMySql(pool, "dbName", true));
```

## Usage

### Executing Query

```javascript
app.post("/execute-query", async (req, res) => {
  // Retrieves db methods from request object
  const { initializeConnection, query, releaseConnection } =
    req.tralse_db_mysql.dbName;

  try {
    // Initializes connection, connection thread start
    await initializeConnection();

    // Actual query
    const result = await query("SELECT 1");
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    // Releases connection
    await releaseConnection();
  }
});
```

### Performing Transactions

```javascript
app.post("/transaction", async (req, res) => {
  // Retrieves db methods from request object
  const {
    initializeConnection,
    transaction: transactionCallback,
    releaseConnection,
  } = req.tralse_db_mysql.dbName;

  try {
    // Initializes connection, connection thread start
    await initializeConnection();

    // Fetches transaction methods
    const { init, commit } = await transactionCallback();

    // Initializes payment
    await init(
      [
        "INSERT INTO accounts (user_id, balance) VALUES (?, ?)",
        "UPDATE users SET account_id = LAST_INSERT_ID() WHERE id = ?",
      ],
      [[req.body.user_id, req.body.initial_balance], [req.body.user_id]]
    );

    await commit();
    res.json({ message: "Transaction committed successfully" });
  } catch (error) {
    // Automatically rolled back in commit method when interrupted.
    res.status(500).json({ error: "Transaction failed: " + error.message });
  } finally {
    await releaseConnection();
  }
});
```
