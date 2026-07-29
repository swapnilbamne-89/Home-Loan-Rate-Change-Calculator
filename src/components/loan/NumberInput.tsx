import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  value: number;
  onChange: (n: number) => void;
  decimal?: boolean;
  min?: number;
  className?: string;
  placeholder?: string;
  id?: string;
  "aria-label"?: string;
}

/**
 * Controlled-ish numeric input that keeps a local string so the user can type
 * decimal points (e.g. "8." → "8.5") and clear the field without the parent
 * snapping the value back to "0" mid-keystroke.
 */
export function NumberInput({ value, onChange, decimal, min, className, placeholder, id, "aria-label": ariaLabel }: Props) {
  const [text, setText] = useState<string>(String(value ?? ""));

  // Sync from parent when the value changes externally (and doesn't match what we typed)
  useEffect(() => {
    const parsed = Number(text);
    if (!isFinite(parsed) || parsed !== value) {
      setText(String(value ?? ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const pattern = decimal ? /[^0-9.\-]/g : /[^0-9\-]/g;

  return (
    <Input
      id={id}
      aria-label={ariaLabel}
      inputMode={decimal ? "decimal" : "numeric"}
      className={className}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(pattern, "");
        setText(raw);
        if (raw === "" || raw === "-" || raw === "." || raw === "-.") return;
        const n = Number(raw);
        if (!isFinite(n)) return;
        if (min !== undefined && n < min) return;
        onChange(n);
      }}
      onBlur={() => {
        const n = Number(text);
        if (text === "" || text === "-" || text === "." || text === "-." || !isFinite(n)) {
          // Empty/partial input on blur commits the floor value (usually 0) so
          // clearing a field actually removes that contribution.
          const fallback = min ?? 0;
          setText(String(fallback));
          if (fallback !== value) onChange(fallback);
        } else {
          const clamped = min !== undefined && n < min ? min : n;
          setText(String(clamped));
          if (clamped !== value) onChange(clamped);
        }
      }}
    />
  );
}
