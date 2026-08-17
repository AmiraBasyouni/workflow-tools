// UNIT TEST: verify schema rules.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import validator from "../src/validator.js";

// TYPE STRING
describe("Validator - String Mode", () => {
  test("allows empty input when no min constraint is set", () => {
    const schema = validator.buildSchemaFromFlags({});
    const result = validator.validate("", schema);
    assert.equal(result.success, true);
  });

  test("enforces string length constraints", () => {
    const schema = validator.buildSchemaFromFlags({ min: "3", max: "5" });

    assert.equal(validator.validate("hi", schema).success, false);
    assert.equal(validator.validate("hello", schema).success, true);
    assert.equal(validator.validate("hello world", schema).success, false);
  });

  test("enforces regex patterns", () => {
    const schema = validator.buildSchemaFromFlags({ regex: "^[a-z]+$" });

    assert.equal(validator.validate("abc", schema).success, true);
    assert.equal(validator.validate("123", schema).success, false);
  });
});

// TYPE NUMBER
describe("Validator - Number Mode", () => {
  test("rejects empty input on number prompts", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });
    const result = validator.validate("", schema);

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.errors[0], "Input cannot be empty");
    }
  });

  test("coerces numeric strings into numbers", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });
    const result = validator.validate("42", schema);

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data, 42);
      assert.equal(typeof result.data, "number");
    }
  });

  test("rejects non-numeric text", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });
    const result = validator.validate("abc", schema);

    assert.equal(result.success, false);
  });

  test("enforces min and max numeric bounds", () => {
    const schema = validator.buildSchemaFromFlags({
      type: "number",
      min: "10",
      max: "20",
    });

    assert.equal(validator.validate("5", schema).success, false);
    assert.equal(validator.validate("15", schema).success, true);
    assert.equal(validator.validate("25", schema).success, false);
  });
});

// ERROR MESSAGES
describe("Validator - Error Messages", () => {
  test("returns accurate error messages on failure", () => {
    const stringSchema = validator.buildSchemaFromFlags({ min: "5" });
    const stringResult = validator.validate("hi", stringSchema);
    assert.equal(stringResult.success, false);
    if (!stringResult.success) {
      assert.deepEqual(stringResult.errors, ["Must be at least 5 characters"]);
    }

    const numSchema = validator.buildSchemaFromFlags({ type: "number", min: "10" });
    const numResult = validator.validate("5", numSchema);
    assert.equal(numResult.success, false);
    if (!numResult.success) {
      assert.deepEqual(numResult.errors, ["Must be >= 10"]);
    }
  });
});

// EDGE CASES
describe("Validator - Edge Cases", () => {
  test("trims leading/trailing whitespace before validating", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });
    assert.equal(validator.validate("  42  ", schema).success, true);
  });

  test("rejects whitespace-only input when length constraints exist", () => {
    const schema = validator.buildSchemaFromFlags({ min: "1" });
    assert.equal(validator.validate("   ", schema).success, false);
  });


  test("handles decimal numbers correctly", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });
    const result = validator.validate("3.14", schema);
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data, 3.14);
  });

  test("handles negative numbers correctly", () => {
    const schema = validator.buildSchemaFromFlags({
      type: "number",
      min: "-10",
    });
    assert.equal(validator.validate("-5", schema).success, true);
  });
    test("rejects malformed numbers and non-finite values", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });

    assert.equal(validator.validate("1.2.3", schema).success, false);
    assert.equal(validator.validate("NaN", schema).success, false);
    assert.equal(validator.validate("Infinity", schema).success, false);
  });

  test("applies min, max, and regex constraints together", () => {
    const schema = validator.buildSchemaFromFlags({
      min: "3",
      max: "5",
      regex: "^[a-z]+$",
    });

    assert.equal(validator.validate("ab", schema).success, false);     // Fails min
    assert.equal(validator.validate("abcdef", schema).success, false); // Fails max
    assert.equal(validator.validate("1234", schema).success, false);   // Fails regex
    assert.equal(validator.validate("code", schema).success, true);     // Passes all
  });

});


