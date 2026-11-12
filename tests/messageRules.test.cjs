const test = require("node:test");
const assert = require("node:assert/strict");
const { getCategorySuggestion, getRiskHint, isStoredMessages } = require("../messageRules");

const message = (overrides = {}) => ({
  id: "test-1",
  sender: "Test sender",
  initials: "TS",
  preview: "A normal message",
  time: "Today",
  category: "Personal",
  unread: false,
  important: false,
  blocked: false,
  ...overrides,
});

test("suggests Promotions for promotional wording", () => {
  assert.equal(getCategorySuggestion(message({ preview: "Your discount deal is ready" })).category, "Promotions");
});

test("does not suggest the category already assigned", () => {
  assert.equal(getCategorySuggestion(message({ category: "Promotions", preview: "A discount offer" })), null);
});

test("returns distinct reasons for urgency, credential requests, and links", () => {
  const reasons = getRiskHint(message({ preview: "FINAL WARNING: verify your password at https://example.invalid" }));
  assert.equal(reasons.length, 3);
  assert.match(reasons[0], /urgent or threatening/);
  assert.match(reasons[1], /credentials/);
  assert.match(reasons[2], /web link/);
});

test("accepts valid stored conversations including feedback", () => {
  assert.equal(isStoredMessages([message({ riskFeedback: "suspicious" })]), true);
  assert.equal(isStoredMessages([]), true);
});

test("rejects malformed records and unknown feedback values", () => {
  assert.equal(isStoredMessages([{ ...message(), unread: "no" }]), false);
  assert.equal(isStoredMessages([message({ riskFeedback: "unknown" })]), false);
  assert.equal(isStoredMessages(null), false);
});
