'use client';

import React, { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Check, Eye, EyeOff, Lock, X } from 'lucide-react';

/** Minimum password length enforced across every signup / password form. */
export const PASSWORD_MIN_LENGTH = 8;

/** Default shape + focus styling, matching the `public-field-with-icon` look. */
const DEFAULT_INPUT_CLASS =
  'w-full rounded-xl bg-white py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1A0A5E] focus:ring-2 focus:ring-[#F5C200]/25';

const DEFAULT_LABEL_CLASS = 'mb-1.5 block text-sm font-bold text-slate-700';

const BORDER_NEUTRAL = 'border-slate-300';
const BORDER_ERROR = 'border-[#CC0000]';
const BORDER_MATCH = 'border-emerald-500';

export interface PasswordFieldProps extends Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'type' | 'className'
> {
  /** Visible label rendered above the input. */
  label: string;
  /** Validation message rendered in red below the field. */
  error?: string;
  /** When set, the field is compared live against this value (confirm-password mode). */
  matchValue?: string;
  /** Noun used in the live match messages, e.g. "Passwords match". */
  matchLabel?: string;
  /** Shows a live "At least N characters" checklist line below the field. */
  showRequirement?: boolean;
  /** Static helper text rendered below the field. */
  hint?: string;
  /** Extra classes for the outer wrapper. */
  className?: string;
  /** Replaces the default shape/focus classes on the input (borders + padding stay owned here). */
  inputClassName?: string;
  /** Replaces the default label classes. */
  labelClassName?: string;
}

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  {
    label,
    error,
    matchValue,
    matchLabel = 'Passwords',
    showRequirement = false,
    hint,
    className = '',
    inputClassName,
    labelClassName,
    id,
    minLength,
    value,
    defaultValue,
    onChange,
    'aria-describedby': ariaDescribedBy,
    ...inputProps
  },
  ref
) {
  const generatedId = useId();
  const fieldId = id ?? `password-${generatedId}`;
  const errorId = `${fieldId}-error`;
  const matchId = `${fieldId}-match`;
  const requirementId = `${fieldId}-requirement`;
  const hintId = `${fieldId}-hint`;

  const [isVisible, setIsVisible] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(
    typeof defaultValue === 'string' ? defaultValue : ''
  );

  const innerRef = useRef<HTMLInputElement | null>(null);
  const assignRef = useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  // react-hook-form drives this input uncontrolled, so programmatic updates
  // (e.g. `reset()` after a successful password change) never reach our state.
  // Re-syncing from the DOM on every render keeps the live hints accurate.
  useEffect(() => {
    if (typeof value === 'string') return;
    const domValue = innerRef.current?.value ?? '';
    if (domValue !== uncontrolledValue) {
      setUncontrolledValue(domValue);
    }
  });

  const currentValue = typeof value === 'string' ? value : uncontrolledValue;
  const requirementLength = minLength ?? PASSWORD_MIN_LENGTH;

  const isMatchMode = typeof matchValue === 'string';
  const hasTyped = currentValue.length > 0;
  const isMismatch = isMatchMode && hasTyped && currentValue !== matchValue;
  const isMatch = isMatchMode && hasTyped && currentValue === matchValue;
  const meetsRequirement = currentValue.length >= requirementLength;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof value !== 'string') {
      setUncontrolledValue(event.target.value);
    }
    onChange?.(event);
  };

  const mismatchMessage = `${matchLabel} do not match`;
  // Avoid printing the resolver's "Passwords do not match" twice next to the live hint.
  const visibleError = isMismatch && error === mismatchMessage ? undefined : error;

  const borderClass = error || isMismatch ? BORDER_ERROR : isMatch ? BORDER_MATCH : BORDER_NEUTRAL;

  const describedBy =
    [
      ariaDescribedBy,
      visibleError ? errorId : null,
      isMismatch || isMatch ? matchId : null,
      showRequirement ? requirementId : null,
      hint ? hintId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={`block ${className}`.trim()}>
      <label htmlFor={fieldId} className={labelClassName ?? DEFAULT_LABEL_CLASS}>
        {label}
      </label>

      <div className="relative">
        <Lock
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
        />
        <input
          {...inputProps}
          ref={assignRef}
          id={fieldId}
          type={isVisible ? 'text' : 'password'}
          minLength={minLength}
          value={value}
          defaultValue={typeof value === 'string' ? undefined : defaultValue}
          onChange={handleChange}
          aria-invalid={Boolean(error) || isMismatch}
          aria-describedby={describedBy}
          className={`border pl-11 pr-14 ${inputClassName ?? DEFAULT_INPUT_CLASS} ${borderClass}`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          aria-controls={fieldId}
          tabIndex={inputProps.disabled ? -1 : 0}
          className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#1A0A5E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A0A5E]/40"
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" />
          ) : (
            <Eye aria-hidden="true" className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      {showRequirement && (
        <p
          id={requirementId}
          className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
            meetsRequirement ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          {meetsRequirement ? (
            <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          )}
          At least {requirementLength} characters
        </p>
      )}

      {isMismatch && (
        <p
          id={matchId}
          aria-live="polite"
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#CC0000]"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {mismatchMessage}
        </p>
      )}

      {isMatch && (
        <p
          id={matchId}
          aria-live="polite"
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600"
        >
          <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {matchLabel} match
        </p>
      )}

      {visibleError && (
        <p
          id={errorId}
          className="mt-1.5 flex items-center gap-1 text-sm font-medium text-[#CC0000]"
        >
          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {visibleError}
        </p>
      )}

      {hint && !visibleError && (
        <p id={hintId} className="mt-1.5 text-xs leading-5 text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
});

export default PasswordField;
