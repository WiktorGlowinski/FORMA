"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase-server";
import { getErrorMessage } from "@/lib/error-message";

export type UploadBucket = "avatars" | "club-assets";



export async function uploadImageAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Brak autoryzacji do przesłania pliku." };
    }

    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as UploadBucket) || "avatars";
    const folder = (formData.get("folder") as string) || "general";

    if (!file || file.size === 0) {
      return { success: false, error: "Nie wybrano pliku." };
    }

    // Walidacja rozmiaru (maksymalnie 4.5 MB ze względu na limity Vercela)
    if (file.size > 4.5 * 1024 * 1024) {
      return { success: false, error: "Plik jest za duży (maksymalny rozmiar to 4.5 MB)." };
    }

    // Pobranie i weryfikacja rozszerzenia pliku
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const allowedExts = ["jpg", "jpeg", "png", "webp", "gif", "svg"];
    if (!allowedExts.includes(ext)) {
      return { success: false, error: "Niedozwolony format pliku (dozwolone: JPG, PNG, WEBP, SVG)." };
    }

    const fileName = `${folder}/${randomUUID()}.${ext}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: `Błąd uploadu: ${uploadError.message}` };
    }

    // Pobranie trwałego publicznego adresu URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { 
      success: true, 
      url: urlData.publicUrl 
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Wystąpił nieoczekiwany błąd.") };
  }
}
