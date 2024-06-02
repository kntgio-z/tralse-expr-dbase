# Express Object Fluent Object Constructor

## Description

This utility function offers a skeleton for constructing Express request objects with a fluent interface in JavaScript. It simplifies the creation of complex nested structures by enabling method chaining.

## Note

This implementation only supports linear chaining, not a tree approach.

## Usage

```javascript
import { fluent } from "./fluent-object-constructor.js";

// Example usage
const firstNameBuilder = fluent("context");

objBuilder.attr("body").attr("first").value("John");

const constructedObject = objBuilder.result;
console.log(constructedObject);
```

## Constraints

- Linear chaining is supported; however, nesting beyond one level is not permitted.
- When constructing query or params objects, chaining for these contexts is restricted to a single level.
