const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "App.tsx"), "utf8");

test("conversation detail remains scrollable on small screens", () => {
  assert.match(app, /<ScrollView style={styles\\.detailScreen} contentContainerStyle={styles\\.detailContent}/);
  assert.match(app, /detailContent:\\s*\\{[^}]*paddingBottom/);
});

test("privacy and data controls remain scrollable", () => {
  assert.match(app, /<ScrollView style={styles\\.privacyScreen} contentContainerStyle={styles\\.privacyContent}/);
  assert.match(app, /privacyContent:\\s*\\{[^}]*paddingBottom/);
});

test("inbox controls expose accessible names and selected filter state", () => {
  assert.match(app, /accessibilityLabel="Search messages"/);
  assert.match(app, /accessibilityLabel="Open privacy and data settings"/);
  assert.match(app, /accessibilityState=\\{\\{ selected: filter === item \\}\\}/);
  assert.match(app, /accessibilityLabel=\\{`\\$\\{item\\.sender\\}/);
});

test("destructive local-data action requires explicit confirmation", () => {
  assert.match(app, /Alert\\.alert\\(/);
  assert.match(app, /text: "Delete data", style: "destructive"/);
});
