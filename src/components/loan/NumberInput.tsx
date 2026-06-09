import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  value: number;
  onChange: (n: number) => void;
  decimal?: boolean;
  min?: number;
  className?: string;
  placeholder?: string;
}

/**
 * Controlled-ish numeric input that keeps a local string so the user can type
 * decimal points (e.g. "8." → "8.5") and clear the field without the parent
 * snapping the value back to "0" mid-keystroke.
 */
export function NumberInput({ value, onChange, decimal, min, className, placeholder }: Props) {
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
        if (!isFinite(n) || text === "") {
          setText(String(value ?? 0));
        } else {
          setText(String(n));
        }
      }}
    />
  );
}
