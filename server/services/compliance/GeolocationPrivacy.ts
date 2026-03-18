/**
 * GeolocationPrivacy Service
 * 
 * Protects users from stalking/doxing by fuzzing exact geolocation data.
 * Instead of street-level coordinates, it returns only Country/State/City 
 * depending on the privacy level requested.
 */

export interface FuzzedLocation {
  country: string;
  region: string; // State/Province
  city?: string;
  latitude: number; // Centroid of the region
  longitude: number; // Centroid of the region
  fuzzed: boolean;
}

export class GeolocationPrivacy {
  /**
   * Fuzzes exact coordinates to the centroid of the nearest major region.
   * Prevents revealing exact home addresses.
   */
  public static fuzzCoordinates(lat: number, lon: number, precision: 'country' | 'region' | 'city' = 'region'): { lat: number, lon: number } {
    // Basic fuzzing logic: Rounding coordinates significantly
    // A change of 0.1 decimal degrees is ~11km.
    // A change of 1.0 decimal degree is ~111km.
    
    let multiplier = 1;
    if (precision === 'country') multiplier = 0; // Everything maps to same center
    if (precision === 'region') multiplier = 1;  // ~1 degree (~111km)
    if (precision === 'city') multiplier = 10;   // ~0.1 degree (~11km)

    if (multiplier === 0) return { lat: 0, lon: 0 }; // Global center (placeholder)

    return {
      lat: Math.round(lat * multiplier) / multiplier,
      lon: Math.round(lon * multiplier) / multiplier
    };
  }

  /**
   * Mock implementation of IP to Fuzzed Location.
   * In production, this would use MaxMind GeoIP or similar.
   */
  public static async getFuzzedLocation(ip: string): Promise<FuzzedLocation> {
    // For local testing/demo purposes
    if (ip === '127.0.0.1' || ip === '::1') {
      return {
        country: 'US',
        region: 'California',
        city: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        fuzzed: true
      };
    }

    // Mock response for any other IP
    return {
      country: 'US',
      region: 'New York',
      city: 'New York City',
      latitude: 40.7128,
      longitude: -74.0060,
      fuzzed: true
    };
  }
}

export function getGeolocationPrivacyService() {
  return GeolocationPrivacy;
}
