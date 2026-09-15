'use client';

import React, { useRef } from 'react';
import { MapPin, Sparkles } from 'lucide-react';

interface AddressAutocompleteProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
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

/**
 * Address input with Otukpo landmark quick-select.
 *
 * Google Places autocomplete was removed to avoid Maps API usage charges —
 * customers describe their address in free text (helped by the landmark
 * chips) instead of a billed autocomplete session.
 */
export default function AddressAutocomplete({
  id = 'address-input',
  name = 'address',
  label,
  value,
  onChange,
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
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
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
