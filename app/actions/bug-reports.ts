"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getErrorMessage } from "@/lib/error-message";

async function getReporter() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Zaloguj się, aby wysłać zgłoszenie.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.is_active === false) {
    throw new Error("Konto jest wyłączone.");
  }
  return { user, clubId: profile.club_id || null };
}

export async function submitBugReportAction(formData: FormData) {
  try {
    const { user, clubId } = await getReporter();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const category = String(formData.get("category") || "bug");
    const priority = String(formData.get("priority") || "normal");
    const pageUrl = String(formData.get("pageUrl") || "").slice(0, 500);
    const browserInfo = String(formData.get("browserInfo") || "").slice(0, 500);
    const file = formData.get("screenshot");

    if (title.length < 3 || description.length < 10) {
      return { success: false, error: "Podaj tytuł i dokładniejszy opis problemu." };
    }
    if (!["bug", "suggestion", "login"].includes(category) || !["low", "normal", "high"].includes(priority)) {
      return { success: false, error: "Nieprawidłowa kategoria lub priorytet." };
    }

    let screenshotPath: string | null = null;
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) return { success: false, error: "Zrzut ekranu może mieć maksymalnie 5 MB." };
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        return { success: false, error: "Dozwolone są zrzuty PNG, JPG lub WEBP." };
      }
      screenshotPath = `${user.id}/${randomUUID()}.${file.type.split("/")[1]}`;
      const { error } = await supabaseAdmin.storage.from("bug-reports").upload(
        screenshotPath,
        Buffer.from(await file.arrayBuffer()),
        { contentType: file.type, upsert: false }
      );
      if (error) throw error;
    }

    const { error } = await supabaseAdmin.from("bug_reports").insert({
      user_id: user.id,
      club_id: clubId,
      title,
      description,
      category,
      priority,
      page_url: pageUrl || null,
      browser_info: browserInfo || null,
      screenshot_path: screenshotPath,
    });
    if (error) {
      if (screenshotPath) await supabaseAdmin.storage.from("bug-reports").remove([screenshotPath]);
      throw error;
    }
    revalidatePath("/master-admin");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, "Nie udało się wysłać zgłoszenia.") };
  }
}

export async function getMasterBugReportsAction() {
  try {
    const { user } = await getReporter();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.is_active === false || profile.role !== "master_admin") {
      throw new Error("Brak uprawnień.");
    }
    const { data, error } = await supabaseAdmin
      .from("bug_reports")
      .select("id, user_id, club_id, title, description, category, priority, page_url, browser_info, screenshot_path, status, admin_note, created_at, resolved_at")
      .order("created_at", { ascending: false }).limit(300);
    if (error) throw error;
    const reports = await Promise.all((data || []).map(async (report) => {
      const signed = report.screenshot_path
        ? await supabaseAdmin.storage.from("bug-reports").createSignedUrl(report.screenshot_path, 3600)
        : { data: null };
      return { ...report, screenshot_url: signed.data?.signedUrl || null };
    }));
    return { success: true, reports };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, "Nie udało się pobrać zgłoszeń."), reports: [] };
  }
}

export async function updateMasterBugReportAction(reportId: string, status: string, adminNote: string) {
    try {
      const { user } = await getReporter();
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile || profile.is_active === false || profile.role !== "master_admin") {
        throw new Error("Brak uprawnień.");
      }
      if (!["new", "in_progress", "resolved", "rejected"].includes(status)) {
        throw new Error("Nieprawidłowy status.");
      }
      const { error } = await supabaseAdmin.from("bug_reports").update({
        status,
        admin_note: adminNote.trim().slice(0, 2000) || null,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      }).eq("id", reportId);
      if (error) throw error;
      revalidatePath("/master-admin");
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error, "Nie udało się zaktualizować zgłoszenia.") };
  }
}
