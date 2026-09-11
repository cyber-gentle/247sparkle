'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * 247Sparkle's exact location: the Google Maps "Share → Embed" URL (pins the
 * saved spot, keyless) plus the coordinates for directions links.
 */
export const SPARKLE_LOCATION_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!4v1788836586194!6m8!1m7!1sHXjp28GY1o0PTNzpzctKzQ!2m2!1d7.208123063691493!2d8.155817636334003!3f198.69125244563975!4f7.922719457124046!5f0.7820865974627469';
export const SPARKLE_LOCATION_QUERY = 'Otukpo, Benue State';
export const SPARKLE_LOCATION_DIRECTIONS_URL =
  'https://www.google.com/maps/search/?api=1&query=7.208123063691493,8.155817636334003';

interface LocationMapProps {
  /** Human-readable place to pin, e.g. "Otukpo, Benue State" */
  query: string;
  /**
   * A Google Maps "Share → Embed a map" URL (the ?pb=... form). When given
   * it is used verbatim — keyless, and pins the exact saved spot — taking
   * precedence over the query-based embed.
   */
  embedUrl?: string;
  /** Google Maps Embed API zoom (official embed supports 0–21 place zoom) */
  zoom?: number;
  /** Iframe height class (Tailwind) */
  className?: string;
  title?: string;
}

/**
 * Embedded location map for public pages.
 *
 * Source priority:
 * 1. `embedUrl` — a Google Maps share-embed URL (?pb=...): keyless, pins the
 *    exact location, and is officially sanctioned for iframes.
 * 2. The official Maps Embed API (place mode) using
 *    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 * 3. OpenStreetMap embed when neither is available, so a map always renders.
 */
export default function LocationMap({
  query,
  embedUrl,
  zoom = 14,
  className = 'h-48 w-full border-0',
  title = '247Sparkle location map',
}: LocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const src =
    embedUrl ??
    (apiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
          query
        )}&zoom=${zoom}`
      : // OpenStreetMap embed: bbox = minLng,minLat,maxLng,maxLat around Otukpo.
        'https://www.openstreetmap.org/export/embed.html?bbox=8.0926%2C7.1550%2C8.1726%2C7.2350&layer=mapnik&marker=7.1950%2C8.1326');

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
