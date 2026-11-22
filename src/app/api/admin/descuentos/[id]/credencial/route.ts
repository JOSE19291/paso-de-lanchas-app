import { NextResponse } from "next/server";

import {
  PrismaDiscountRepository,
  readPrivateCredentialFile,
  resolveDevAdminUser,
} from "@/infrastructure/account/prisma-discount-repository";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  // TODO(#7): Validar sesión activa con requireRole("ADMIN") cuando se fusione el login.
  const admin = await resolveDevAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "Acceso restringido exclusivamente a administradores." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const repo = new PrismaDiscountRepository();
  const discountRequest = await repo.findById(id);

  if (!discountRequest) {
    return NextResponse.json(
      { error: "No se encontró la solicitud de descuento." },
      { status: 404 },
    );
  }

  const stored = await readPrivateCredentialFile(discountRequest.credentialPhotoPath);
  if (!stored) {
    return NextResponse.json(
      { error: "El archivo de la credencial no está disponible en el servidor." },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(stored.buffer), {
    status: 200,
    headers: {
      "Content-Type": stored.contentType,
      "Cache-Control": "no-store, private",
    },
  });
}
