"use client";

import { useState } from "react";
import { Edit2, MapPin, Plus, Trash2, X } from "lucide-react";
import {
  createClubFieldAction,
  deleteClubFieldAction,
  updateClubFieldAction,
} from "@/app/actions/admin";
import { DeleteConfirmation } from "@/components/admin/delete-confirmation";

interface ClubField {
  id: string;
  name: string;
  is_active: boolean;
}

export function FieldsManager({ initialFields }: { initialFields: ClubField[] }) {
  const [fields, setFields] = useState(initialFields);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingField, setEditingField] = useState<ClubField | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [deletingField, setDeletingField] = useState<ClubField | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function openEdit(field: ClubField) {
    setEditingField(field);
    setEditName(field.name);
    setEditIsActive(field.is_active);
    setActionError(null);
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingField || !editName.trim() || submitting) return;

    setSubmitting(true);
    setActionError(null);
    const result = await updateClubFieldAction(editingField.id, {
      name: editName,
      isActive: editIsActive,
    });
    if (result.success) {
      setFields((current) =>
        current
          .map((field) =>
            field.id === editingField.id
              ? { ...field, name: editName.trim(), is_active: editIsActive }
              : field
          )
          .sort((a, b) => a.name.localeCompare(b.name, "pl"))
      );
      setEditingField(null);
    } else {
      setActionError(result.error || "Nie udało się zaktualizować boiska.");
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deletingField || submitting) return;

    setSubmitting(true);
    setActionError(null);
    try {
      const result = await deleteClubFieldAction(deletingField.id);
      if (result.success) {
        setFields((current) =>
          current.map((field) =>
            field.id === deletingField.id ? { ...field, is_active: false } : field
          )
        );
        setDeletingField(null);
      } else {
        setActionError(result.error || "Nie udało się usunąć boiska.");
      }
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Nie udało się usunąć boiska."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      const result = await createClubFieldAction(name);
      const createdField = result.success ? result.field : null;
      if (createdField) {
        setFields((current) =>
          [...current, createdField].sort((a, b) => a.name.localeCompare(b.name, "pl"))
        );
        setName("");
      } else {
        alert(result.error || "Nie udało się dodać boiska.");
      }
    } catch (error: unknown) {
      alert(
        error instanceof Error ? error.message : "Nie udało się połączyć z serwerem podczas dodawania boiska."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="border-b-2 border-foreground/15 pb-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
          Infrastruktura klubu
        </p>
        <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight sm:text-5xl">
          Boiska i obiekty
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Dodane obiekty będą dostępne trenerom podczas planowania treningów.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border-2 border-foreground/20 bg-card p-4 shadow-sm sm:flex-row"
      >
        <label className="sr-only" htmlFor="club-field-name">Nazwa boiska lub obiektu</label>
        <input
          id="club-field-name"
          type="text"
          maxLength={100}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="np. Boisko główne"
          className="h-11 min-w-0 flex-1 rounded-xl border-2 border-foreground/20 bg-background px-3 text-sm outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-primary px-4 text-xs font-heading font-black tracking-wider text-primary-foreground uppercase shadow-[3px_3px_0_0_var(--foreground)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="size-4 stroke-3" />
          {submitting ? "Dodaję..." : "Dodaj boisko"}
        </button>
      </form>
      <section className="space-y-3">
        <h2 className="px-1 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Boiska w klubie ({fields.length})
        </h2>
        {fields.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <li
                key={field.id}
                className="flex items-center gap-3 rounded-2xl border-2 border-foreground/15 bg-card p-4"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-lg font-bold uppercase">{field.name}</span>
                  <span className="font-mono text-[10px] font-bold uppercase text-primary">
                    {field.is_active ? "Dostępne dla trenerów" : "Nieaktywne"}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(field)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-foreground/20 bg-background text-foreground transition hover:border-primary hover:text-primary"
                    title="Edytuj boisko"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  {field.is_active && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingField(field);
                        setActionError(null);
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive transition hover:bg-destructive/15"
                      title="Dezaktywuj boisko"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-foreground/20 p-6 text-center text-sm text-muted-foreground">
            Nie dodano jeszcze żadnego boiska. Dodaj obiekt, aby trenerzy mogli wybrać go przy tworzeniu treningu.
          </p>
        )}
      </section>

      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-md space-y-4 rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)]"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-heading text-2xl uppercase">Edytuj boisko</h2>
              <button type="button" onClick={() => setEditingField(null)} className="rounded-full border p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            {actionError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
                {actionError}
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="font-mono text-xs font-bold uppercase text-muted-foreground">Nazwa</span>
              <input
                type="text"
                required
                maxLength={100}
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 text-sm outline-none focus:border-foreground"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-foreground/15 p-3">
              <span className="font-mono text-xs font-bold uppercase">Aktywne boisko</span>
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(event) => setEditIsActive(event.target.checked)}
                className="size-4 accent-primary"
              />
            </label>

            <div className="flex gap-2 border-t pt-4">
              <button type="button" onClick={() => setEditingField(null)} className="h-11 flex-1 rounded-xl border-2 border-foreground/20 font-heading text-xs font-bold uppercase">
                Anuluj
              </button>
              <button type="submit" disabled={submitting || !editName.trim()} className="h-11 flex-1 rounded-xl border-2 border-foreground bg-primary text-primary-foreground font-heading text-xs font-bold uppercase disabled:opacity-50">
                {submitting ? "Zapisywanie..." : "Zapisz"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deletingField && (
        <DeleteConfirmation
          title="Usuń boisko"
          description={(
            <p>
              Boisko <strong className="text-foreground">{deletingField.name}</strong> zostanie zdezaktywowane i nie będzie dostępne trenerom. Historia treningów zostanie zachowana.
            </p>
          )}
          error={actionError}
          isProcessing={submitting}
          onCancel={() => setDeletingField(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
