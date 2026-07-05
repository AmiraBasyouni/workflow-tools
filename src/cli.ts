#!/usr/bin/env node

import process from "process";
import core from "./core";

const cwd: string = process.env.INIT_CWD || process.cwd();
const args: string[] = process.argv.slice(2);

core(cwd, args);
