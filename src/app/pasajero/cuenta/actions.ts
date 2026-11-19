"use server";

import { revalidatePath } from "next/cache";

import { updateProfile } from "@/application/account/update-profile";
import { DomainError } from "@/domain/shared/domain-error";
import { PrismaAccountRepository } from "@/infrastructure/account/prisma-account-repository";

export interface ProfileActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function updatePassengerProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || userId.trim() === "") {
    return { status: "error", message: "No se pudo identificar la cuenta del pasajero." };
  }

  // TODO(#7): verificar sesión en servidor con requireRole("PASSENGER") y validar que userId coincida con la sesión.
  const repo = new PrismaAccountRepository();

  try {
    await updateProfile(repo, userId, {
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
    });

    revalidatePath("/pasajero/cuenta");
    return {
      status: "success",
      message: "Tus datos personales se actualizaron correctamente.",
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return { status: "error", message: error.message };
    }
    return {
      status: "error",
      message: "Ocurrió un problema al guardar los cambios. Intenta de nuevo.",
    };
  }
}
