# tralsedb-express-mysql

tralsedb-express-mysql package provides methods and middlewares for managing database connections, queries, and transactions in an Express application which uses MySQL database. It handles deadlocks with exponential backoff and provides robust error handling.

## Key Features

- Deadlock management with exponential backoff
- Modular functions for database operations

## Installation

```bash
npm install mysql2
```

## Setup

```javascript
import { TralseMySQL } from "./path/to/module";
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
app.use(TralseMySQL(pool, "dbName", true));
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

### Performing Transactions (Separated)

#### Initialization

```javascript
app.post("/pay", async (req, res) => {
  const { initializeConnection, transaction: transactionCallback } =
    req.tralse_db_mysql.sample;

  try {
    await initializeConnection();
    const { init } = await transactionCallback();

    await init(
      [
        "INSERT INTO accounts (user_id, balance) VALUES (?, ?)",
        "UPDATE users SET account_id = LAST_INSERT_ID() WHERE id = ?",
      ],
      [[req.body.user_id, req.body.initial_balance], [req.body.user_id]]
    );
    res.json({ message: "Transaction initialized successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Transaction failed: " + error.message });
  }
});
```

#### Commit

```javascript
app.post("/confirm", async (req, res) => {
  const { transaction: transactionCallback, releaseConnection } =
    req.tralse_db_mysql.sample;

  try {
    const { commit } = await transactionCallback();

    await commit();
    res.json({ message: "Transaction commited successfully" });
  } catch (error) {
    // Automatically rolled back.
    console.log(error);
    res.status(500).json({ error: "Transaction failed: " + error.message });
  } finally {
    await releaseConnection();
  }
});
```

#### Rollback

```javascript
app.post("/cancel", async (req, res) => {
  const { transaction: transactionCallback, releaseConnection } =
    req.tralse_db_mysql.sample;

  try {
    const { rollback } = await transactionCallback();

    await rollback();
    res.json({ message: "Transaction commited successfully" });
  } catch (error) {
    // Automatically rolled back.
    console.log(error);
    res.status(500).json({ error: "Transaction failed: " + error.message });
  } finally {
    await releaseConnection();
  }
});
```

### Using Built-In Middleware for Transactions

```javascript
import {
  initialize,
  commit,
  rollback,
  getResult,
} from "/path/to/transaction/middleware.mjs";

import { fluent } from "/path/to/fluent/index.mjs";

app.use(
  "/pay",
  initialize(
    "sample",
    [
      "INSERT INTO accounts (user_id, balance) VALUES (?, ?)",
      "UPDATE users SET account_id = LAST_INSERT_ID() WHERE id = ?",
    ],
    [
      [fluent("body").attr("user_id"), fluent("body").attr("initial_balance")],
      [fluent("body").attr("user_id")],
    ]
  ),
  (req, res) => {
    const { error, result } = getResult(res);

    if (error) {
      res.status(500).send({ code: "INTERNAL_SERVER_ERROR", error });
    }

    res.send(result);
  }
);

app.use("/confirm", commit("sample"), (req, res) => {
  const { error, result } = getResult(res);

  if (error) {
    res.status(500).send({ code: "INTERNAL_SERVER_ERROR", error });
  }

  res.send("OK");
});

app.use("/cancel", rollback("sample"), (req, res) => {
  const { error, result } = getResult(res);

  if (error) {
    res.status(500).send({ code: "INTERNAL_SERVER_ERROR", error });
  }

  res.send("OK");
});
```
