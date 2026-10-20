#!/usr/bin/env node

import packageJson from "../package.json" with { type: "json" };
import process from "process";
import { parseArgs } from "node:util";
import validator from "./validator.js";
import runPromptingSession from "./runPromptingSession.js";
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
    answer: { type: "string" },
    version: { type: "boolean", short: "v", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
});

const args = process.argv.slice(2);
const hasOnlyOneArg = args.length === 1;

// respond to --help
if (flagValues.help) {
  if (!hasOnlyOneArg) {
    console.error("error: --help must be used by itself.");
    process.exit(1);
  }

  printHelp();
  process.exit(0);
}

// respond to --version
if (flagValues.version) {
  if (!hasOnlyOneArg) {
    console.error("error: --version must be used by itself.");
    process.exit(1);
  }

  console.log(`@amirab/prompt ${packageJson.version}`);
  process.exit(0);
}

// CREATE SCHEMA FOR INPUT VALIDATION
const schema = validator.buildSchemaFromFlags(flagValues);

// respond to --answer
if (typeof flagValues.answer === "string") {
  // if answer is valid, output it then early exit.
  const answerStatus = validator.validate(flagValues.answer, schema);
  if (answerStatus.valid) {
    const response = { successful: true, exitCode: 0, data: answerStatus.data };
    output(response, flagValues.null);
    process.exit(0);
  } else {
    // if answer is invalid, print errors.
    validator.printValidationErrors(answerStatus.errors);
  }
}

// Extract the prompt message from the first positional argument.
const message = positionals[0] || "Enter input: ";

try {
  // RUN PROMPTING SESSION
  const sessionResponse = await runPromptingSession(message, schema);
  // STDOUT RESPONSE
  output(sessionResponse, flagValues.null);
} catch (e) {
  // Checking "error instanceof Error" satisfies TypeScript's strict unknown error
  if (e instanceof Error) {
    console.error(`\nError: ${e.message}\n`);
  } else {
    console.error("\nAn unexpected error occurred.\n");
  }
  process.exit(1);
}
