import { Label } from "@modules/common/components/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  /** Inline validation message — when set, the field shows a rose border + message below. */
  error?: string
  name: string
  topLabel?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched: _touched, errors: _errors, error, required, topLabel, style, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="flex flex-col w-full">
        {topLabel && (
          <Label className="mb-2 txt-compact-medium-plus">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full txt-compact-medium">
          <input
            type={inputType}
            name={name}
            id={name}
            placeholder=" "
            required={required}
            aria-invalid={error ? true : undefined}
            // Inline border on error guarantees the rose highlight regardless of class cascade.
            style={error ? { ...(style || {}), borderColor: "#fb7185" } : style}
            className={`pt-4 pb-1 block w-full h-12 px-4 mt-0 bg-white border rounded-xl appearance-none text-aquora-ink transition-colors focus:outline-none focus:ring-2 ${
              error
                ? "focus:ring-rose-200"
                : "border-black/[0.08] focus:ring-aquora-primary/20 focus:border-aquora-primary hover:border-black/15"
            }`}
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={name}
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-aquora-muted"
          >
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
          {type === "password" && (
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="text-aquora-muted px-4 focus:outline-none transition-all duration-150 outline-none focus:text-aquora-primary absolute right-0 top-3.5"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-rose-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
