'use client';

import { useState } from 'react';

interface InputFieldProps {
  label: string;
  type?: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  showPasswordToggle?: boolean;
}

export function InputField({
  label,
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  showPasswordToggle = false,
}: InputFieldProps) {
  const [visible, setVisible] = useState(false);

  const resolvedType = showPasswordToggle && visible ? 'text' : type;

  return (
    <div className="input-wrapper">
      <label className="input-label" htmlFor={name}>
        {label}
      </label>
      <div className="input-container">
        <input
          id={name}
          className={`input-field ${showPasswordToggle ? 'input-field--with-toggle' : ''}`}
          type={resolvedType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="input-toggle"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
          >
            {visible ? 'hide' : 'show'}
          </button>
        )}
      </div>
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}
