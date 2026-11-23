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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("club_id, role, is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.is_active === false || !profile.club_id) {
      return { success: false, error: "Konto nie ma aktywnego klubu." };
    }
    if (!["master_admin", "club_admin", "coordinator", "coach"].includes(profile.role)) {
      return { success: false, error: "Brak uprawnień do przesłania pliku." };
    }

    const file = formData.get("file") as File | null;
    const requestedBucket = (formData.get("bucket") as string) || "avatars";
    const requestedFolder = (formData.get("folder") as string) || "general";
    if (!["avatars", "club-assets"].includes(requestedBucket)) {
      return { success: false, error: "Nieprawidłowy magazyn plików." };
    }
    const bucket = requestedBucket as UploadBucket;
    const folder = ["players", "coaches", "logos", "general"].includes(requestedFolder)
      ? requestedFolder
      : "general";

    if (!file || file.size === 0) {
      return { success: false, error: "Nie wybrano pliku." };
    }

    // Walidacja rozmiaru (maksymalnie 4.5 MB ze względu na limity Vercela)
    if (file.size > 4.5 * 1024 * 1024) {
      return { success: false, error: "Plik jest za duży (maksymalny rozmiar to 4.5 MB)." };
    }

    // Pobranie i weryfikacja rozszerzenia pliku
    const extByMime: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = extByMime[file.type];
    if (!ext) {
      return { success: false, error: "Niedozwolony format pliku (dozwolone: JPG, PNG, WEBP)." };
    }

    const fileName = `${profile.club_id}/${folder}/${randomUUID()}.${ext}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
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
