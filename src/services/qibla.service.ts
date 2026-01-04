export const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
};

export const qiblaService = {
  calculateBearing(startLat: number, startLng: number) {
    const lat1 = (startLat * Math.PI) / 180; // to radians
    const lng1 = (startLng * Math.PI) / 180;
    const lat2 = (KAABA_COORDS.latitude * Math.PI) / 180;
    const lng2 = (KAABA_COORDS.longitude * Math.PI) / 180;

    const dLng = lng2 - lng1;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;

    // Normalize to 0-360
    bearing = (bearing + 360) % 360;

    return bearing;
  },
};
