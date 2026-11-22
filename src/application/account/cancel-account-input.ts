import { z } from "zod";

export const cancelAccountSchema = z.object({
  confirmationWord: z
    .string({ error: "Escribe CANCELAR para confirmar." })
    .trim()
    .refine((value) => value.toUpperCase() === "CANCELAR", {
      message: "Debes escribir la palabra CANCELAR para confirmar.",
    }),
  acknowledgeBalanceLoss: z.boolean().optional().default(false),
});

export type CancelAccountInput = z.infer<typeof cancelAccountSchema>;
