import test from "node:test";
import assert from "node:assert/strict";
import { getCategorySuggestion, getRiskHint, isStoredMessages } from "../messageRules.js";

const message = (overrides = {}) => ({
  id: "test-1",
  sender: "Example Sender",
  initials: "ES",
  preview: "A normal message",
  time: "10:00",
  category: "Personal",
  unread: false,
  important: false,
  blocked: false,
  ...overrides,
});

test("suggests Promotions for promotional wording without overriding an existing category", () => {
  assert.equal(getCategorySuggestion(message({ preview: "Special discount offer today" })).category, "Promotions");
  assert.equal(getCategorySuggestion(message({ category: "Promotions", preview: "Special discount offer today" })), null);
});

test("suggests Updates for transactional wording", () => {
  assert.equal(getCategorySuggestion(message({ preview: "Your package is out for delivery" })).category, "Updates");
  assert.equal(getCategorySuggestion(message({ category: "Updates", preview: "Your package is out for delivery" })), null);
});

test("risk hints explain urgency, credential requests, links, and prize language", () => {
  const reasons = getRiskHint(message({
    preview: "FINAL WARNING: verify your password immediately at https://example.invalid; claim your prize",
  }));
  assert.equal(reasons.length, 4);
  assert.ok(reasons.some((reason) => reason.includes("urgent")));
  assert.ok(reasons.some((reason) => reason.includes("credentials")));
  assert.ok(reasons.some((reason) => reason.includes("web link")));
  assert.ok(reasons.some((reason) => reason.includes("prize")));
});

test("ordinary text produces no risk hint", () => {
  assert.deepEqual(getRiskHint(message({ preview: "See you at the station at six." })), []);
});

test("malformed message inputs do not crash rule helpers", () => {
  assert.equal(getCategorySuggestion(null), null);
  assert.equal(getCategorySuggestion("discount"), null);
  assert.deepEqual(getRiskHint(null), []);
  assert.deepEqual(getRiskHint({ sender: 42, preview: null }), []);
});

test("stored messages validation accepts valid records and rejects malformed records", () => {
  assert.equal(isStoredMessages([message()]), true);
  assert.equal(isStoredMessages([]), true);
  assert.equal(isStoredMessages(null), false);
  assert.equal(isStoredMessages([message({ unread: "false" })]), false);
  assert.equal(isStoredMessages([message({ category: "Unknown" })]), false);
  assert.equal(isStoredMessages([message({ riskFeedback: "approved" })]), false);
});

test("stored messages validation rejects sparse arrays and array-shaped records", () => {
  const sparse = [];
  sparse.length = 1;
  assert.equal(isStoredMessages(sparse), false);
  assert.equal(isStoredMessages([[message()]]), false);
});
