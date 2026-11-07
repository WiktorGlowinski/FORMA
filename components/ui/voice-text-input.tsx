"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike> & { length: number };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

const subscribeToSpeechSupport = () => () => {};
const getSpeechSupport = () => {
  if (typeof window === "undefined") return false;
  const speechWindow = window as SpeechRecognitionWindow;
  return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
};
const getServerSpeechSupport = () => false;

interface VoiceTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  multiline?: boolean;
  disabled?: boolean;
  rows?: number;
  ariaLabel: string;
  id?: string;
}

function appendTranscript(current: string, transcript: string) {
  const cleanTranscript = transcript.trim();
  if (!cleanTranscript) return current;
  if (!current.trim()) return cleanTranscript;
  return `${current.trimEnd()} ${cleanTranscript}`;
}

function capitalizeUtterance(transcript: string) {
  const cleanTranscript = transcript.trim();
  const firstCharacter = Array.from(cleanTranscript)[0];
  if (!firstCharacter) return "";
  return firstCharacter.toLocaleUpperCase("pl-PL") + cleanTranscript.slice(firstCharacter.length);
}

export function VoiceTextInput({
  value,
  onChange,
  placeholder,
  className,
  multiline = false,
  disabled = false,
  rows = 3,
  ariaLabel,
  id,
}: VoiceTextInputProps) {
  const isSupported = useSyncExternalStore(
    subscribeToSpeechSupport,
    getSpeechSupport,
    getServerSpeechSupport
  );
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const valueRef = useRef(value);
  const finalizedResultsRef = useRef<Set<number>>(new Set());
  const receivedSpeechRef = useRef(false);
  const recognitionErrorRef = useRef(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechError("Dyktowanie nie jest dostępne w tej przeglądarce.");
      return;
    }

    setSpeechError(null);
    setInterimTranscript("");
    finalizedResultsRef.current = new Set();
    receivedSpeechRef.current = false;
    recognitionErrorRef.current = false;
    const recognition = new Recognition();
    recognition.lang = "pl-PL";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      let nextValue = valueRef.current;
      let interim = "";
      const startIndex = Number.isInteger(event.resultIndex)
        ? Math.max(0, event.resultIndex)
        : 0;

      for (let index = startIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript?.trim();
        if (!transcript) continue;

        receivedSpeechRef.current = true;
        if (result.isFinal !== false) {
          if (finalizedResultsRef.current.has(index)) continue;
          finalizedResultsRef.current.add(index);
          nextValue = appendTranscript(nextValue, capitalizeUtterance(transcript));
        } else {
          interim = appendTranscript(interim, capitalizeUtterance(transcript));
        }
      }

      if (nextValue !== valueRef.current) {
        valueRef.current = nextValue;
        onChange(nextValue);
      }
      setInterimTranscript(interim);
    };
    recognition.onerror = (event) => {
      recognitionErrorRef.current = true;
      const errorMessages: Record<string, string> = {
        "not-allowed": "Brak dostępu do mikrofonu. Zezwól tej stronie na używanie mikrofonu.",
        "service-not-allowed": "Przeglądarka zablokowała usługę rozpoznawania mowy.",
        "audio-capture": "Przeglądarka nie może odczytać dźwięku z mikrofonu. Sprawdź, czy nie używa go inna aplikacja.",
        "no-speech": "Usługa nie wykryła mowy. Sprawdź wybrane urządzenie wejściowe i spróbuj mówić bliżej mikrofonu.",
        network: "Usługa rozpoznawania mowy jest niedostępna. Sprawdź połączenie z internetem i spróbuj ponownie.",
        "language-not-supported": "Usługa rozpoznawania mowy nie obsługuje języka polskiego w tej przeglądarce.",
        aborted: "Rozpoznawanie mowy zostało przerwane. Spróbuj ponownie.",
      };
      const message = errorMessages[event.error] ||
        `Rozpoznawanie mowy nie powiodło się (${event.error}). Spróbuj ponownie.`;
      setSpeechError(message);
      setIsRecording(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsRecording(false);
      setInterimTranscript("");
      if (!receivedSpeechRef.current && !recognitionErrorRef.current) {
        setSpeechError("Nie rozpoznano mowy. Spróbuj powiedzieć tekst jeszcze raz.");
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsRecording(false);
      setSpeechError("Nie udało się uruchomić mikrofonu.");
    }
  }

  function handleTextChange(nextValue: string) {
    valueRef.current = nextValue;
    onChange(nextValue);
  }

  const inputClassName = cn(
    "w-full rounded-xl border-2 border-foreground/20 bg-background text-xs outline-none focus:border-foreground disabled:opacity-50",
    multiline ? "min-h-20 resize-y p-2.5 pr-12" : "h-11 px-3 pr-12",
    className
  );

  return (
    <div>
      <div className="relative">
        {multiline ? (
          <textarea
            rows={rows}
            id={id}
            value={value}
            onChange={(event) => handleTextChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={ariaLabel}
            className={inputClassName}
          />
        ) : (
          <input
            type="text"
            id={id}
            value={value}
            onChange={(event) => handleTextChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={ariaLabel}
            className={inputClassName}
          />
        )}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={disabled || !isSupported}
          aria-label={isRecording ? "Zatrzymaj dyktowanie" : "Dyktuj tekst"}
          aria-pressed={isRecording}
          title={!isSupported ? "Dyktowanie niedostępne w tej przeglądarce" : undefined}
          className={cn(
            "absolute right-2 inline-flex size-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40",
            multiline ? "bottom-2" : "top-1/2 -translate-y-1/2",
            isRecording
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-foreground/15 bg-card text-muted-foreground hover:border-primary hover:text-primary"
          )}
        >
          {isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        </button>
      </div>
      {speechError && (
        <p role="status" className="mt-1 text-[11px] text-destructive">
          {speechError}
        </p>
      )}
      {interimTranscript && (
        <p aria-live="polite" className="mt-1 text-[11px] text-muted-foreground">
          Rozpoznawanie: {interimTranscript}
        </p>
      )}
      {!isSupported && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Dyktowanie wymaga przeglądarki obsługującej rozpoznawanie mowy.
        </p>
      )}
    </div>
  );
}
