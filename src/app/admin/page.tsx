import Link from "next/link";

const ADMIN_MODULES = [
  { title: "Abordaje y taquilla", detail: "RF-043 a RF-054 · Responsable: Cova" },
  { title: "Operación de muelles y salidas", detail: "RF-055 a RF-068 · Responsable: Pamela" },
  { title: "Gestión de flota", detail: "RF-088 a RF-093 · Responsable: Pamela" },
  { title: "Gestión de choferes", detail: "RF-094 a RF-096 · Responsable: Pamela" },
  { title: "Tarifas y descuentos", detail: "RF-097 a RF-101 · Responsable: Cova" },
  { title: "Horario de servicio y avisos", detail: "RF-102 a RF-105 · Responsable: José" },
];

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <header className="mb-6">
        <Link href="/" className="text-brand text-xs font-semibold hover:underline">
          ← Inicio
        </Link>
        <h1 className="font-heading text-brand mt-2 text-3xl font-bold">
          Administrador (taquilla)
        </h1>
        <p className="text-ink-muted mt-1 text-sm">
          Módulos disponibles y en construcción de esta sección:
        </p>
      </header>

      <div className="space-y-3">
        <Link
          href="/admin/descuentos"
          className="border-brand block rounded-2xl border-2 bg-sky-50/60 p-4 shadow-sm transition hover:bg-sky-50"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-brand text-base font-bold">Revisión de descuentos</h2>
            <span className="bg-brand rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white">
              Disponible →
            </span>
          </div>
          <p className="text-ink-muted mt-1 text-xs">
            RF-019 a RF-020 · Valida credenciales de Estudiante o INAPAM y asigna vigencia.
          </p>
        </Link>

        {ADMIN_MODULES.map((mod) => (
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
