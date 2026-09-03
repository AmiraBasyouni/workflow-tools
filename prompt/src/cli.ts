#!/usr/bin/env node

import process from "process";
import { parseArgs } from "node:util";
import validator from "./validator.js";
import session from "./session.js";
import output from "./output.js";

// Parse terminal arguments & flags.
// positionals: Array of unflagged arguments.
// flagValues: Object containing configured flags.
const { positionals, values: flagValues } = parseArgs({
  args: process.argv.slice(2),
  options: {
    type: { type: "string", default: "string" },
    min: { type: "string" },
    max: { type: "string" },
    regex: { type: "string" },
    null: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

// Extract the prompt message from the first positional argument.
const message = positionals[0] || "Enter input: ";

try {
  // CREATE SCHEMA FOR INPUT VALIDATION
  const schema = validator.buildSchemaFromFlags(flagValues);
  // RUN PROMPTING SESSION
  const userResponse = await session(message, schema);
  // STDOUT RESPONSE
  output(userResponse, flagValues.null);
} catch (e) {
  // Checking "error instanceof Error" satisfies TypeScript's strict unknown error
  if (e instanceof Error) {
    console.error(`\nError: ${e.message}\n`);
  } else {
    console.error("\nAn unexpected error occurred.\n");
  }
  process.exit(1);
}
