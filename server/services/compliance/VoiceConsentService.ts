/**
 * VoiceConsentService
 * 
 * Mitigates Impersonation and Fraud risks by requiring users 
 * to record a specific challenge phrase before their voice can be cloned 
 * or used for AI avatars.
 */

export interface ConsentSession {
  userId: string;
  challengePhrase: string;
  status: 'pending' | 'verified' | 'failed';
  recordedAt?: Date;
}

export class VoiceConsentService {
  private static sessions: Map<string, ConsentSession> = new Map();

  private static CHALLENGE_PHRASES = [
    "I authorize SeeWhy LIVE to use my voice for my AI avatar.",
    "Specifically for this platform, I consent to voice cloning.",
    "My voice is my identity, and I permit its digital replication here."
  ];

  /**
   * Generates a new challenge phrase for a user to record.
   */
  public static startConsent(userId: string): ConsentSession {
    const phrase = this.CHALLENGE_PHRASES[Math.floor(Math.random() * this.CHALLENGE_PHRASES.length)];
    const session: ConsentSession = {
      userId,
      challengePhrase: phrase,
      status: 'pending'
    };
    this.sessions.set(userId, session);
    return session;
  }

  /**
   * Verifies the recorded audio transcript against the challenge phrase.
   * In production, this uses Speech-to-Text (OpenAI Whisper) and 
   * Voice Biometrics to ensure it's the same person.
   */
  public static verifyConsent(userId: string, transcript: string): { success: boolean; error?: string } {
    const session = this.sessions.get(userId);
    if (!session) return { success: false, error: 'No consent session active.' };

    // Standardize text for comparison
    const cleanTranscript = transcript.toLowerCase().replace(/[.,!]/g, "").trim();
    const cleanPhrase = session.challengePhrase.toLowerCase().replace(/[.,!]/g, "").trim();

    if (cleanTranscript === cleanPhrase) {
      session.status = 'verified';
      session.recordedAt = new Date();
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Transcript does not match the challenge phrase. Impersonation check failed.' 
    };
  }

  public static getStatus(userId: string): ConsentSession | null {
    return this.sessions.get(userId) || null;
  }
}

export function getVoiceConsentService() {
  return VoiceConsentService;
}
