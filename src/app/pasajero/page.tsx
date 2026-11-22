import Link from "next/link";

const PASSENGER_MODULES = [
  { title: "Cuenta y perfil", detail: "RF-014 a RF-020 · Responsable: José" },
  { title: "Saldo y recargas", detail: "RF-021 a RF-031 · Responsable: Cova" },
  { title: "Código QR de abordaje", detail: "RF-032 a RF-038 · Responsable: Diego" },
  { title: "Galería de vehículos", detail: "RF-039 a RF-042 · Responsable: José" },
  { title: "Mapa y rastreo en vivo", detail: "RF-077 a RF-081 · Responsable: Diego" },
  { title: "Información al pasajero", detail: "RF-082 a RF-087 · Responsable: José" },
];

export default function PassengerPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <header className="mb-6">
        <Link href="/" className="text-brand text-xs font-semibold hover:underline">
          ← Inicio
        </Link>
        <h1 className="font-heading text-brand mt-2 text-3xl font-bold">Pasajero</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Módulos disponibles y en construcción de esta sección:
        </p>
      </header>

      <div className="space-y-3">
        <Link
          href="/pasajero/descuento"
          className="border-brand block rounded-2xl border-2 bg-sky-50/60 p-4 shadow-sm transition hover:bg-sky-50"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-brand text-base font-bold">Descuentos</h2>
            <span className="bg-brand rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white">
              Disponible →
            </span>
          </div>
          <p className="text-ink-muted mt-1 text-xs">
            RF-019 a RF-020 · Solicita o consulta tu tarifa preferencial de Estudiante o INAPAM.
          </p>
        </Link>

        {PASSENGER_MODULES.map((mod) => (
          <div
            key={mod.title}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h2 className="font-heading text-ink text-base font-bold">{mod.title}</h2>
            <p className="text-ink-muted mt-0.5 text-xs">{mod.detail}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
