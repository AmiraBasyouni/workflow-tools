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

describe("step validity", () => {
  const validStep = { type: "process", program: "ls", args: [] };

  it("accepts a valid step", () => {
    expect(verify.stepValidity(validStep).valid).toBe(true);
  });

  it("rejects invalid step types", () => {
    const invalidTypeSteps = [
      { ...validStep, type: 123 },
      { ...validStep, type: null },
      { ...validStep, type: undefined },
    ];
    invalidTypeSteps.forEach((invalidStep) => {
      const result = verify.stepValidity(invalidStep);
      expect(result.valid).toBe(false);
      expect(result.errors?.invalidType).toBe(true);
    });
  });

  it("rejects invalid step programs", () => {
    const invalidProgramSteps = [
      { ...validStep, program: 123 },
      { ...validStep, program: undefined },
      { ...validStep, program: null },
    ];
    invalidProgramSteps.forEach((invalidStep) => {
      const result = verify.stepValidity(invalidStep);
      expect(result.valid).toBe(false);
      expect(result.errors?.invalidProgram).toBe(true);
    });
  });

  it("rejects invalid step arguments", () => {
    const invalidArgs = [
      { ...validStep, args: 123 },
      { ...validStep, args: undefined },
      { ...validStep, args: null },
    ];
    invalidArgs.forEach((invalidStep) => {
      const result = verify.stepValidity(invalidStep);
      expect(result.valid).toBe(false);
      expect(result.errors?.invalidArguments).toBe(true);
    });
  });

  it("rejects invalid step options", () => {
    const invalidOptions = [
      { ...validStep, options: 123 },
      { ...validStep, options: "opts" },
      { ...validStep, options: null },
    ];
    invalidOptions.forEach((invalidStep) => {
      const result = verify.stepValidity(invalidStep);
      expect(result.valid).toBe(false);
      expect(result.errors?.invalidOptions).toBe(true);
    });
  });

  it("rejects invalid timeout option", () => {
    const invalidTimeout = [
      { ...validStep, options: { timeout: [123] } },
      { ...validStep, options: { timeout: "123" } },
      { ...validStep, options: { timeout: null } },
    ];
    invalidTimeout.forEach((invalidStep) => {
      const result = verify.stepValidity(invalidStep);
      expect(result.valid).toBe(false);
      expect(result.errors?.invalidTimeout).toBe(true);
    });
  });

  it("rejects invalid pipe option", () => {
    const invalidPipe = [
      { ...validStep, options: { pipe: 123 } },
      { ...validStep, options: { pipe: "opts" } },
      { ...validStep, options: { pipe: null } },
    ];
    invalidPipe.forEach((invalidStep) => {
      const result = verify.stepValidity(invalidStep);
      expect(result.valid).toBe(false);
      expect(result.errors?.invalidPipeOption).toBe(true);
    });
  });
});
