const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "App.tsx"), "utf8");

test("conversation detail remains scrollable on small screens", () => {
  assert.ok(app.includes('<ScrollView style={styles.detailScreen} contentContainerStyle={styles.detailContent}'));
  assert.ok(app.includes("detailContent: { paddingTop: 10, paddingBottom: 28 }"));
});

test("privacy and data controls remain scrollable", () => {
  assert.ok(app.includes('<ScrollView style={styles.privacyScreen} contentContainerStyle={styles.privacyContent}'));
  assert.ok(app.includes("privacyContent: { paddingTop: 10, paddingBottom: 28, gap: 13 }"));
});

test("inbox controls expose accessible names and selected filter state", () => {
  assert.ok(app.includes('accessibilityLabel="Search messages"'));
  assert.ok(app.includes('accessibilityLabel="Open privacy and data settings"'));
  assert.ok(app.includes("accessibilityState={{ selected: filter === item }}"));
  assert.ok(app.includes("accessibilityHint=\"Opens conversation details\""));
});

test("destructive local-data action requires explicit confirmation", () => {
  assert.ok(app.includes("Alert.alert("));
  assert.ok(app.includes('text: "Delete data", style: "destructive"'));
});
