/**
 * Platform-agnostic policy for the encrypted message-store bridge.
 * No persistence fallback is provided: missing native encryption is an error.
 */
function unavailable() {
  const error = new Error("Encrypted local message storage is unavailable on this build.");
  error.code = "NIVA_SECURE_STORE_UNAVAILABLE";
  return error;
}

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

export function createSecureMessageStore(platform, nativeStore) {
  function requireStore(method) {
    if (platform !== "android" || !nativeStore || typeof nativeStore[method] !== "function") {
      throw unavailable();
    }
    return nativeStore;
  }

  return {
    async saveMessage(message) {
      if (!message || typeof message !== "object" || Array.isArray(message)) {
        throw new TypeError("message must be an object");
      }
      requireNonEmptyString(message.id, "message.id");
      requireNonEmptyString(message.body, "message.body");
      requireNonEmptyString(message.address, "message.address");
      return requireStore("encryptAndStoreMessage").encryptAndStoreMessage({
        id: message.id,
        address: message.address,
        body: message.body,
        date: Number.isFinite(message.date) ? message.date : Date.now(),
      });
    },
    async getMessage(id) {
      requireNonEmptyString(id, "id");
      return requireStore("getDecryptedMessage").getDecryptedMessage(id);
    },
    async deleteMessage(id) {
      requireNonEmptyString(id, "id");
      return requireStore("deleteMessage").deleteMessage(id);
    },
  };
}
