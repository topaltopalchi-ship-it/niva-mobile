const UNAVAILABLE = Object.freeze({ status: "not-default-handler" });

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

/**
 * Normalize the native Android module response.
 * Unknown/malformed payloads fail closed and never grant SMS capabilities.
 */
export function normalizeSmsCapability(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !hasOwn(value, "status")) {
    return { ...UNAVAILABLE };
  }

  if (value.status === "not-default-handler") {
    return { ...UNAVAILABLE };
  }

  if (value.status !== "default-handler") {
    return { ...UNAVAILABLE };
  }

  return {
    status: "default-handler",
    canRead: hasOwn(value, "canRead") && value.canRead === true,
    canSend: hasOwn(value, "canSend") && value.canSend === true,
  };
}

export function canImportSms(capability) {
  return capability?.status === "default-handler" && capability.canRead === true;
}

export function canComposeSms(capability) {
  return capability?.status === "default-handler" && capability.canSend === true;
}
