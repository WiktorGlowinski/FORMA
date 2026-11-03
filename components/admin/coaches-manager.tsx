"use client";

import { useState, useRef } from "react";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Crown, 
  Lock, 
  User, 
  X, 
  Search,
  Edit2,
  Trash2,
  Camera,
  Upload,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { 
  createCoachAccountAction, 
  updateCoachAction, 
  deleteCoachAction 
} from "@/app/actions/admin";
import { uploadImageAction } from "@/app/actions/upload";

interface AssignedTeamInfo {
  id: string;
  name: string;
  ageGroup: string;
  isPrimary: boolean;
}

export interface CoachCardItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  assignedTeams: AssignedTeamInfo[];
}

export function CoachesManager({
  initialCoaches,
}: {
  initialCoaches: CoachCardItem[];
}) {
  const [coaches, setCoaches] = useState<CoachCardItem[]>(initialCoaches);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modale
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<CoachCardItem | null>(null);
  const [deletingCoach, setDeletingCoach] = useState<CoachCardItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formularz tworzenia
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createAvatar, setCreateAvatar] = useState("");
  const [isUploadingCreateAvatar, setIsUploadingCreateAvatar] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);

  // Formularz edycji
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUploadingEditAvatar, setIsUploadingEditAvatar] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const filteredCoaches = coaches.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  // Otwarcie modalu edycji
  function handleOpenEdit(coach: CoachCardItem) {
    setEditingCoach(coach);
    setEditName(coach.fullName);
    setEditEmail(coach.email);
    setEditPhone(coach.phone || "");
    setEditAvatar(coach.avatarUrl || "");
    setEditPassword("");
    setEditIsActive(coach.isActive);
    setErrorMsg(null);
  }

  // Upload zdjęcia w formularzu tworzenia
  async function handleCreateAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCreateAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "avatars");
    formData.append("folder", "coaches");

    const res = await uploadImageAction(formData);
    if (res.success && res.url) {
      setCreateAvatar(res.url);
    } else {
      alert(res.error || "Nie udało się wgrać zdjęcia trenera.");
    }
    setIsUploadingCreateAvatar(false);
  }

  // Upload zdjęcia w formularzu edycji
  async function handleEditAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingEditAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "avatars");
    formData.append("folder", "coaches");

    const res = await uploadImageAction(formData);
    if (res.success && res.url) {
      setEditAvatar(res.url);
    } else {
      alert(res.error || "Nie udało się wgrać zdjęcia trenera.");
    }
    setIsUploadingEditAvatar(false);
  }

  // Zapis utworzenia trenera
  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const res = await createCoachAccountAction({
      fullName: createName,
      email: createEmail,
      password: createPassword,
      phone: createPhone || undefined,
      avatarUrl: createAvatar || undefined,
    });

    if (res.success && res.coach) {
      setCoaches((prev) => [
        {
          id: res.coach.id,
          fullName: res.coach.full_name,
          email: res.coach.email,
          phone: res.coach.phone || null,
          avatarUrl: res.coach.avatar_url || null,
          isActive: true,
          assignedTeams: [],
        },
        ...prev,
      ]);

      setCreateName("");
      setCreateEmail("");
      setCreatePhone("");
      setCreatePassword("");
      setCreateAvatar("");
      setIsCreateOpen(false);
    } else {
      setErrorMsg(res.error || "Nie udało się utworzyć trenera.");
    }
    setIsSubmitting(false);
  }

  // Zapis edycji trenera
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCoach) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    const res = await updateCoachAction({
      coachId: editingCoach.id,
      fullName: editName,
      email: editEmail,
      phone: editPhone || undefined,
      avatarUrl: editAvatar || undefined,
      newPassword: editPassword.trim() || undefined,
      isActive: editIsActive,
    });

    if (res.success) {
      setCoaches((prev) =>
        prev.map((c) =>
          c.id === editingCoach.id
            ? {
                ...c,
                fullName: editName.trim(),
                email: editEmail.trim(),
                phone: editPhone.trim() || null,
                avatarUrl: editAvatar.trim() || null,
                isActive: editIsActive,
              }
            : c
        )
      );
      setEditingCoach(null);
    } else {
      setErrorMsg(res.error || "Nie udało się zaktualizować danych trenera.");
    }
    setIsSubmitting(false);
  }

  // Potwierdzenie usunięcia
  async function handleDeleteConfirm() {
    if (!deletingCoach) return;

    setIsSubmitting(true);
    const res = await deleteCoachAction(deletingCoach.id);

    if (res.success) {
      setCoaches((prev) => prev.filter((c) => c.id !== deletingCoach.id));
      setDeletingCoach(null);
    } else {
      alert(res.error || "Nie udało się usunąć trenera.");
    }
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Pasek nagłówkowy */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b-2 border-foreground/15 pb-6">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            Kadra Szkoleniowa Klubu
          </p>
          <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight sm:text-5xl">
            Sztab Trenerski
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Baza zarejestrowanych szkoleniowców, zdjęcia profilowe, edycja danych i uprawnienia.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-foreground bg-primary px-4 text-xs font-heading uppercase tracking-wider font-black text-primary-foreground transition active:scale-95 shadow-[3px_3px_0_0_var(--foreground)] shrink-0"
        >
          <UserPlus className="size-4 stroke-[3]" />
          <span>Dodaj trenera</span>
        </button>
      </div>

      {/* Wyszukiwarka */}
      <div className="relative flex items-center max-w-md">
        <Search className="absolute left-3.5 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Szukaj trenera po nazwisku, mailu lub telefonie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 w-full rounded-xl border-2 border-foreground/15 bg-card pl-10 pr-3 font-mono text-xs outline-none focus:border-foreground"
        />
      </div>

      {/* Siatka kart trenerów */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoaches.length === 0 ? (
          <div className="col-span-full rounded-2xl border-2 border-foreground/15 bg-card p-12 text-center text-xs font-mono text-muted-foreground">
            Brak zarejestrowanych szkoleniowców spełniających kryteria.
          </div>
        ) : (
          filteredCoaches.map((coach) => (
            <div
              key={coach.id}
              className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm space-y-4 hover:border-foreground/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Klikalny awatar otwierający edycję */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(coach)}
                      className="group/avatar relative size-12 rounded-xl border border-foreground/20 bg-muted overflow-hidden flex items-center justify-center shrink-0 hover:border-primary transition-all cursor-pointer"
                      title="Kliknij, aby zmienić zdjęcie lub edytować trenera"
                    >
                      {coach.avatarUrl ? (
                        <img
                          src={coach.avatarUrl}
                          alt={coach.fullName}
                          className="size-full object-cover group-hover/avatar:opacity-60 transition-opacity"
                        />
                      ) : (
                        <Users className="size-6 text-primary group-hover/avatar:hidden" />
                      )}
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                        <Camera className="size-4 text-primary" />
                      </div>
                    </button>

                    <div className="min-w-0">
                      <h3 className="font-heading text-xl uppercase tracking-tight truncate">
                        {coach.fullName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block rounded bg-primary/10 border border-primary/25 px-2 py-0.5 font-mono text-[9px] font-bold text-primary uppercase">
                          Licencja
                        </span>
                        {!coach.isActive && (
                          <span className="inline-block rounded bg-destructive/15 border border-destructive/30 px-1.5 py-0.5 font-mono text-[9px] font-bold text-destructive uppercase">
                            Zablokowany
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kontakty */}
                <div className="space-y-1.5 border-t border-border/80 pt-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{coach.email}</span>
                  </div>
                  {coach.phone ? (
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Phone className="size-3.5 shrink-0 text-primary" />
                      <a href={`tel:${coach.phone}`} className="hover:underline">
                        {coach.phone}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground/60 italic text-[11px]">
                      <Phone className="size-3.5 shrink-0" />
                      <span>Brak numeru telefonu</span>
                    </div>
                  )}
                </div>

                {/* Prowadzone drużyny */}
                <div className="border-t border-border/80 pt-3">
                  <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground block mb-2">
                    Prowadzone drużyny ({coach.assignedTeams.length}):
                  </span>
                  {coach.assignedTeams.length === 0 ? (
                    <span className="font-mono text-[11px] text-muted-foreground italic">
                      Nieprzypisany do żadnego zespołu
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {coach.assignedTeams.map((tm) => (
                        <span
                          key={tm.id}
                          className="inline-flex items-center gap-1 rounded-md border border-foreground/15 bg-background px-2 py-1 font-mono text-[10px] font-bold text-foreground"
                        >
                          {tm.isPrimary && <Crown className="size-3 text-amber-500" />}
                          {tm.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dolne przyciski akcji */}
              <div className="border-t border-border/80 pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(coach)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/20 bg-background px-3 py-1.5 font-mono text-xs font-bold hover:bg-muted transition-colors"
                >
                  <Edit2 className="size-3.5 text-primary" />
                  <span>Edytuj</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingCoach(coach)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 font-mono text-xs text-destructive hover:bg-destructive/15 transition-colors"
                  title="Usuń trenera z bazy"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: TWORZENIE NOWEGO TRENERA */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)] space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-primary tracking-widest block">
                  Kadra Klubu
                </span>
                <h3 className="font-heading text-2xl uppercase tracking-tight">
                  Nowy Trener
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full border p-1 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-mono text-destructive">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              {/* UPLOAD ZDJĘCIA TRENERA */}
              <div className="flex items-center gap-4 rounded-xl border border-foreground/15 bg-background p-3">
                <div 
                  onClick={() => !isUploadingCreateAvatar && createFileRef.current?.click()}
                  className="relative size-16 rounded-xl border-2 border-dashed border-foreground/30 bg-muted/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-foreground shrink-0 transition"
                  title="Wybierz plik z dysku"
                >
                  {createAvatar ? (
                    <img src={createAvatar} alt="Awatar" className="size-full object-cover" />
                  ) : (
                    <User className="size-7 text-muted-foreground" />
                  )}

                  {isUploadingCreateAvatar && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="size-5 text-primary animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <input
                    ref={createFileRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleCreateAvatarUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingCreateAvatar}
                      onClick={() => createFileRef.current?.click()}
                      className="h-8 px-2.5 rounded-lg border border-foreground/20 bg-card font-heading text-xs uppercase font-bold hover:bg-muted transition"
                    >
                      {createAvatar ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
                    </button>
                    {createAvatar && (
                      <button
                        type="button"
                        onClick={() => setCreateAvatar("")}
                        className="h-8 px-2 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Zdjęcie profilowe trenera (PNG, JPG, WEBP).
                  </p>
                </div>
              </div>

              <div>
                <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Imię i nazwisko szkoleniowca
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="np. Marek Papszun"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background pl-10 pr-3 font-mono text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                    E-mail (Login)
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      placeholder="trener@forma.pl"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background pl-9 pr-2.5 font-mono text-xs outline-none focus:border-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                    Telefon
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3 size-4 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="500-100-200"
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background pl-9 pr-2.5 font-mono text-xs outline-none focus:border-foreground"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Hasło startowe do aplikacji
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="haslo123"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background pl-10 pr-3 font-mono text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground/20 bg-background font-heading text-xs uppercase hover:bg-muted"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingCreateAvatar}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-bold uppercase text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-50"
                >
                  {isSubmitting ? "Tworzenie..." : "Zarejestruj trenera"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDYCJA TRENERA I JEGO ZDJĘCIA */}
      {editingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)] space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-primary tracking-widest block">
                  Edycja Szkoleniowca
                </span>
                <h3 className="font-heading text-2xl uppercase tracking-tight">
                  {editingCoach.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoach(null)}
                className="rounded-full border p-1 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-mono text-destructive">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              {/* UPLOAD ZDJĘCIA W EDYCJI */}
              <div className="flex items-center gap-4 rounded-xl border border-foreground/15 bg-background p-3">
                <div 
                  onClick={() => !isUploadingEditAvatar && editFileRef.current?.click()}
                  className="relative size-16 rounded-xl border-2 border-dashed border-foreground/30 bg-muted/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-foreground shrink-0 transition"
                  title="Wybierz plik z dysku"
                >
                  {editAvatar ? (
                    <img src={editAvatar} alt="Awatar" className="size-full object-cover" />
                  ) : (
                    <User className="size-7 text-muted-foreground" />
                  )}

                  {isUploadingEditAvatar && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="size-5 text-primary animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <input
                    ref={editFileRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleEditAvatarUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingEditAvatar}
                      onClick={() => editFileRef.current?.click()}
                      className="h-8 px-2.5 rounded-lg border border-foreground/20 bg-card font-heading text-xs uppercase font-bold hover:bg-muted transition"
                    >
                      {editAvatar ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
                    </button>
                    {editAvatar && (
                      <button
                        type="button"
                        onClick={() => setEditAvatar("")}
                        className="h-8 px-2 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Aktualny awatar szkoleniowca.
                  </p>
                </div>
              </div>

              <div>
                <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Imię i nazwisko
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background pl-10 pr-3 font-mono text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                    E-mail
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background pl-9 pr-2.5 font-mono text-xs outline-none focus:border-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                    Telefon
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3 size-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background pl-9 pr-2.5 font-mono text-xs outline-none focus:border-foreground"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Nowe hasło (Zostaw puste, by nie zmieniać)
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Wpisz nowe hasło..."
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background pl-10 pr-3 font-mono text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>

              {/* Status aktywności */}
              <label className="flex items-center gap-2.5 rounded-xl border border-foreground/15 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
                <span className="font-mono text-xs font-bold uppercase">
                  Konto aktywne (zezwolenie na logowanie do /trener)
                </span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCoach(null)}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground/20 bg-background font-heading text-xs uppercase hover:bg-muted"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingEditAvatar}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-bold uppercase text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-50"
                >
                  {isSubmitting ? "Zapisuję..." : "Zapisz zmiany"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: POTWIERDZENIE USUNIĘCIA */}
      {deletingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border-2 border-destructive bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)] space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <h3 className="font-heading text-xl uppercase tracking-tight text-foreground">
                  Usunąć trenera?
                </h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {deletingCoach.fullName} ({deletingCoach.email})
                </p>
              </div>
            </div>

            <p className="font-mono text-xs text-muted-foreground leading-relaxed">
              Konto trenera zostanie trwale usunięte z modułu autoryzacji oraz odpięte od wszystkich zespołów w klubie.
            </p>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingCoach(null)}
                className="h-10 w-1/2 rounded-xl border-2 border-foreground/20 bg-background font-heading text-xs uppercase hover:bg-muted"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="h-10 w-1/2 rounded-xl border-2 border-destructive bg-destructive font-heading text-xs font-bold uppercase text-destructive-foreground shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-50"
              >
                {isSubmitting ? "Usuwanie..." : "Tak, usuń"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}