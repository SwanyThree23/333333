/**
 * WatchPartyValidator Service
 * 
 * Mitigates DMCA and Copyright risks by validating source URLs used in watch parties.
 * Ensures that only approved domains (e.g., YouTube, Twitch) are allowed and
 * blocks direct links to raw media files (mp4, mkv, etc.) to prevent piracy.
 */

export class WatchPartyValidator {
  private static ALLOWED_DOMAINS = [
    'youtube.com',
    'youtu.be',
    'twitch.tv',
    'vimeo.com',
    'facebook.com',
    'daily-motion.com'
  ];

  private static BLOCKED_EXTENSIONS = [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.m3u8'
  ];

  /**
   * Validates if a URL is safe for embedding in a watch party.
   */
  public static validateSource(url: string): { allowed: boolean; reason?: string } {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      const pathname = parsedUrl.pathname.toLowerCase();

      // Check allowlist
      const isAllowedDomain = this.ALLOWED_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );

      if (!isAllowedDomain) {
        return { 
          allowed: false, 
          reason: `Domain '${hostname}' is not in the approved list for watch parties.` 
        };
      }

      // Check for raw media files
      const isRawFile = this.BLOCKED_EXTENSIONS.some(ext => pathname.endsWith(ext));
      if (isRawFile) {
        return { 
          allowed: false, 
          reason: 'Direct links to raw media files are prohibited to prevent copyright infringement.' 
        };
      }

      return { allowed: true };
    } catch (e) {
      return { allowed: false, reason: 'Invalid URL format.' };
    }
  }

  /**
   * Returns the list of currently allowed domains.
   */
  public static getAllowedDomains(): string[] {
    return [...this.ALLOWED_DOMAINS];
  }
}

export function getWatchPartyValidatorService() {
  return WatchPartyValidator;
}
