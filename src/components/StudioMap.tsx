import { ArrowRight, MapPin, Navigation } from 'lucide-react';
import { studioAddress, studioDirectionsUrlFor, studioMapEmbedUrlFor } from '../lib/location';
import { useSiteSettings } from '../lib/siteSettings';
import FlowerMark from './FlowerMark';

export default function StudioMap() {
  const content = useSiteSettings();
  const address = content.address || studioAddress;
  const directionsUrl = studioDirectionsUrlFor(address);
  const mapEmbedUrl = studioMapEmbedUrlFor(address);

  return (
    <div className="map-card location-map">
      <iframe
        title={`Map showing Glamourglow Spa near ${address}`}
        src={mapEmbedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="studio-map-beacon" aria-hidden="true">
        <span /><span /><span />
        <i><FlowerMark /></i>
      </div>
      <div className="location-map-label">
        <MapPin />
        <span><b>Find Glamourglow Spa</b><small>{address}</small></span>
      </div>
      <a className="location-map-link" href={directionsUrl} target="_blank" rel="noopener noreferrer" aria-label="Open directions to Glamourglow Spa in Google Maps">
        <Navigation /> Directions <ArrowRight />
      </a>
    </div>
  );
}
