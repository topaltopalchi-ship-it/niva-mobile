export type Message = {
  id: string;
  sender: string;
  initials: string;
  preview: string;
  time: string;
  category: "Personal" | "Updates" | "Promotions";
  unread: boolean;
  important: boolean;
  blocked: boolean;
  riskFeedback?: "suspicious" | "false-positive";
};

export function getCategorySuggestion(message: Message): { category: Message["category"]; reason: string } | null;
export function getRiskHint(message: Message): string[];
export function isStoredMessages(value: unknown): value is Message[];
