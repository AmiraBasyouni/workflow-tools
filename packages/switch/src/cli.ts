#!/usr/bin/env node

import process from "process";
import packageJson from "../package.json" with { type: "json" };
import { parseArgs } from "node:util";

import printHelp from "./printHelp.js";

const { positionals, values: flagValues } = parseArgs({
  args: process.argv.slice(2),
  options: {
    version: { type: "boolean", short: "v", default: false },
    help: { type: "boolean", short: "h", default: false },
    default: { type: "string" },
  },
  allowPositionals: true,
});

const args: string[] = process.argv.slice(2);
const hasOnlyOneArg = args.length === 1;

// respond to --version
if (flagValues.version) {
  if (!hasOnlyOneArg) {
    console.error("error: --version must be used by itself.");
    process.exit(1);
  }
  console.log(`@amirab/switch ${packageJson.version}`);
  process.exit(0);
}
// respond to --help
if (flagValues.help) {
  if (!hasOnlyOneArg) {
    console.error("error: --help must be used by itself.");
    process.exit(1);
  }
  printHelp();
  process.exit(0);
}

const input = positionals[0];
const switchCases = positionals.slice(1);

const cases = switchCases.filter((e, i) => i % 2 === 0);
const outputs = switchCases.filter((e, i) => i % 2 === 1);

// ERROR HANDLING:
if (cases.length !== outputs.length) {
  const caseS = cases.length > 1 ? "cases" : "case";
  const outputS = outputs.length > 1 ? "outputs" : "output";
  const errorMessages = [
    "Error: invalid usage.",
    `  Received: ${cases.length} ${caseS} and ${outputs.length} ${outputS}.`,
    "  Expected usage: quantity of cases must match quantity of outputs.",
    "  Expected format: <input> <case_1> <output_1> <case_2> <output_2> ...",
  ];
  errorMessages.forEach((m) => console.error(m));
  process.exit(1);
}

// RESOLVE SWITCH CASE
for (let i = 0; i < cases.length; i++) {
  if (typeof cases[i] === "string" && typeof outputs[i] === "string") {
    if (input === cases[i]) {
      console.log(outputs[i]);
      process.exit(0);
    }
  }
}
if (typeof flagValues.default === "string") {
  console.log(flagValues.default);
  process.exit(0);
}

// NO MATCH FOUND
process.exit(1);
