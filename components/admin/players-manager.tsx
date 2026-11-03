"use client";

import { useState, useRef } from "react";
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Search, 
  Phone, 
  Mail, 
  X, 
  ShieldAlert,
  Camera,
  Upload,
  Loader2,
  Trash2,
  User,
  CheckCircle2
} from "lucide-react";
import { createPlayerAction, updatePlayerAvatarAction } from "@/app/actions/admin";
import { uploadImageAction } from "@/app/actions/upload";
import { CsvImporterModal } from "@/components/admin/csv-importer";
import { cn } from "@/lib/utils";

interface PlayerItem {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  birth_year: number;
  birth_date?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  email?: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email?: string | null;
  preferred_survey_recipient?: string | null;
  is_active: boolean;
  current_team_id: string | null;
  teams: { id: string; name: string } | null;
}

interface TeamChoice {
  id: string;
  name: string;
}

const MONTHS = [
  { value: "01", label: "Styczeń (01)" },
  { value: "02", label: "Luty (02)" },
  { value: "03", label: "Marzec (03)" },
  { value: "04", label: "Kwiecień (04)" },
  { value: "05", label: "Maj (05)" },
  { value: "06", label: "Czerwiec (06)" },
  { value: "07", label: "Lipiec (07)" },
  { value: "08", label: "Sierpień (08)" },
  { value: "09", label: "Wrzesień (09)" },
  { value: "10", label: "Październik (10)" },
  { value: "11", label: "Listopad (11)" },
  { value: "12", label: "Grudzień (12)" },
];

export function PlayersManager({
  initialPlayers,
  teams,
}: {
  initialPlayers: PlayerItem[];
  teams: TeamChoice[];
}) {
  const currentYear = new Date().getFullYear();
  const [players, setPlayers] = useState<PlayerItem[]>(initialPlayers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stany formularza tworzenia nowego zawodnika
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [birthYear, setBirthYear] = useState(String(currentYear - 15));
  const [birthMonth, setBirthMonth] = useState("01");
  const [birthDay, setBirthDay] = useState("");
  const [teamId, setTeamId] = useState<string>(teams[0]?.id || "");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const addModalFileRef = useRef<HTMLInputElement>(null);
  
  // Dane kontaktowe gracza
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  
  // Dane kontaktowe rodzica
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  // Stan modalu bezpośredniej edycji zdjęcia konkretnego zawodnika
  const [avatarModalPlayer, setAvatarModalPlayer] = useState<PlayerItem | null>(null);
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  const directFileInputRef = useRef<HTMLInputElement>(null);

  const numericBirthYear = parseInt(birthYear, 10) || currentYear;
  const isJunior = (currentYear - numericBirthYear) < 18;

  const filteredPlayers = players.filter((p) => {
    const matchesTeam =
      selectedTeamFilter === "all" || p.current_team_id === selectedTeamFilter;

    const fullSearch = `${p.first_name} ${p.last_name} ${p.jersey_number || ""} ${p.email || ""} ${p.parent_email || ""}`.toLowerCase();
    const matchesSearch = fullSearch.includes(searchQuery.toLowerCase());

    return matchesTeam && matchesSearch;
  });

  // Upload zdjęcia w formularzu ręcznego dodawania
  async function handleAddModalAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "avatars");
    formData.append("folder", "players");

    const res = await uploadImageAction(formData);
    if (res.success && res.url) {
      setAvatarUrl(res.url);
    } else {
      alert(res.error || "Nie udało się przesłać zdjęcia.");
    }
    setUploadingAvatar(false);
  }

  // Zapis ręcznie tworzonego gracza
  async function handleCreatePlayer(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!firstName.trim() || !lastName.trim()) return;

    setIsSubmitting(true);
    const parsedJersey = jerseyNumber.trim() ? parseInt(jerseyNumber, 10) : null;
    const parsedYear = parseInt(birthYear, 10) || currentYear;
    
    const dayFormatted = birthDay.trim() ? String(parseInt(birthDay, 10)).padStart(2, "0") : "01";
    const constructedBirthDate = `${parsedYear}-${birthMonth}-${dayFormatted}`;

    const res = await createPlayerAction({
      firstName,
      lastName,
      jerseyNumber: parsedJersey,
      birthYear: parsedYear,
      birthDate: constructedBirthDate,
      avatarUrl: avatarUrl.trim() || undefined,
      currentTeamId: teamId || null,
      phone: phone.trim() || undefined,
      email: email.trim().toLowerCase() || undefined,
      parentName: parentName.trim() || undefined,
      parentPhone: parentPhone.trim() || undefined,
      parentEmail: parentEmail.trim().toLowerCase() || undefined,
    });

    if (res.success && res.playerId) {
      const selectedTeam = teams.find((t) => t.id === teamId);
      setPlayers((prev) => [
        {
          id: res.playerId!,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          jersey_number: parsedJersey,
          birth_year: parsedYear,
          birth_date: constructedBirthDate,
          avatar_url: avatarUrl.trim() || null,
          phone: phone.trim() || null,
          email: email.trim().toLowerCase() || null,
          parent_name: parentName.trim() || null,
          parent_phone: parentPhone.trim() || null,
          parent_email: parentEmail.trim().toLowerCase() || null,
          preferred_survey_recipient: isJunior ? "parent" : "player",
          is_active: true,
          current_team_id: teamId || null,
          teams: selectedTeam ? { id: selectedTeam.id, name: selectedTeam.name } : null,
        },
        ...prev,
      ]);

      setFirstName("");
      setLastName("");
      setJerseyNumber("");
      setBirthDay("");
      setAvatarUrl("");
      setPhone("");
      setEmail("");
      setParentName("");
      setParentPhone("");
      setParentEmail("");
      setIsAddModalOpen(false);
    } else {
      setErrorMsg(res.error || "Wystąpił błąd podczas dodawania zawodnika.");
    }
    setIsSubmitting(false);
  }

  // Bezpośredni upload zdjęcia dla klikniętego zawodnika
  async function handleDirectAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !avatarModalPlayer) return;

    setIsDirectUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "avatars");
    formData.append("folder", "players");

    const uploadRes = await uploadImageAction(formData);

    if (uploadRes.success && uploadRes.url) {
      const saveRes = await updatePlayerAvatarAction(avatarModalPlayer.id, uploadRes.url);

      if (saveRes.success) {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === avatarModalPlayer.id ? { ...p, avatar_url: uploadRes.url } : p
          )
        );
        setAvatarModalPlayer((prev) =>
          prev ? { ...prev, avatar_url: uploadRes.url } : null
        );
      } else {
        alert(saveRes.error || "Nie udało się zapisać zdjęcia w bazie.");
      }
    } else {
      alert(uploadRes.error || "Błąd podczas wgrywania pliku.");
    }

    if (directFileInputRef.current) {
      directFileInputRef.current.value = "";
    }
    setIsDirectUploading(false);
  }

  // Usunięcie zdjęcia klikniętego zawodnika
  async function handleRemoveDirectAvatar() {
    if (!avatarModalPlayer || !avatarModalPlayer.avatar_url) return;
    if (!window.confirm(`Czy na pewno chcesz usunąć zdjęcie zawodnika ${avatarModalPlayer.first_name} ${avatarModalPlayer.last_name}?`)) {
      return;
    }

    setIsDirectUploading(true);
    const res = await updatePlayerAvatarAction(avatarModalPlayer.id, null);

    if (res.success) {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === avatarModalPlayer.id ? { ...p, avatar_url: null } : p
        )
      );
      setAvatarModalPlayer((prev) =>
        prev ? { ...prev, avatar_url: null } : null
      );
    } else {
      alert(res.error || "Błąd podczas usuwania zdjęcia.");
    }
    setIsDirectUploading(false);
  }

  function formatBirthDateDisplay(year: number, dateStr?: string | null) {
    if (!dateStr) return String(year);
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(year);
      const monthName = d.toLocaleString("pl-PL", { month: "long" });
      return `${year} (${monthName})`;
    } catch {
      return String(year);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* UKRYTE WEJŚCIE DLA BEZPOŚREDNIEGO UPLOADU ZDJĘCIA */}
      <input
        ref={directFileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleDirectAvatarUpload}
        className="hidden"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b-2 border-foreground/15 pb-6">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            Ewidencja Kadrowa Klubu
          </p>
          <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight sm:text-5xl">
            Kartoteka Graczy
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Baza zawodników, zdjęcia profilowe, numery na koszulkach oraz kontakty do opiekunów.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-foreground/20 bg-background px-4 text-xs font-heading uppercase tracking-wider font-bold transition hover:bg-muted active:scale-95 shadow-[2px_2px_0_0_var(--foreground)]"
          >
            <FileSpreadsheet className="size-4 text-primary" />
            <span>Importuj z CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-foreground bg-primary px-4 text-xs font-heading uppercase tracking-wider font-black text-primary-foreground transition active:scale-95 shadow-[3px_3px_0_0_var(--foreground)] shrink-0"
          >
            <UserPlus className="size-4 stroke-[3]" />
            <span>Dodaj gracza</span>
          </button>
        </div>
      </div>

      {/* FILTROWANIE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border-2 border-foreground/20 bg-card p-4 shadow-sm">
        <div className="sm:col-span-2 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Szukaj po nazwisku, imieniu, numerze lub e-mailu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border-2 border-foreground/15 bg-background pl-10 pr-3 font-mono text-xs outline-none focus:border-foreground"
          />
        </div>

        <div>
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="h-11 w-full rounded-xl border-2 border-foreground/15 bg-background px-3 font-mono text-xs outline-none focus:border-foreground"
          >
            <option value="all">Wszystkie drużyny ({players.length})</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABELA ZAWODNIKÓW */}
      <div className="rounded-2xl border-2 border-foreground/20 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b-2 border-foreground/15 bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4 w-16">Nr</th>
                <th className="p-4">Zawodnik (Kliknij, aby wgrać zdjęcie)</th>
                <th className="p-4">Urodzenie</th>
                <th className="p-4">Drużyna</th>
                <th className="p-4">Dane Kontaktowe</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground font-mono">
                    Brak zawodników spełniających kryteria.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => {
                  const playerIsJunior = (currentYear - player.birth_year) < 18;
                  return (
                    <tr key={player.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-4 font-bold text-primary font-heading text-base">
                        {player.jersey_number ? `#${player.jersey_number}` : "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Interaktywny awatar z dymkiem aparatu */}
                          <button
                            type="button"
                            onClick={() => setAvatarModalPlayer(player)}
                            className="group/avatar relative size-10 rounded-full border-2 border-foreground/20 bg-muted overflow-hidden flex items-center justify-center shrink-0 hover:border-primary transition-all shadow-xs cursor-pointer"
                            title="Kliknij, aby wgrać lub zmienić zdjęcie"
                          >
                            {player.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={player.avatar_url}
                                alt={`${player.first_name} ${player.last_name}`}
                                className="size-full object-cover group-hover/avatar:opacity-60 transition-opacity"
                              />
                            ) : (
                              <span className="font-heading text-xs font-bold text-muted-foreground group-hover/avatar:hidden">
                                {player.first_name[0]}{player.last_name[0]}
                              </span>
                            )}
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                              <Camera className="size-4 text-primary" />
                            </div>
                          </button>

                          {/* Klikalne nazwisko otwierające edycję zdjęcia */}
                          <div>
                            <button
                              type="button"
                              onClick={() => setAvatarModalPlayer(player)}
                              className="font-heading text-base uppercase text-foreground hover:text-primary transition-colors text-left block leading-tight hover:underline underline-offset-2 cursor-pointer"
                            >
                              {player.last_name} {player.first_name}
                            </button>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {playerIsJunior ? "Junior" : "Senior"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-muted-foreground">
                        {formatBirthDateDisplay(player.birth_year, player.birth_date)}
                      </td>
                      <td className="p-4">
                        {player.teams?.name ? (
                          <span className="inline-block rounded-md border border-foreground/15 bg-background px-2.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
                            {player.teams.name}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground italic">
                            Brak przydziału
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {playerIsJunior ? (
                          <div className="space-y-1">
                            {player.parent_name && (
                              <span className="block font-semibold text-foreground text-[11px]">
                                Opiekun: {player.parent_name}
                              </span>
                            )}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              {player.parent_phone && (
                                <a
                                  href={`tel:${player.parent_phone}`}
                                  className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold"
                                >
                                  <Phone className="size-3" />
                                  <span>{player.parent_phone}</span>
                                </a>
                              )}
                              {player.parent_email && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Mail className="size-3" />
                                  <span>{player.parent_email}</span>
                                </span>
                              )}
                            </div>
                            {(player.phone || player.email) && (
                              <div className="text-[10px] text-muted-foreground border-t border-border/50 pt-0.5 mt-0.5">
                                Kontakt gracza: {player.phone || ""} {player.email ? `(${player.email})` : ""}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              {player.phone ? (
                                <a
                                  href={`tel:${player.phone}`}
                                  className="inline-flex items-center gap-1.5 text-foreground hover:underline font-bold"
                                >
                                  <Phone className="size-3 text-primary" />
                                  <span>{player.phone}</span>
                                </a>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                              {player.email && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Mail className="size-3 text-muted-foreground" />
                                  <span>{player.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {player.is_active ? (
                          <span className="inline-block rounded bg-primary/10 border border-primary/30 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                            Aktywny
                          </span>
                        ) : (
                          <span className="inline-block rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            Nieaktywny
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BEZPOŚREDNIEJ EDYCJI ZDJĘCIA GRACZA (PO KLIKNIĘCIU NA GRACZA) */}
      {avatarModalPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)] space-y-5 text-center">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-mono text-xs font-bold uppercase text-primary">Zdjęcie zawodnika</span>
              <button 
                type="button" 
                onClick={() => setAvatarModalPlayer(null)} 
                className="rounded-full border p-1 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Podgląd awatara */}
            <div className="space-y-3">
              <div 
                onClick={() => !isDirectUploading && directFileInputRef.current?.click()}
                className="group relative size-28 mx-auto rounded-full border-4 border-dashed border-foreground/30 bg-muted flex items-center justify-center cursor-pointer hover:border-foreground overflow-hidden transition shadow-sm"
                title="Kliknij, aby wybrać plik"
              >
                {avatarModalPlayer.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarModalPlayer.avatar_url}
                    alt="Awatar"
                    className="size-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="size-8 stroke-[1.5]" />
                    <span className="font-mono text-[9px] uppercase font-bold mt-1">Wybierz</span>
                  </div>
                )}

                {isDirectUploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="size-7 text-primary animate-spin" />
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-heading text-xl uppercase tracking-tight">
                  {avatarModalPlayer.last_name} {avatarModalPlayer.first_name}
                </h4>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  {avatarModalPlayer.jersey_number ? `#${avatarModalPlayer.jersey_number} · ` : ""}
                  {avatarModalPlayer.teams?.name || "Brak drużyny"}
                </p>
              </div>
            </div>

            {/* Przyciski akcji */}
            <div className="pt-2 border-t border-border space-y-2">
              <button
                type="button"
                disabled={isDirectUploading}
                onClick={() => directFileInputRef.current?.click()}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-bold uppercase text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] active:scale-95 transition disabled:opacity-50"
              >
                {isDirectUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Zapisywanie...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    <span>{avatarModalPlayer.avatar_url ? "Zmień zdjęcie" : "Wgraj zdjęcie"}</span>
                  </>
                )}
              </button>

              {avatarModalPlayer.avatar_url && (
                <button
                  type="button"
                  disabled={isDirectUploading}
                  onClick={handleRemoveDirectAvatar}
                  className="w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive font-heading text-xs uppercase font-bold hover:bg-destructive/20 active:scale-95 transition disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  <span>Usuń bieżące zdjęcie</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setAvatarModalPlayer(null)}
                className="w-full h-10 rounded-xl border border-foreground/20 font-heading text-xs uppercase hover:bg-muted transition"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TWORZENIA NOWEGO ZAWODNIKA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)] space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-heading text-2xl uppercase tracking-tight">Nowy Zawodnik</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-full border p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-mono text-destructive flex items-center gap-2">
                <ShieldAlert className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreatePlayer} className="space-y-4">
              {/* Wgrywanie zdjęcia przy ręcznym tworzeniu */}
              <div className="flex items-center gap-4 rounded-xl border border-foreground/15 bg-background p-3">
                <div 
                  onClick={() => addModalFileRef.current?.click()}
                  className="relative size-16 rounded-full border-2 border-dashed border-foreground/30 bg-muted/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-foreground shrink-0 transition"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Awatar" className="size-full object-cover" />
                  ) : (
                    <User className="size-7 text-muted-foreground" />
                  )}

                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="size-5 text-primary animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    ref={addModalFileRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleAddModalAvatarUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => addModalFileRef.current?.click()}
                      className="h-8 px-2.5 rounded-lg border border-foreground/20 bg-card font-heading text-xs uppercase font-bold hover:bg-muted transition"
                    >
                      {avatarUrl ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="h-8 px-2 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Opcjonalne zdjęcie profilowe do kartoteki.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">Imię</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">Nazwisko</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">Rocznik</label>
                  <input
                    type="number"
                    required
                    min={1980}
                    max={currentYear}
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background px-2.5 font-mono text-sm outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">Miesiąc</label>
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background px-2 font-mono text-xs outline-none focus:border-foreground"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">Dzień (opcjonalnie)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="1-31"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background px-2.5 font-mono text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">Nr na koszulce</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    placeholder="np. 10"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">Drużyna docelowa</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                  >
                    <option value="">-- Bez przypisania --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isJunior ? (
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
                  <span className="font-mono text-xs font-bold uppercase text-primary block">
                    Dane kontaktowe opiekuna (Zawodnik niepełnoletni)
                  </span>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">Imię i nazwisko rodzica</label>
                    <input
                      type="text"
                      required
                      placeholder="np. Piotr Kowalski"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="h-9 w-full rounded-lg border border-foreground/20 bg-card px-2.5 font-mono text-xs outline-none focus:border-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">Telefon do rodzica</label>
                      <input
                        type="tel"
                        required
                        placeholder="500-100-200"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="h-9 w-full rounded-lg border border-foreground/20 bg-card px-2.5 font-mono text-xs outline-none focus:border-foreground"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">E-mail rodzica</label>
                      <input
                        type="email"
                        required
                        placeholder="rodzic@poczta.pl"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className="h-9 w-full rounded-lg border border-foreground/20 bg-card px-2.5 font-mono text-xs outline-none focus:border-foreground"
                      />
                    </div>
                  </div>

                  <div className="border-t border-primary/20 pt-2.5 space-y-2">
                    <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground block">
                      Dane bezpośrednie juniora (opcjonalnie):
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        placeholder="Telefon gracza (opcjonalnie)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-8 w-full rounded-lg border border-foreground/20 bg-card px-2 font-mono text-[11px] outline-none focus:border-foreground"
                      />
                      <input
                        type="email"
                        placeholder="E-mail gracza (opcjonalnie)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-8 w-full rounded-lg border border-foreground/20 bg-card px-2 font-mono text-[11px] outline-none focus:border-foreground"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-foreground/15 bg-muted/20 p-4 space-y-3">
                  <span className="font-mono text-xs font-bold uppercase text-foreground block">
                    Bezpośredni kontakt do zawodnika (Senior &ge; 18 lat)
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">Telefon zawodnika</label>
                      <input
                        type="tel"
                        required
                        placeholder="600-700-800"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-9 w-full rounded-lg border border-foreground/20 bg-card px-2.5 font-mono text-xs outline-none focus:border-foreground"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">E-mail zawodnika</label>
                      <input
                        type="email"
                        required
                        placeholder="zawodnik@forma.pl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-9 w-full rounded-lg border border-foreground/20 bg-card px-2.5 font-mono text-xs outline-none focus:border-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground/20 bg-background font-heading text-xs uppercase hover:bg-muted"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-bold uppercase text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-50"
                >
                  {isSubmitting ? "Zapisuję..." : "Zapisz gracza"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CSV */}
      {isCsvModalOpen && (
        <CsvImporterModal
          teams={teams}
          onClose={() => setIsCsvModalOpen(false)}
          onSuccess={() => {
            setIsCsvModalOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}