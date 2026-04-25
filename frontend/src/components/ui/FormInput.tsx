'use client'

import React from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  dark?: boolean
}

export default function FormInput({ label, dark = true, className, style, ...props }: FormInputProps) {
  const inputStyle: React.CSSProperties = dark
    ? {
        width: '100%',
        padding: '10px 14px',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 8,
        color: '#f1f5f9',
        fontSize: 15,
        outline: 'none',
        boxSizing: 'border-box',
      }
    : {
        width: '100%',
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: 8,
        color: '#111827',
        fontSize: 15,
        outline: 'none',
        boxSizing: 'border-box',
      }

  return (
    <div style={{ width: '100%', ...style as React.CSSProperties }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
          {label}
        </label>
      )}
      <input className={className} style={inputStyle} {...props} />
    </div>
  )
}
