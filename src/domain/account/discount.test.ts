import { describe, expect, it } from "vitest";

import {
  getDiscountStatusLabel,
  getDiscountTypeLabel,
  isDiscountActive,
  validateApprovalExpiration,
  validateRejectionReason,
} from "./discount";

describe("discount domain rules", () => {
  const now = new Date("2026-11-21T12:00:00.000Z");

  it("valida que la fecha de vencimiento al aprobar sea futura", () => {
    const future = new Date("2027-06-30T23:59:59.000Z");
    expect(() => validateApprovalExpiration(future, now)).not.toThrow();

    expect(() => validateApprovalExpiration(now, now)).toThrow(
      "La fecha de vencimiento del descuento debe ser futura.",
    );
    expect(() => validateApprovalExpiration(new Date("2026-10-01T00:00:00.000Z"), now)).toThrow(
      "La fecha de vencimiento del descuento debe ser futura.",
    );
    expect(() => validateApprovalExpiration(new Date("invalid"), now)).toThrow(
      "La fecha de vencimiento del descuento debe ser futura.",
    );
  });

  it("exige un motivo no vacío al rechazar una solicitud", () => {
    expect(validateRejectionReason("  Credencial ilegible  ")).toBe("Credencial ilegible");
    expect(() => validateRejectionReason("   ")).toThrow("Debes indicar el motivo del rechazo.");
  });

  it("determina correctamente si un descuento está activo (aprobado y no vencido)", () => {
    const future = new Date("2027-01-15T00:00:00.000Z");
    const past = new Date("2026-11-01T00:00:00.000Z");

    expect(isDiscountActive({ status: "APPROVED", validUntil: future }, now)).toBe(true);
    expect(isDiscountActive({ status: "APPROVED", validUntil: past }, now)).toBe(false);
    expect(isDiscountActive({ status: "APPROVED", validUntil: now }, now)).toBe(false);
    expect(isDiscountActive({ status: "APPROVED", validUntil: null }, now)).toBe(false);
    expect(isDiscountActive({ status: "PENDING", validUntil: future }, now)).toBe(false);
    expect(isDiscountActive({ status: "REJECTED", validUntil: future }, now)).toBe(false);
    expect(isDiscountActive({ status: "EXPIRED", validUntil: past }, now)).toBe(false);
  });

  it("devuelve etiquetas legibles para tipos y estados de descuento", () => {
    expect(getDiscountTypeLabel("STUDENT")).toBe("Estudiante");
    expect(getDiscountTypeLabel("INAPAM")).toBe("INAPAM");
    expect(getDiscountStatusLabel("PENDING")).toBe("En revisión");
    expect(getDiscountStatusLabel("APPROVED")).toBe("Aprobada");
    expect(getDiscountStatusLabel("REJECTED")).toBe("Rechazada");
    expect(getDiscountStatusLabel("EXPIRED")).toBe("Vencida");
  });
});
