import * as Location from 'expo-location';

const LOCATION_TIMEOUT_MS = 15000;

export const LOCATION_STATUS = {
  AVAILABLE: 'available',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
  ERROR: 'error',
};

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timed out while waiting for the current location.'));
      }, timeoutMs);
    }),
  ]);
}

function toCoordinates(location) {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export async function requestCurrentLocation() {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== Location.PermissionStatus.GRANTED) {
      return {
        status: LOCATION_STATUS.DENIED,
        coordinates: null,
        message: 'Location permission was not granted.',
      };
    }

    try {
      const location = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        LOCATION_TIMEOUT_MS
      );

      return {
        status: LOCATION_STATUS.AVAILABLE,
        coordinates: toCoordinates(location),
        message: null,
      };
    } catch (currentLocationError) {
      const lastKnownLocation = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 1000,
      });

      if (lastKnownLocation) {
        return {
          status: LOCATION_STATUS.AVAILABLE,
          coordinates: toCoordinates(lastKnownLocation),
          message: 'Using the last known device location.',
        };
      }

      return {
        status: LOCATION_STATUS.UNAVAILABLE,
        coordinates: null,
        message:
          'Current location is unavailable. Make sure that location services are enabled.',
      };
    }
  } catch (error) {
    return {
      status: LOCATION_STATUS.ERROR,
      coordinates: null,
      message: error.message || 'Could not retrieve the current location.',
    };
  }
}