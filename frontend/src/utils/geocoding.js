export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/Interference/reverse-geocode/?lat=${lat}&lng=${lng}`);
    if (response.ok) {
      const data = await response.json();
      return data.address || `${lat}, ${lng}`;
    }
  } catch (error) {
    // Fallback when backend is not available
  }
  return `${lat}, ${lng}`;
};