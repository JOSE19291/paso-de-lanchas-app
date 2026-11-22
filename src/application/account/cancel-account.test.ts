import { describe, expect, it } from "vitest";

import type { PasswordHasher } from "@/application/auth/ports";

import {
  type AccountCancellationRepository,
  type AccountCancellationSummary,
  cancelAccount,
  type ExecuteAccountCancellationParams,
  getAccountCancellationPreview,
} from "./cancel-account";

interface StoredUserRecord {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  photoUrl: string | null;
  passwordHash: string;
  status: string;
  deletedAt: Date | null;
}

class InMemoryAccountCancellationRepository implements AccountCancellationRepository {
  users: StoredUserRecord[] = [];
  wallets: Array<{ userId: string; balanceCents: number }> = [];
  qrCredentials: Array<{ id: string; userId: string; revokedAt: Date | null }> = [];
  sessions: Array<{ id: string; userId: string }> = [];
  auditLogs: Array<{ userId: string; action: string; entity: string; entityId: string }> = [];

  async findAccountSummaryById(userId: string): Promise<AccountCancellationSummary | null> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;
    const wallet = this.wallets.find((w) => w.userId === userId);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      deletedAt: user.deletedAt,
      balanceCents: wallet?.balanceCents ?? 0,
    };
  }

  async executeCancellation(params: ExecuteAccountCancellationParams): Promise<void> {
    const user = this.users.find((u) => u.id === params.userId)!;
    user.deletedAt = params.anonymizedData.deletedAt;
    user.status = params.anonymizedData.status;
    user.fullName = params.anonymizedData.fullName;
    user.email = params.anonymizedData.email;
    user.phone = params.anonymizedData.phone;
    user.photoUrl = params.anonymizedData.photoUrl;
    user.passwordHash = params.anonymizedData.passwordHash;

    for (const qr of this.qrCredentials) {
      if (qr.userId === params.userId && qr.revokedAt === null) {
        qr.revokedAt = params.revokedAt;
      }
    }

    this.sessions = this.sessions.filter((s) => s.userId !== params.userId);

    this.auditLogs.push({
      userId: params.userId,
      action: "ACCOUNT_CANCELLED",
      entity: "User",
      entityId: params.userId,
    });
  }
}

const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async () => false,
};

describe("cancelAccount use case", () => {
  const now = new Date("2026-11-22T15:00:00.000Z");

  it("anonimiza datos personales, revoca QR, borra sesiones, registra auditoría y conserva registros financieros", async () => {
    const repo = new InMemoryAccountCancellationRepository();
    repo.users.push({
      id: "user-1",
      email: "ana@pasolanchas.test",
      fullName: "Ana López",
      phone: "9211234567",
      photoUrl: "https://ejemplo.test/foto.jpg",
      passwordHash: "old-hash",
      status: "ACTIVE",
      deletedAt: null,
    });
    repo.wallets.push({ userId: "user-1", balanceCents: 0 });
    repo.qrCredentials.push({ id: "qr-1", userId: "user-1", revokedAt: null });
    repo.sessions.push(
      { id: "sess-1", userId: "user-1" },
      { id: "sess-2", userId: "user-1" },
      { id: "sess-other", userId: "user-2" },
    );

    const result = await cancelAccount(
      {
        repo,
        passwordHasher: fakeHasher,
        generateRandomSecret: () => "secreto-aleatorio-123",
      },
      "user-1",
      { confirmationWord: "cancelar" },
      now,
    );

    expect(result.cancelledAt).toEqual(now);
    expect(result.forfeitedBalanceCents).toBe(0);

    const updatedUser = repo.users[0]!;
    expect(updatedUser.deletedAt).toEqual(now);
    expect(updatedUser.status).toBe("INACTIVE");
    expect(updatedUser.fullName).toBe("Usuario eliminado");
    expect(updatedUser.email).toBe("eliminado-user-1@pasolanchas.invalid");
    expect(updatedUser.phone).toBeNull();
    expect(updatedUser.photoUrl).toBeNull();
    expect(updatedUser.passwordHash).toBe("hashed:secreto-aleatorio-123");

    expect(repo.qrCredentials[0]?.revokedAt).toEqual(now);
    expect(repo.sessions).toEqual([{ id: "sess-other", userId: "user-2" }]);
    expect(repo.wallets).toHaveLength(1);
    expect(repo.auditLogs).toHaveLength(1);
    expect(repo.auditLogs[0]?.action).toBe("ACCOUNT_CANCELLED");
  });

  it("avisa cuando el pasajero tiene saldo mayor a $0 y exige confirmación explícita", async () => {
    const repo = new InMemoryAccountCancellationRepository();
    repo.users.push({
      id: "user-saldo",
      email: "pasajero@pasolanchas.test",
      fullName: "Carlos Ruiz",
      phone: "9219876543",
      photoUrl: null,
      passwordHash: "hash",
      status: "ACTIVE",
      deletedAt: null,
    });
    repo.wallets.push({ userId: "user-saldo", balanceCents: 10000 });

    const preview = await getAccountCancellationPreview(repo, "user-saldo");
    expect(preview.warning.hasBalance).toBe(true);
    expect(preview.warning.message).toContain("100.00");

    await expect(
      cancelAccount(
        { repo, passwordHasher: fakeHasher },
        "user-saldo",
        { confirmationWord: "CANCELAR", acknowledgeBalanceLoss: false },
        now,
      ),
    ).rejects.toThrow("Confirma que aceptas perderlo");

    const confirmed = await cancelAccount(
      { repo, passwordHasher: fakeHasher },
      "user-saldo",
      { confirmationWord: "CANCELAR", acknowledgeBalanceLoss: true },
      now,
    );
    expect(confirmed.forfeitedBalanceCents).toBe(10000);
    expect(repo.users[0]?.status).toBe("INACTIVE");
  });

  it("rechaza confirmación inválida o cuenta inexistente", async () => {
    const repo = new InMemoryAccountCancellationRepository();
    await expect(
      cancelAccount(
        { repo, passwordHasher: fakeHasher },
        "user-1",
        { confirmationWord: "NO" },
        now,
      ),
    ).rejects.toThrow("Debes escribir la palabra CANCELAR");

    await expect(getAccountCancellationPreview(repo, "inexistente")).rejects.toThrow(
      "No se encontró la cuenta del pasajero.",
    );
  });
});
