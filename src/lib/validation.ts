
/**
 * Snapchat URL patterns and tool validation logic
 */

/**
 * Extracts a URL from a text string if one is embedded inside other text (e.g. from mobile share messages).
 */
export function extractUrlFromText(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  
  // Regex to match any snapchat.com, snap.com, or t.snapchat.com URL (with or without http/https)
  const urlRegex = /(https?:\/\/[^\s]+|(?:www\.)?(?:t\.snapchat\.com|snapchat\.com|snap\.com)\/[^\s]+)/i;
  const match = trimmed.match(urlRegex);
  if (match) {
    let url = match[1];
    // Strip trailing punctuation often copied along with links
    url = url.replace(/[\)\]\.,;!]+$/g, "");
    return url;
  }
  
  return trimmed;
}

export type ToolId = "spotlight-downloader" | "video-downloader" | "story-downloader" | "story-viewer" | "profile-viewer" | "profile-dp-downloader";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestedTool?: ToolId;
}

/**
 * Validates input based on the active tool
 * ULTRA FLEXIBLE - Accepts any Snapchat-related input
 */
export function validateToolInput(_toolId: string, input: string): ValidationResult {
  const extracted = extractUrlFromText(input);
  const value = extracted.trim();
  
  if (!value) {
    return { isValid: false, error: "Please enter a valid Snapchat link or username." };
  }

  // ULTRA LENIENT VALIDATION FOR ALL TOOLS
  // We accept any input of length >= 2 and let the backend do the heavy lifting, parsing, and redirect resolution.
  if (value.length < 2) {
    return { isValid: false, error: "Please enter a valid Snapchat link or username (at least 2 characters)." };
  }

  return { isValid: true };
}
