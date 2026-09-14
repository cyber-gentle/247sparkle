import React from 'react';

/**
 * 247Sparkle's exact location (7.208123, 8.155818 — Otukpo, Benue State).
 * The classic keyless map embed: a regular map with a red pin, no API key
 * and no billing. Avoid the "Share → Embed a map" ?pb= URL grabbed from the
 * photo/Street View tab — that embeds an ugly photo panorama, not a map.
 */
export const SPARKLE_LOCATION_LAT = 7.208123063691493;
export const SPARKLE_LOCATION_LNG = 8.155817636334003;
export const SPARKLE_LOCATION_EMBED_URL = `https://maps.google.com/maps?q=${SPARKLE_LOCATION_LAT},${SPARKLE_LOCATION_LNG}&z=16&output=embed`;
export const SPARKLE_LOCATION_DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${SPARKLE_LOCATION_LAT},${SPARKLE_LOCATION_LNG}`;

interface LocationMapProps {
  /** Google Maps "Share → Embed a map" URL (the ?pb=... form) */
  embedUrl: string;
  /** Iframe height/width classes (Tailwind) */
  className?: string;
  title?: string;
}

/** Keyless Google Maps share-embed for public pages (free, no API key). */
export default function LocationMap({
  embedUrl,
  className = 'h-48 w-full border-0',
  title = '247Sparkle location map',
}: LocationMapProps) {
  return (
    <iframe
      title={title}
      src={embedUrl}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
