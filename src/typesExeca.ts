import { Readable } from "node:stream";

import { type Result, type StdinOption, type ResultPromise } from "execa";
type InputOption = string | Uint8Array | Readable;

export { Result, StdinOption, InputOption, ResultPromise };
