#!/usr/bin/env node

import packageJson from "../package.json" with { type: "json" };
import process from "process";
import { parseArgs } from "node:util";
import validator from "./validator.js";
import session from "./session.js";
import output from "./output.js";
import printHelp from "./printHelp.js";

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
    version: { type: "boolean", short: "v", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
});

const args = process.argv.slice(2);
const hasOnlyOneArg = args.length === 1

if (flagValues.help) {
  if (!hasOnlyOneArg) {
    console.error("error: --help must be used by itself.");
    process.exit(1);
  }

  printHelp();
  process.exit(0);
}

if (flagValues.version) {
  if (!hasOnlyOneArg) {
    console.error("error: --version must be used by itself.");
    process.exit(1);
  }

  console.log(`@amirab/prompt ${packageJson.version}`);
  process.exit(0);
}

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
