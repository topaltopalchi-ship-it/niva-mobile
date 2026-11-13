import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSmsCapability, canImportSms, canComposeSms } from "../src/native/sms/smsCapability.js";

test("only explicit native default-handler response can enable capabilities", () => {
  assert.deepEqual(
    normalizeSmsCapability({ status: "default-handler", canRead: true, canSend: true }),
    { status: "default-handler", canRead: true, canSend: true },
  );
});

test("malformed and unknown native responses fail closed", () => {
  for (const value of [null, undefined, [], "default-handler", {}, { status: "granted", canRead: true, canSend: true }]) {
    assert.deepEqual(normalizeSmsCapability(value), { status: "not-default-handler" });
  }
});

test("inherited status or capability flags cannot grant SMS access", () => {
  const inheritedStatus = Object.create({ status: "default-handler", canRead: true, canSend: true });
  const inheritedFlags = Object.assign(Object.create({ canRead: true, canSend: true }), { status: "default-handler" });

  assert.deepEqual(normalizeSmsCapability(inheritedStatus), { status: "not-default-handler" });
  assert.deepEqual(normalizeSmsCapability(inheritedFlags), {
    status: "default-handler",
    canRead: false,
    canSend: false,
  });
});

test("truthy non-boolean capability flags do not grant access", () => {
  assert.deepEqual(
    normalizeSmsCapability({ status: "default-handler", canRead: "yes", canSend: 1 }),
    { status: "default-handler", canRead: false, canSend: false },
  );
});

test("import and compose gates are independent", () => {
  const readOnly = normalizeSmsCapability({ status: "default-handler", canRead: true, canSend: false });
  assert.equal(canImportSms(readOnly), true);
  assert.equal(canComposeSms(readOnly), false);

  const sendOnly = normalizeSmsCapability({ status: "default-handler", canRead: false, canSend: true });
  assert.equal(canImportSms(sendOnly), false);
  assert.equal(canComposeSms(sendOnly), true);
});

test("losing the default-handler role disables both SMS operations", () => {
  const revoked = normalizeSmsCapability({ status: "not-default-handler", canRead: true, canSend: true });
  assert.equal(canImportSms(revoked), false);
  assert.equal(canComposeSms(revoked), false);
});
