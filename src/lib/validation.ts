
/**
 * Snapchat URL patterns and tool validation logic
 */

const SNAPCHAT_USERNAME_REGEX = /^[a-zA-Z0-9._]{3,30}$/;

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

export const SNAP_PATTERNS = {
  // Spotlight: /spotlight/ anywhere (snapchat.com/spotlight/ID, snap.com/spotlight/ID)
  SPOTLIGHT: /(?:snapchat|snap)\.com\/.*spotlight\//i,
  
  // Story: snapchat.com/s/ID or snapchat.com/add/USER/story/ID or snap.com equivalents
  STORY: /(?:snapchat|snap)\.com\/s\/[a-zA-Z0-9_-]+|(?:snapchat|snap)\.com\/add\/@?[a-zA-Z0-9._-]+\/story\/[a-zA-Z0-9_-]+/i,
  
  // Profile: snapchat.com/add/USER, snapchat.com/@USER, or snap.com equivalents
  PROFILE: /(?:snapchat|snap)\.com\/(?:add\/@?[a-zA-Z0-9._-]+|@?[a-zA-Z0-9._-]+)(?!\/spotlight\/)/i,
  
  // General Snapchat URL
  GENERAL: /(?:snapchat|snap)\.com\/|t\.snapchat\.com\//i,
};

export type ToolId = "spotlight-downloader" | "video-downloader" | "story-downloader" | "story-viewer" | "profile-viewer" | "profile-dp-downloader";

function isSnapchatUrl(value: string): boolean {
  return /(?:snapchat|snap)\.com/i.test(value) || /t\.snapchat\.com/i.test(value);
}

function isSnapchatUsername(value: string): boolean {
  const trimmed = value.trim().replace(/^[@#]/, "");
  return SNAPCHAT_USERNAME_REGEX.test(trimmed);
}

function isSnapchatProfileUrl(value: string): boolean {
  const normalized = value.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[?#]/)[0];
  return /^(?:snapchat|snap)\.com\/(?:add\/@?[a-zA-Z0-9._]{3,30}|@?[a-zA-Z0-9._]{3,30})(?:\/|$)/i.test(normalized) || /^t\.snapchat\.com\/[a-zA-Z0-9_-]+/i.test(normalized);
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestedTool?: ToolId;
}

/**
 * Validates input based on the active tool
 * ULTRA FLEXIBLE - Accepts any Snapchat-related input
 */
export function validateToolInput(toolId: string, input: string): ValidationResult {
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
