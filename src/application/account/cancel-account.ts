import { randomBytes } from "node:crypto";

import type { PasswordHasher } from "@/application/auth/ports";
import {
  type AnonymizedAccountData,
  type BalanceForfeitureWarning,
  buildAnonymizedAccountData,
  buildBalanceForfeitureWarning,
  ensureAccountCanBeCancelled,
} from "@/domain/account/account-cancellation";
import { DomainError } from "@/domain/shared/domain-error";
import { Money } from "@/domain/shared/money";

import { cancelAccountSchema } from "./cancel-account-input";

export interface AccountCancellationSummary {
  id: string;
  email: string;
  fullName: string;
  status: string;
  deletedAt: Date | null;
  balanceCents: number;
}

export interface ExecuteAccountCancellationParams {
  userId: string;
  anonymizedData: AnonymizedAccountData;
  revokedAt: Date;
  forfeitedBalanceCents: number;
}

export interface AccountCancellationRepository {
  findAccountSummaryById(userId: string): Promise<AccountCancellationSummary | null>;
  executeCancellation(params: ExecuteAccountCancellationParams): Promise<void>;
}

export interface AccountCancellationPreview {
  userId: string;
  email: string;
  fullName: string;
  warning: BalanceForfeitureWarning;
}

export async function getAccountCancellationPreview(
  repo: AccountCancellationRepository,
  userId: string,
): Promise<AccountCancellationPreview> {
  const summary = await repo.findAccountSummaryById(userId);
  if (!summary) {
    throw new DomainError("ACCOUNT_NOT_FOUND", "No se encontró la cuenta del pasajero.");
  }

  ensureAccountCanBeCancelled(summary);
  const balance = Money.fromCents(summary.balanceCents);

  return {
    userId: summary.id,
    email: summary.email,
    fullName: summary.fullName,
    warning: buildBalanceForfeitureWarning(balance),
  };
}

export interface CancelAccountDeps {
  repo: AccountCancellationRepository;
  passwordHasher: PasswordHasher;
  generateRandomSecret?: () => string;
}

export interface CancelAccountResult {
  cancelledAt: Date;
  forfeitedBalanceCents: number;
}

export async function cancelAccount(
  deps: CancelAccountDeps,
  userId: string,
  rawInput: unknown,
  now: Date = new Date(),
): Promise<CancelAccountResult> {
  const parsed = cancelAccountSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstMessage =
      parsed.error.issues[0]?.message ?? "Los datos de confirmación no son válidos.";
    throw new DomainError("INVALID_CANCELLATION_INPUT", firstMessage);
  }

  const summary = await deps.repo.findAccountSummaryById(userId);
  if (!summary) {
    throw new DomainError("ACCOUNT_NOT_FOUND", "No se encontró la cuenta del pasajero.");
  }

  ensureAccountCanBeCancelled(summary);

  const balance = Money.fromCents(summary.balanceCents);
  if (balance.cents > 0 && !parsed.data.acknowledgeBalanceLoss) {
    throw new DomainError(
      "BALANCE_ACKNOWLEDGEMENT_REQUIRED",
      `Tienes un saldo de ${balance.format()}. Confirma que aceptas perderlo antes de cancelar tu cuenta.`,
    );
  }

  const secretGenerator = deps.generateRandomSecret ?? (() => randomBytes(32).toString("hex"));
  const randomPasswordHash = await deps.passwordHasher.hash(secretGenerator());
  const anonymizedData = buildAnonymizedAccountData(userId, randomPasswordHash, now);

  await deps.repo.executeCancellation({
    userId,
    anonymizedData,
    revokedAt: now,
    forfeitedBalanceCents: summary.balanceCents,
  });

  return {
    cancelledAt: now,
    forfeitedBalanceCents: summary.balanceCents,
  };
}
