export const studioAddress = 'Opposite Maku Gate A, first stall from the Bridge, Thika, Kenya';
export const studioDirectionsUrlFor = (address = studioAddress) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
export const studioMapEmbedUrlFor = (address = studioAddress) => `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=17&output=embed`;
export const studioDirectionsUrl = studioDirectionsUrlFor();
export const studioMapEmbedUrl = studioMapEmbedUrlFor();
