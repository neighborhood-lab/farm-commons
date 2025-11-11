import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className = '', error, helperText, label, required, id, type = 'text', disabled, ...props },
    ref
  ) => {
    const inputId = id || `input-${crypto.randomUUID()}`;
    const hasError = !!error;

    const baseClasses =
      'block w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';

    const stateClasses = hasError
      ? 'border-red-500 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-earth-300 text-gray-900 placeholder-gray-400 focus:border-earth-500 focus:ring-earth-500';

    const classes = [baseClasses, stateClasses, className].filter(Boolean).join(' ');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={classes}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {hasError && (
          <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p className="mt-1 text-sm text-gray-500" id={`${inputId}-helper`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
