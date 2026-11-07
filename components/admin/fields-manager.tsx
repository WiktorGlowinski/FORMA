"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { createClubFieldAction } from "@/app/actions/admin";

interface ClubField {
  id: string;
  name: string;
  is_active: boolean;
}

export function FieldsManager({ initialFields }: { initialFields: ClubField[] }) {
  const [fields, setFields] = useState(initialFields);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
                <span className="min-w-0">
                  <span className="block truncate font-heading text-lg font-bold uppercase">{field.name}</span>
                  <span className="font-mono text-[10px] font-bold uppercase text-primary">
                    {field.is_active ? "Dostępne dla trenerów" : "Nieaktywne"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-foreground/20 p-6 text-center text-sm text-muted-foreground">
            Nie dodano jeszcze żadnego boiska. Dodaj obiekt, aby trenerzy mogli wybrać go przy tworzeniu treningu.
          </p>
        )}
      </section>
    </div>
  );
}
