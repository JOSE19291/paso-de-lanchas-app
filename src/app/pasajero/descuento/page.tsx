import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { getMyDiscount } from "@/application/account/get-my-discount";
import {
  PrismaDiscountRepository,
  resolveDevPassengerUser,
} from "@/infrastructure/account/prisma-discount-repository";

import { DiscountForm } from "./discount-form";

async function PassengerDiscountContent() {
  await connection();
  const passenger = await resolveDevPassengerUser();
  if (!passenger) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
        No se encontró el usuario pasajero de prueba. Ejecuta <code>npm run db:seed</code>.
      </div>
    );
  }

  const repo = new PrismaDiscountRepository();
  const latestRequest = await getMyDiscount(repo, passenger.id);
  return <DiscountForm passengerName={passenger.fullName} latestRequest={latestRequest} />;
}

export default function PassengerDiscountPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <header className="mb-5">
        <Link href="/pasajero" className="text-brand text-xs font-semibold hover:underline">
          ← Volver a Pasajero
        </Link>
        <h1 className="font-heading text-ink mt-1 text-2xl font-bold">Descuentos</h1>
        <p className="text-ink-muted text-xs">
          Solicita o consulta tu tarifa preferencial de Estudiante o INAPAM.
        </p>
      </header>
      <Suspense fallback={<div className="h-56 animate-pulse rounded-2xl bg-slate-200" />}>
        <PassengerDiscountContent />
      </Suspense>
    </main>
  );
}
