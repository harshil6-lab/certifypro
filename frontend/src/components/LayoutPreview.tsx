import { useEffect, useState } from "react";
import { QrCode, Move } from "lucide-react";

interface LayoutConfig {
  showStudentName: boolean;
  showQR: boolean;
  showID: boolean;
  placeholderField: string;
  placeholderX: number;
  placeholderY: number;
  qrX: number;
  qrY: number;
  idX: number;
  idY: number;
}

interface LayoutPreviewProps {
  /** Full URL of the selected template image (or null when none selected) */
  templateUrl: string | null;
  templateTitle?: string;
  layoutConfig: LayoutConfig;
}

/**
 * Live layout preview.
 *
 * Renders the template background image filling the container, then overlays
 * the student_name placeholder, QR code placeholder, and certificate_id
 * placeholder using absolute positioning driven by the layout percentages.
 */
export const LayoutPreview = ({ templateUrl, templateTitle, layoutConfig }: LayoutPreviewProps) => {
  const [aspectRatio, setAspectRatio] = useState(1.414);

  useEffect(() => {
    if (!templateUrl) {
      setAspectRatio(1.414);
      return;
    }

    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setAspectRatio(image.naturalWidth / image.naturalHeight);
      }
    };
    image.src = templateUrl;
  }, [templateUrl]);

  return (
    <div
      className="w-full rounded-lg border border-dashed border-border relative overflow-hidden bg-muted/40"
      style={{ aspectRatio: `${aspectRatio}` }}
    >

      {/* Background image layer */}
      {templateUrl && (
        <div className="preview-wrapper absolute inset-0">
          <img
            src={templateUrl}
            alt={templateTitle ?? "certificate template"}
            className="preview-background-image absolute w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
        </div>
      )}

      {/* Fallback label when no template is selected */}
      {!templateUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground select-none" style={{ zIndex: 1 }}>
          No template selected
        </div>
      )}

      {/* ── Overlays ─────────────────────────────────────────────── */}

      {/* student_name placeholder */}
      {layoutConfig.showStudentName && (
        <div
          className="absolute"
          style={{
            left: `${layoutConfig.placeholderX}%`,
            top: `${layoutConfig.placeholderY}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <span className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground shadow whitespace-nowrap">
            {`{{${layoutConfig.placeholderField || "STUDENT_NAME"}}}`}
          </span>
        </div>
      )}

      {/* certificate_id placeholder */}
      {layoutConfig.showID && (
        <div
          className="absolute"
          style={{
            left: `${layoutConfig.idX}%`,
            top: `${layoutConfig.idY}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <span className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground shadow whitespace-nowrap">
            ID: 123456
          </span>
        </div>
      )}

      {/* QR code placeholder */}
      {layoutConfig.showQR && (
        <div
          className="absolute w-14 h-14 rounded-md border-2 border-dashed border-accent bg-accent/20 flex items-center justify-center"
          style={{
            left: `${layoutConfig.qrX}%`,
            top: `${layoutConfig.qrY}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <QrCode className="w-7 h-7 text-accent" />
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
            <Move className="w-3 h-3 text-accent-foreground" />
          </span>
        </div>
      )}
    </div>
  );
};
