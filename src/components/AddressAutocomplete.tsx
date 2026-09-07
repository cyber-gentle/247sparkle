'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

interface AddressAutocompleteProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (data: { address: string; lat?: number; lng?: number }) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  rows?: number;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

const OTUKPO_LANDMARKS = [
  'GRA, Otukpo',
  'Upu Road, Otukpo',
  'Enugu Road, Otukpo',
  'Sabon Gari, Otukpo',
  'FUHSO Campus, Otukpo',
  'General Hospital Road, Otukpo',
  'Otada, Otukpo',
  'Och’Idoma Palace Area, Otukpo',
];

export default function AddressAutocomplete({
  id = 'address-input',
  name = 'address',
  label,
  value,
  onChange,
  onPlaceSelected,
  placeholder = 'e.g. 14 Upu Road, GRA, Otukpo',
  error,
  required = false,
  className = '',
  disabled = false,
  rows = 3,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsAvailable, setMapsAvailable] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Initialize Google Maps Places Autocomplete if API key is provided
  useEffect(() => {
    if (!apiKey) {
      return;
    }

    if (typeof window === 'undefined') return;

    // Check if google maps script is already loaded
    if (window.google?.maps?.places) {
      setMapsLoaded(true);
      setMapsAvailable(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapsLoaded(true);
        setMapsAvailable(true);
      };
      script.onerror = () => {
        console.warn('Google Maps script failed to load. Using landmark fallbacks.');
        setMapsAvailable(false);
      };
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => {
        setMapsLoaded(true);
        setMapsAvailable(true);
      });
    }
  }, [apiKey]);

  // Attach Autocomplete to textarea / input once Google Maps is ready
  useEffect(() => {
    if (!mapsLoaded || !mapsAvailable || !inputRef.current || !window.google?.maps?.places) {
      return;
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current as any, {
        componentRestrictions: { country: 'ng' },
        fields: ['formatted_address', 'geometry', 'name'],
      });

      // Bias towards Otukpo, Benue State (lat 7.1950, lng 8.1326)
      const otukpoCircle = new window.google.maps.Circle({
        center: { lat: 7.195, lng: 8.1326 },
        radius: 30000,
      });
      autocomplete.setBounds(otukpoCircle.getBounds()!);

      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const address = place.formatted_address || place.name || '';
        if (address) {
          onChange(address);
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();
          onPlaceSelected?.({ address, lat, lng });
        }
      });

      return () => {
        if (window.google?.maps?.event) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch (e) {
      console.warn('Error initializing Google Places Autocomplete:', e);
    }
  }, [mapsLoaded, mapsAvailable, onChange, onPlaceSelected]);

  const handleLandmarkClick = (landmark: string) => {
    if (!value || value.trim() === '') {
      onChange(landmark);
    } else if (!value.toLowerCase().includes(landmark.toLowerCase())) {
      onChange(`${value.trim()}, ${landmark}`);
    }
    inputRef.current?.focus();
  };

  const defaultClasses = `w-full rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1A0A5E] focus:ring-4 focus:ring-[#1A0A5E]/10 ${
    error || ariaInvalid ? 'border-red-500' : 'border-slate-300'
  }`;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {mapsAvailable && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Navigation size={10} /> Maps Autocomplete Active
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={inputRef}
          id={id}
          name={name}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={ariaInvalid || !!error}
          aria-describedby={ariaDescribedby || (error ? `${id}-error` : undefined)}
          className={`${defaultClasses} ${className}`}
        />
        <div className="pointer-events-none absolute right-3 top-3 text-slate-400">
          <MapPin size={18} />
        </div>
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {/* Otukpo Quick-Select Landmark Chips */}
      <div className="pt-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
          <Sparkles size={12} className="text-amber-500" />
          <span>Otukpo landmark quick-select:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {OTUKPO_LANDMARKS.map((landmark) => (
            <button
              key={landmark}
              type="button"
              onClick={() => handleLandmarkClick(landmark)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 transition hover:border-[#1A0A5E]/40 hover:bg-[#1A0A5E]/5 hover:text-[#1A0A5E] active:scale-95"
            >
              + {landmark}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
