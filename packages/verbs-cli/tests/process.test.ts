import { describe, it, expect } from "vitest";
import process from "../src/process.js";

import { Step } from "../src/types.js";

describe("resolve result promise", () => {
  it("takes a result promise, returns result or error", async () => {
    const program = "echo";
    const args = ["hello"];
    const resultPromise = process.runStep(program, args);
    const { result, error } =
      await process.util.resolveResultPromise(resultPromise);
    expect(result?.stdout).toBe("hello");
    expect(error).toBe(undefined);
  });
});

describe("run steps", () => {
  it("runs multiple steps", async () => {
    const steps: Step[] = [
      { type: "process", program: "echo", args: ["hello"] },
      { type: "process", program: "echo", args: ["world"] },
      { type: "process", program: "echo", args: ["!"] },
    ] as const;
    const { successful, errorMessage } = await process.runSteps(steps);
    expect(successful).toBe(true);
    expect(errorMessage).toBe(undefined);
  });
});
