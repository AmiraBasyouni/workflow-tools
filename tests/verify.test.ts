import { describe, it, expect } from "vitest";
import verify from "../src/verify.js";

describe("cwd validity", () => {
  it("checks that cwd is of type string", () => {
    expect(verify.cwdValidity(3).isValidCWD).toBe(false);
  });
  it("checks that cwd is a valid directory", () => {
    expect(verify.cwdValidity("").isValidCWD).toBe(false);
    expect(verify.cwdValidity("./").isValidCWD).toBe(true);
  });
});
