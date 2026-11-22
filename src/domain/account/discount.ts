import { DomainError } from "@/domain/shared/domain-error";

export type DiscountType = "STUDENT" | "INAPAM";

export type DiscountRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface DiscountRequest {
  id: string;
  userId: string;
  discountType: DiscountType;
  credentialPhotoPath: string;
  status: DiscountRequestStatus;
  reviewedById: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  validUntil: Date | null;
  createdAt: Date;
}

export function validateApprovalExpiration(validUntil: Date, now: Date = new Date()): void {
  if (Number.isNaN(validUntil.getTime()) || validUntil.getTime() <= now.getTime()) {
    throw new DomainError(
      "INVALID_EXPIRATION_DATE",
      "La fecha de vencimiento del descuento debe ser futura.",
    );
  }
}

export function validateRejectionReason(reason: string): string {
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new DomainError("REJECTION_REASON_REQUIRED", "Debes indicar el motivo del rechazo.");
  }
  return trimmed;
}

export function isDiscountActive(
  request: Pick<DiscountRequest, "status" | "validUntil">,
  at: Date = new Date(),
): boolean {
  if (request.status !== "APPROVED" || !request.validUntil) {
    return false;
  }
  return request.validUntil.getTime() > at.getTime();
}

export function getDiscountTypeLabel(type: DiscountType): string {
  return type === "STUDENT" ? "Estudiante" : "INAPAM";
}

export function getDiscountStatusLabel(status: DiscountRequestStatus): string {
  switch (status) {
    case "PENDING":
      return "En revisión";
    case "APPROVED":
      return "Aprobada";
    case "REJECTED":
      return "Rechazada";
    case "EXPIRED":
      return "Vencida";
  }
}
