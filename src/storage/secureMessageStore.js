/**
 * Fail-closed boundary for the Android encrypted SMS store.
 *
 * The native implementation must encrypt before persistence using a key
 * protected by Android Keystore. This module deliberately has no AsyncStorage,
 * filesystem, or network fallback.
 */
import { NativeModules, Platform } from "react-native";

const nativeStore = NativeModules.NivaSecureMessages;

function unavailable() {
  const error = new Error("Encrypted local message storage is unavailable on this build.");
  error.code = "NIVA_SECURE_STORE_UNAVAILABLE";
  return error;
}

function requireAndroidStore() {
  if (Platform.OS !== "android" || !nativeStore) throw unavailable();
  return nativeStore;
}

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

/**
 * The native module owns encryption, key management, and database I/O.
 * It must never persist plaintext and must reject if Keystore is unavailable.
 */
export async function saveMessage(message) {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    throw new TypeError("message must be an object");
  }
  requireNonEmptyString(message.id, "message.id");
  requireNonEmptyString(message.body, "message.body");
  requireNonEmptyString(message.address, "message.address");
  const store = requireAndroidStore();
  if (typeof store.encryptAndStoreMessage !== "function") throw unavailable();
  return store.encryptAndStoreMessage({
    id: message.id,
    address: message.address,
    body: message.body,
    date: Number.isFinite(message.date) ? message.date : Date.now(),
  });
}

export async function getMessage(id) {
  requireNonEmptyString(id, "id");
  const store = requireAndroidStore();
  if (typeof store.getDecryptedMessage !== "function") throw unavailable();
  return store.getDecryptedMessage(id);
}

export async function deleteMessage(id) {
  requireNonEmptyString(id, "id");
  const store = requireAndroidStore();
  if (typeof store.deleteMessage !== "function") throw unavailable();
  return store.deleteMessage(id);
}
