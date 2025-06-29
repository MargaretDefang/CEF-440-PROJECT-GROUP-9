export interface GoogleDirectionsResponse {
  routes: Array<{
    legs: Array<{
      steps: Array<{
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        instruction: string;
        maneuver: string;
        polyline: { points: string };
      }>;
      distance: { text: string; value: number };
      duration: { text: string; value: number };
    }>;
    overview_polyline: { points: string };
  }>;
  status: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver: string;
  coordinates: RoutePoint[];
}

export interface RouteResult {
  coordinates: RoutePoint[];
  steps: NavigationStep[];
  estimatedTime: string;
  estimatedDistance: string;
  totalDistance: number;
  totalDuration: number;
}

export class GoogleMapsService {
  private apiKey: string = 'AIzaSyALlDlNghLjj3j8_ZyZvd-ZSDL74TmPYrw';
  private baseUrl: string = 'https://maps.googleapis.com/maps/api';

  /**
   * Check if Google APIs are properly configured
   */
  async checkApiConfiguration(): Promise<{ places: boolean; directions: boolean }> {
    const result = { places: false, directions: false };
    
    try {
      // Test Places API
      const placesUrl = `${this.baseUrl}/place/findplacefromtext/json?input=test&inputtype=textquery&fields=place_id&key=${this.apiKey}`;
      const placesResponse = await fetch(placesUrl);
      const placesData = await placesResponse.json();
      result.places = placesData.status === 'OK' || placesData.status === 'ZERO_RESULTS';
    } catch (error) {
      console.warn('Places API not available:', error);
    }
    
    try {
      // Test Directions API
      const directionsUrl = `${this.baseUrl}/directions/json?origin=0,0&destination=1,1&key=${this.apiKey}`;
      const directionsResponse = await fetch(directionsUrl);
      const directionsData = await directionsResponse.json();
      result.directions = directionsData.status === 'OK' || directionsData.status === 'ZERO_RESULTS';
    } catch (error) {
      console.warn('Directions API not available:', error);
    }
    
    return result;
  }

  /**
   * Get API configuration status message
   */
  getApiStatusMessage(places: boolean, directions: boolean): string {
    if (!places && !directions) {
      return 'Google Maps APIs are not configured. Using fallback functionality.';
    } else if (!places) {
      return 'Google Places API is not available. Search will use fallback data.';
    } else if (!directions) {
      return 'Google Directions API is not available. Navigation will use basic routing.';
    }
    return 'All Google Maps APIs are working properly.';
  }

  /**
   * Get directions from origin to destination using Google Directions API
   */
  async getDirections(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<RouteResult> {
    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destStr = `${destination.latitude},${destination.longitude}`;
      
      const url = `${this.baseUrl}/directions/json?origin=${originStr}&destination=${destStr}&mode=${mode}&key=${this.apiKey}`;
      
      console.log('GoogleMapsService - Fetching directions:', url);
      
      const response = await fetch(url);
      const data: GoogleDirectionsResponse = await response.json();
      
      if (data.status !== 'OK') {
        console.warn(`Google Directions API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
        throw new Error(`Google Directions API error: ${data.status}`);
      }
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes found');
      }
      
      const route = data.routes[0];
      const leg = route.legs[0];
      
      // Decode polyline for route coordinates
      const routeCoordinates = this.decodePolyline(route.overview_polyline.points);
      
      // Process steps
      const steps: NavigationStep[] = leg.steps.map(step => ({
        instruction: this.cleanInstruction(step.instruction),
        distance: step.distance.text,
        duration: step.duration.text,
        maneuver: this.getManeuverType(step.instruction),
        coordinates: this.decodePolyline(step.polyline.points)
      }));
      
      return {
        coordinates: routeCoordinates,
        steps,
        estimatedTime: leg.duration.text,
        estimatedDistance: leg.distance.text,
        totalDistance: leg.distance.value,
        totalDuration: leg.duration.value
      };
      
    } catch (error) {
      console.error('GoogleMapsService - Error getting directions:', error);
      throw error;
    }
  }

  /**
   * Search for places using Google Places API (New)
   */
  async searchPlaces(query: string, location?: { latitude: number; longitude: number }): Promise<any[]> {
    try {
      // Try the newer Places API first
      let url = `${this.baseUrl}/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,rating,types,photos&key=${this.apiKey}`;
      
      if (location) {
        url += `&locationbias=circle:50000@${location.latitude},${location.longitude}`;
      }
      
      console.log('GoogleMapsService - Searching places (New API):', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
        return data.candidates.map((place: any) => ({
          id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          rating: place.rating,
          types: place.types,
          photos: place.photos
        }));
      }
      
      // Fallback to textsearch if findplacefromtext doesn't work
      console.log('GoogleMapsService - Trying textsearch fallback...');
      url = `${this.baseUrl}/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      if (location) {
        url += `&location=${location.latitude},${location.longitude}&radius=50000`;
      }
      
      const fallbackResponse = await fetch(url);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.status === 'OK' && fallbackData.results) {
        return fallbackData.results.map((place: any) => ({
          id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          rating: place.rating,
          types: place.types,
          photos: place.photos
        }));
      }
      
      // If both APIs fail, log the error but don't throw
      console.warn(`Google Places API not available: ${fallbackData.status} - ${fallbackData.error_message || 'API not enabled'}`);
      return [];
      
    } catch (error) {
      console.error('GoogleMapsService - Error searching places:', error);
      return [];
    }
  }

  /**
   * Get place details using Google Places API
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,types,photos&key=${this.apiKey}`;
      
      console.log('GoogleMapsService - Getting place details:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`);
      }
      
      return data.result;
      
    } catch (error) {
      console.error('GoogleMapsService - Error getting place details:', error);
      throw error;
    }
  }

  /**
   * Decode Google's polyline format to coordinates
   */
  private decodePolyline(encoded: string): RoutePoint[] {
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let shift = 0, result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return poly;
  }

  /**
   * Clean HTML tags from instruction text
   */
  private cleanInstruction(instruction: string): string {
    return instruction
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .trim();
  }

  /**
   * Extract maneuver type from instruction
   */
  private getManeuverType(instruction: string): string {
    const lowerInstruction = instruction.toLowerCase();
    
    if (lowerInstruction.includes('turn left')) return 'left';
    if (lowerInstruction.includes('turn right')) return 'right';
    if (lowerInstruction.includes('slight left')) return 'slight-left';
    if (lowerInstruction.includes('slight right')) return 'slight-right';
    if (lowerInstruction.includes('sharp left')) return 'sharp-left';
    if (lowerInstruction.includes('sharp right')) return 'sharp-right';
    if (lowerInstruction.includes('u-turn')) return 'uturn';
    if (lowerInstruction.includes('arrive')) return 'arrive';
    if (lowerInstruction.includes('continue') || lowerInstruction.includes('head')) return 'straight';
    
    return 'straight';
  }

  /**
   * Calculate distance between two points in meters
   */
  calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get current step based on user location
   */
  getCurrentStep(userLocation: RoutePoint, steps: NavigationStep[]): number {
    let currentStep = 0;
    let minDistance = Infinity;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      for (const coord of step.coordinates) {
        const distance = this.calculateDistance(userLocation, coord);
        if (distance < minDistance) {
          minDistance = distance;
          currentStep = i;
        }
      }
    }

    return currentStep;
  }
} 