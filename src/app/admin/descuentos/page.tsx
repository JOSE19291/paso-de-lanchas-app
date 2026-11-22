import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { listPendingDiscounts } from "@/application/account/list-pending-discounts";
import { PrismaDiscountRepository } from "@/infrastructure/account/prisma-discount-repository";

import { PendingDiscountsReviewList } from "./review-list";

async function AdminPendingDiscountsContent() {
  await connection();
  const repo = new PrismaDiscountRepository();
  const pending = await listPendingDiscounts(repo);
  return <PendingDiscountsReviewList items={pending} />;
}

export default function AdminDiscountsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      <header className="mb-5">
        <Link href="/admin" className="text-brand text-xs font-semibold hover:underline">
          ← Volver a Administración
        </Link>
        <h1 className="font-heading text-ink mt-1 text-2xl font-bold">Descuentos pendientes</h1>
        <p className="text-ink-muted text-xs">
          Verifica credenciales de Estudiante o INAPAM, asigna vigencia o indica motivo de rechazo.
        </p>
      </header>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-200" />}>
        <AdminPendingDiscountsContent />
      </Suspense>
    </main>
  );
}
