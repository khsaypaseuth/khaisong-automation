// Human-friendly labels and badge styling for enum values.

export const LANGUAGES = ["Lao", "Thai", "Chinese", "English"] as const;

export const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
};

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
    case "POSTED":
      return "default";
    case "FAILED":
    case "REJECTED":
      return "destructive";
    case "READY_FOR_REVIEW":
    case "SCHEDULED":
      return "secondary";
    default:
      return "outline";
  }
}
