import test from "node:test";
import assert from "node:assert/strict";
import { createSecureMessageStore } from "../src/storage/secureMessageStoreCore.js";

const sample = { id: "m-1", address: "+10000000000", body: "private text", date: 123 };

test("missing native store fails closed; there is no plaintext fallback", async () => {
  const store = createSecureMessageStore("android", undefined);
  await assert.rejects(store.saveMessage(sample), { code: "NIVA_SECURE_STORE_UNAVAILABLE" });
  await assert.rejects(store.getMessage("m-1"), { code: "NIVA_SECURE_STORE_UNAVAILABLE" });
});

test("non-Android platforms cannot persist messages", async () => {
  const native = { encryptAndStoreMessage: async () => true };
  const store = createSecureMessageStore("ios", native);
  await assert.rejects(store.saveMessage(sample), { code: "NIVA_SECURE_STORE_UNAVAILABLE" });
});

test("saving delegates to the native encrypt-and-store operation", async () => {
  let received;
  const native = {
    encryptAndStoreMessage: async (message) => { received = message; return { stored: true }; },
  };
  const store = createSecureMessageStore("android", native);
  assert.deepEqual(await store.saveMessage(sample), { stored: true });
  assert.deepEqual(received, sample);
});

test("invalid message payloads are rejected before crossing the native boundary", async () => {
  let called = false;
  const store = createSecureMessageStore("android", {
    encryptAndStoreMessage: async () => { called = true; },
  });
  await assert.rejects(store.saveMessage({ ...sample, body: "  " }), TypeError);
  assert.equal(called, false);
});

test("read and delete require explicit native methods", async () => {
  const calls = [];
  const store = createSecureMessageStore("android", {
    getDecryptedMessage: async (id) => { calls.push(["read", id]); return sample; },
    deleteMessage: async (id) => { calls.push(["delete", id]); return true; },
  });
  assert.deepEqual(await store.getMessage("m-1"), sample);
  assert.equal(await store.deleteMessage("m-1"), true);
  assert.deepEqual(calls, [["read", "m-1"], ["delete", "m-1"]]);
});
