const PROMOTION_SIGNALS = ["unsubscribe", "discount", "deal", "offer", "sale", "coupon", "promo"];
const UPDATE_SIGNALS = ["statement", "verification code", "one-time code", "package", "delivery", "tracking", "appointment", "receipt"];
const URGENCY_SIGNALS = ["act now", "immediately", "within 24 hours", "account suspended", "final warning"];
const SENSITIVE_SIGNALS = ["password", "pin", "one-time code", "verification code", "bank details", "payment details"];
const PRIZE_SIGNALS = ["you won", "claim your prize", "free gift"];

function messageText(message) {
  return (message.sender + " " + message.preview).toLowerCase();
}

function getCategorySuggestion(message) {
  const text = messageText(message);
  if (PROMOTION_SIGNALS.some((signal) => text.includes(signal)) && message.category !== "Promotions") {
    return { category: "Promotions", reason: "Contains promotional wording such as an offer or discount." };
  }
  if (UPDATE_SIGNALS.some((signal) => text.includes(signal)) && message.category !== "Updates") {
    return { category: "Updates", reason: "Contains a transactional or service-update term." };
  }
  return null;
}

function getRiskHint(message) {
  const text = messageText(message);
  const reasons = [];
  if (URGENCY_SIGNALS.some((signal) => text.includes(signal))) {
    reasons.push("Uses urgent or threatening language to pressure a quick response.");
  }
  if (SENSITIVE_SIGNALS.some((signal) => text.includes(signal))) {
    reasons.push("Mentions sensitive credentials or financial information.");
  }
  if (/https?:\\/\\//i.test(text) || /\\b(bit\\.ly|tinyurl\\.com|t\\.co)\\b/i.test(text)) {
    reasons.push("Contains a web link; check the destination independently before opening it.");
  }
  if (PRIZE_SIGNALS.some((signal) => text.includes(signal))) {
    reasons.push("Uses prize or free-gift language that can be used in deceptive messages.");
  }
  return reasons;
}

function isStoredMessages(value) {
  if (!Array.isArray(value)) return false;
  return value.every((item) =>
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.sender === "string" &&
    typeof item.initials === "string" &&
    typeof item.preview === "string" &&
    typeof item.time === "string" &&
    ["Personal", "Updates", "Promotions"].includes(item.category) &&
    typeof item.unread === "boolean" &&
    typeof item.important === "boolean" &&
    typeof item.blocked === "boolean" &&
    (item.riskFeedback === undefined || item.riskFeedback === "suspicious" || item.riskFeedback === "false-positive")
  );
}

module.exports = { getCategorySuggestion, getRiskHint, isStoredMessages };
