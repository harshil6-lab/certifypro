import { useId, useRef, useState } from "react";
import { FileUp } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FileDropzoneProps {
  accept: string;
  /** MIME prefixes or extensions accepted, e.g. [".xlsx", ".xls", "image/"]. */
  acceptList?: string[];
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  multiple?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  className?: string;
}

function matchesAccept(file: File, acceptList: string[]): boolean {
  if (acceptList.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return acceptList.some((rule) => {
    const r = rule.toLowerCase().trim();
    if (r.startsWith(".")) return name.endsWith(r);
    if (r.endsWith("/*")) return type.startsWith(r.slice(0, -1));
    return type === r;
  });
}

/**
 * FileDropzone
 * Keyboard-operable file drop target. Enter/Space opens the picker, the
 * hidden input stays the real control (click-forwarding preserved), and
 * rejected types surface an inline error instead of failing silently.
 * Not used by any page yet — Import/Templates migrate later.
 */
export function FileDropzone({
  accept,
  acceptList = [],
  onFiles,
  label = "Drop your file here",
  hint,
  disabled = false,
  multiple = false,
  inputRef: externalRef,
  className,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;
  const errorId = useId();
  const hintId = useId();
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFiles = (files: File[]) => {
    if (disabled || files.length === 0) return;
    const rejected = acceptList.length > 0 ? files.filter((f) => !matchesAccept(f, acceptList)) : [];
    if (rejected.length > 0) {
      setError(`Unsupported file type: ${rejected.map((f) => f.name).join(", ")}. ${hint ?? ""}`.trim());
      return;
    }
    setError("");
    onFiles(files);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled}
        aria-describedby={describedBy}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(Array.from(event.dataTransfer.files ?? []));
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          disabled
            ? "cursor-not-allowed opacity-50"
            : dragging
              ? "cursor-pointer border-primary bg-primary/5"
              : "cursor-pointer border-border hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
          <FileUp className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint ? (
          <span id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </span>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            handleFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
