import type { Metadata } from "next";
import Link from "next/link";

import { createGetDocksStatus } from "@/application/passenger-info/get-docks-status";
import { systemClock } from "@/application/shared/ports";
import { PrismaPassengerInfoRepository } from "@/infrastructure/passenger-info/prisma-passenger-info-repository";
import { requireRole } from "@/lib/auth/require-role";

import { DocksLiveBoard } from "./docks-live-board";

export const metadata: Metadata = { title: "Pasajero" };

export default async function PassengerPage() {
  const user = await requireRole("PASSENGER");
  const repo = new PrismaPassengerInfoRepository();
  const getDocksStatus = createGetDocksStatus({ repo, clock: systemClock });
  const initialStatus = await getDocksStatus();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="space-y-1">
        <p className="text-brand text-xs font-bold tracking-wide uppercase">Panel de pasajero</p>
        <h1 className="font-heading text-ink text-2xl font-bold">Hola, {user.fullName}</h1>
        <p className="text-ink-muted text-xs">
          Consulta las embarcaciones en abordaje, tiempos de llegada, horarios, tarifas y tus
          viajes.
        </p>
      </header>

      <DocksLiveBoard initialStatus={initialStatus} />

      <section aria-labelledby="passenger-shortcuts-heading" className="space-y-3">
        <h2 id="passenger-shortcuts-heading" className="font-heading text-ink text-lg font-bold">
          Servicios del pasajero
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/pasajero/horarios-tarifas"
            className="border-brand/20 hover:border-brand flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition"
          >
            <div>
              <p className="font-heading text-brand text-base font-bold">Horarios y tarifas</p>
              <p className="text-ink-muted mt-1 text-xs">
                Apertura, cierre por muelle y precios vigentes (RF-086)
              </p>
            </div>
            <span className="text-brand mt-3 text-xs font-bold">Consultar →</span>
          </Link>

          <Link
            href="/pasajero/viajes"
            className="border-brand/20 hover:border-brand flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition"
          >
            <div>
              <p className="font-heading text-brand text-base font-bold">Mis viajes</p>
              <p className="text-ink-muted mt-1 text-xs">
                Historial de cruces, lugares y tarifas pagadas (RF-087)
              </p>
            </div>
            <span className="text-brand mt-3 text-xs font-bold">Ver historial →</span>
          </Link>

          <Link
            href="/pasajero/cuenta"
            className="border-brand/20 hover:border-brand flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition"
          >
            <div>
              <p className="font-heading text-brand text-base font-bold">Mi cuenta</p>
              <p className="text-ink-muted mt-1 text-xs">
                Datos personales y aviso de privacidad (RF-014 y RF-015)
              </p>
            </div>
            <span className="text-brand mt-3 text-xs font-bold">Abrir →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
