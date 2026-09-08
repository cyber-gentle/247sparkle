'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface LocationMapProps {
  /** Human-readable place to pin, e.g. "Otukpo, Benue State" */
  query: string;
  /** Google Maps Embed API zoom (official embed supports 0–21 place zoom) */
  zoom?: number;
  /** Iframe height class (Tailwind) */
  className?: string;
  title?: string;
}

/**
 * Embedded location map for public pages.
 *
 * Uses the official Google Maps Embed API (place mode) — the sanctioned
 * iframe URL that never triggers the browser's "content is blocked"
 * X-Frame-Options refusal. The classic keyless
 * `maps.google.com/maps?q=...&output=embed` hack stopped working reliably.
 *
 * When no API key is configured, falls back to OpenStreetMap's embed so a
 * map always renders (keyless, no billing).
 */
export default function LocationMap({
  query,
  zoom = 14,
  className = 'h-48 w-full border-0',
  title = '247Sparkle location map',
}: LocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const src = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
        query
      )}&zoom=${zoom}`
    : // OpenStreetMap embed: bbox = minLng,minLat,maxLng,maxLat around Otukpo.
      'https://www.openstreetmap.org/export/embed.html?bbox=8.0926%2C7.1550%2C8.1726%2C7.2350&layer=mapnik&marker=7.1950%2C8.1326';

  return (
    <iframe
      title={title}
      src={src}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

/** Small caption row shown under a LocationMap. */
export function LocationMapCaption({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <MapPin size={16} className="text-[#F5C200] shrink-0" />
      <p className="text-xs font-semibold text-[#1A0A5E] truncate">{label}</p>
    </div>
  );
}
