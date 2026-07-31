export const HYDERABAD_COORDS = { lat: 17.3850, lng: 78.4867 };
export const WAREHOUSE_COORDS = { lat: 17.548377214877075, lng: 78.34705192140262 };

export const SHARED_CLEAN_STYLES = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "administrative.neighborhood", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.text", stylers: [{ visibility: "off" }] },
];

export const DARK_STYLES = [
  ...SHARED_CLEAN_STYLES,
  { elementType: "geometry", stylers: [{ color: "#18181b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#18181b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3f3f46" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#27272a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#3f3f46" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#52525b" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
];

export const LIGHT_STYLES = [
  ...SHARED_CLEAN_STYLES,
];
