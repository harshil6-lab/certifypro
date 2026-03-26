export type LayoutConfig = {
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
};

export const defaultLayoutConfig: LayoutConfig = {
  showStudentName: true,
  showQR: true,
  showID: true,
  placeholderField: "STUDENT_NAME",
  placeholderX: 40,
  placeholderY: 36,
  qrX: 82,
  qrY: 76,
  idX: 10,
  idY: 88,
};

const toNumber = (value: unknown, fallback: number) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const toBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return fallback;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export const normalizeLayoutConfig = (raw: unknown): LayoutConfig => {
  const source = asRecord(raw);
  const studentName = asRecord(source.student_name);
  const qrCode = asRecord(source.qr_code);
  const certificateId = asRecord(source.certificate_id);

  return {
    showStudentName: toBoolean(
      source.showStudentName ?? source.show_name ?? studentName.visible,
      defaultLayoutConfig.showStudentName,
    ),
    showQR: toBoolean(source.showQR ?? source.show_qr ?? qrCode.visible, defaultLayoutConfig.showQR),
    showID: toBoolean(source.showID ?? source.show_id ?? certificateId.visible, defaultLayoutConfig.showID),
    placeholderField:
      typeof source.placeholderField === "string" && source.placeholderField.trim()
        ? source.placeholderField.trim().toUpperCase()
        : defaultLayoutConfig.placeholderField,
    placeholderX: toNumber(
      source.placeholderX ?? source.nameX ?? studentName.x,
      defaultLayoutConfig.placeholderX,
    ),
    placeholderY: toNumber(
      source.placeholderY ?? source.nameY ?? studentName.y,
      defaultLayoutConfig.placeholderY,
    ),
    qrX: toNumber(source.qrX ?? source.qr_x ?? qrCode.x, defaultLayoutConfig.qrX),
    qrY: toNumber(source.qrY ?? source.qr_y ?? qrCode.y, defaultLayoutConfig.qrY),
    idX: toNumber(source.idX ?? source.id_x ?? certificateId.x, defaultLayoutConfig.idX),
    idY: toNumber(source.idY ?? source.id_y ?? certificateId.y, defaultLayoutConfig.idY),
  };
};