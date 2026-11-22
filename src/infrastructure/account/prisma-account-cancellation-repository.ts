import type {
  AccountCancellationRepository,
  AccountCancellationSummary,
  ExecuteAccountCancellationParams,
} from "@/application/account/cancel-account";
import { Money } from "@/domain/shared/money";
import { prisma } from "@/infrastructure/db/prisma";

export class PrismaAccountCancellationRepository implements AccountCancellationRepository {
  async findAccountSummaryById(userId: string): Promise<AccountCancellationSummary | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        deletedAt: true,
        wallet: {
          select: {
            balance: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const balanceCents = user.wallet ? Money.fromPesos(user.wallet.balance).cents : 0;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      deletedAt: user.deletedAt,
      balanceCents,
    };
  }

  async executeCancellation(params: ExecuteAccountCancellationParams): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: params.userId },
        data: {
          deletedAt: params.anonymizedData.deletedAt,
          status: params.anonymizedData.status,
          fullName: params.anonymizedData.fullName,
          email: params.anonymizedData.email,
          phone: params.anonymizedData.phone,
          photoUrl: params.anonymizedData.photoUrl,
          passwordHash: params.anonymizedData.passwordHash,
        },
      });

      await tx.qrCredential.updateMany({
        where: {
          userId: params.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: params.revokedAt,
        },
      });

      await tx.session.deleteMany({
        where: {
          userId: params.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: "ACCOUNT_CANCELLED",
          entity: "User",
          entityId: params.userId,
          details: {
            forfeitedBalanceCents: params.forfeitedBalanceCents,
          },
        },
      });
    });
  }
}
