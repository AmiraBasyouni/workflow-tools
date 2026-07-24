import { describe, it, expect } from "vitest";
import process from "../src/process.js";

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
