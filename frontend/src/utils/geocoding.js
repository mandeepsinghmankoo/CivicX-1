export const reverseGeocode = async (lat, lng) => {
  try {
    const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : 'http://127.0.0.1:8000';
    const response = await fetch(`${API_BASE}/Interference/reverse-geocode/?lat=${lat}&lng=${lng}`);
    if (response.ok) {
      const data = await response.json();
      return data.address || `${lat}, ${lng}`;
    }
  } catch (error) {
    // Fallback when backend is not available
  }
  return `${lat}, ${lng}`;
};