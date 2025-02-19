import api from './axios';
import { Location } from '../types';

interface LocationResponse {
  status: string;
  data: {
    location: Location;
  };
}

interface LocationsResponse {
  status: string;
  data: {
    locations: Location[];
  };
}

/**
 * Create a new farm location
 */
export const createLocation = async (locationData: {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  area: number;
  soilType: string;
  totalTrees: number;
  plantationDate: string;
  description?: string;
  deviceId?: string;
}): Promise<Location> => {
  try {
    const response = await api.post<LocationResponse>(
      '/locations',
      locationData
    );
    return response.data.data.location;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

/**
 * Get all locations for the current user
 */
export const getLocations = async (): Promise<Location[]> => {
  try {
    const response = await api.get<LocationsResponse>('/locations');
    return response.data.data.locations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

/**
 * Get a specific location by ID
 */
export const getLocationById = async (locationId: string): Promise<Location> => {
  try {
    const response = await api.get<LocationResponse>(`/locations/${locationId}`);
    return response.data.data.location;
  } catch (error) {
    console.error(`Error fetching location ${locationId}:`, error);
    throw error;
  }
};

/**
 * Update an existing location
 */
export const updateLocation = async (
  locationId: string,
  updateData: Partial<{
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    area: number;
    soilType: string;
    totalTrees: number;
    plantationDate: string;
    deviceId?: string;
    description?: string;
    status?: 'active' | 'inactive';
  }>
): Promise<Location> => {
  try {
    const response = await api.put<LocationResponse>(
      `/locations/${locationId}`,
      updateData
    );
    return response.data.data.location;
  } catch (error) {
    console.error(`Error updating location ${locationId}:`, error);
    throw error;
  }
};

/**
 * Delete a location
 */
export const deleteLocation = async (locationId: string): Promise<void> => {
  try {
    await api.delete(`/locations/${locationId}`);
  } catch (error) {
    console.error(`Error deleting location ${locationId}:`, error);
    throw error;
  }
};

/**
 * Assign a device to a location
 */
export const assignDeviceToLocation = async (
  locationId: string,
  deviceId: string
): Promise<Location> => {
  try {
    const response = await api.put<LocationResponse>(
      `/locations/${locationId}`,
      { deviceId }
    );
    return response.data.data.location;
  } catch (error) {
    console.error(`Error assigning device to location:`, error);
    throw error;
  }
};

/**
 * Remove a device from a location
 */
export const removeDeviceFromLocation = async (
  locationId: string
): Promise<Location> => {
  try {
    const response = await api.put<LocationResponse>(
      `/locations/${locationId}`,
      { deviceId: null }
    );
    return response.data.data.location;
  } catch (error) {
    console.error(`Error removing device from location:`, error);
    throw error;
  }
};