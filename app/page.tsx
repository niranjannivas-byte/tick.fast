"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
  type SetStateAction
} from "react";

const MAX_HOURS = 99;
const MAX_MINUTES = 59;
const MAX_SECONDS = 59;
type FieldKey = "hours" | "minutes" | "seconds";

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, "0")).join(":");
}

export default function Home() {
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const secondsInputRef = useRef<HTMLInputElement>(null);
  const entryProgressRef = useRef<Record<FieldKey, number>>({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [hoursInput, setHoursInput] = useState("00");
  const [minutesInput, setMinutesInput] = useState("00");
  const [secondsInput, setSecondsInput] = useState("00");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasSetValue, setHasSetValue] = useState(false);

  const setTotalSeconds = useMemo(() => {
    const hours = clampNumber(Number.parseInt(hoursInput || "0", 10), 0, MAX_HOURS);
    const minutes = clampNumber(Number.parseInt(minutesInput || "0", 10), 0, MAX_MINUTES);
    const seconds = clampNumber(Number.parseInt(secondsInput || "0", 10), 0, MAX_SECONDS);

    return hours * 3600 + minutes * 60 + seconds;
  }, [hoursInput, minutesInput, secondsInput]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setIsRunning(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  const setTimer = () => {
    setRemainingSeconds(setTotalSeconds);
    setHasSetValue(setTotalSeconds > 0);
    setIsRunning(false);
    setHoursInput("00");
    setMinutesInput("00");
    setSecondsInput("00");
  };

  const handleTimeInputKeyDown =
    (
      field: FieldKey,
      value: string,
      setter: Dispatch<SetStateAction<string>>,
      nextRef?: RefObject<HTMLInputElement | null>
    ) =>
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        setter((current) => current.padStart(2, "0").slice(-2));
        entryProgressRef.current[field] = 0;
        nextRef?.current?.focus();
        return;
      }

      if (event.key >= "0" && event.key <= "9") {
        event.preventDefault();
        const digitsEntered = entryProgressRef.current[field];
        const isFirstDigit = digitsEntered === 0;
        const next = isFirstDigit ? `0${event.key}` : `${value[1]}${event.key}`;
        setter(next);
        entryProgressRef.current[field] = isFirstDigit ? 1 : 0;
        if (nextRef && !isFirstDigit) {
          nextRef.current?.focus();
        }
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        setter(`0${value[0]}`.slice(-2));
        entryProgressRef.current[field] = 0;
      }
    };

  const handleTimeInputMouseDown = (event: MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.currentTarget.focus();
  };

  const handleTimeInputFocus =
    (field: FieldKey) => () => {
      entryProgressRef.current[field] = 0;
    };

  const startTimer = () => {
    if (remainingSeconds <= 0) {
      return;
    }

    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setHasSetValue(false);
    setRemainingSeconds(0);
  };

  const isSetDisabled = setTotalSeconds <= 0;
  const isStartDisabled = isRunning || remainingSeconds <= 0;
  const isPauseDisabled = !isRunning;
  const isResetDisabled = remainingSeconds === 0 && !hasSetValue && !isRunning;

  return (
    <main className="page">
      <section className="timer-card" aria-label="Timer">
        <h1 className="title">tick.fast</h1>
        <p className="timer-display" aria-live="polite">
          {formatTime(remainingSeconds)}
        </p>

        <div className="set-grid">
          <label className="field">
            <span>Hours</span>
            <input
              ref={hoursInputRef}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={hoursInput}
              onMouseDown={handleTimeInputMouseDown}
              onFocus={handleTimeInputFocus("hours")}
              onKeyDown={handleTimeInputKeyDown("hours", hoursInput, setHoursInput, minutesInputRef)}
              aria-label="Set hours"
            />
          </label>
          <label className="field">
            <span>Minutes</span>
            <input
              ref={minutesInputRef}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={minutesInput}
              onMouseDown={handleTimeInputMouseDown}
              onFocus={handleTimeInputFocus("minutes")}
              onKeyDown={handleTimeInputKeyDown("minutes", minutesInput, setMinutesInput, secondsInputRef)}
              aria-label="Set minutes"
            />
          </label>
          <label className="field">
            <span>Seconds</span>
            <input
              ref={secondsInputRef}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={secondsInput}
              onMouseDown={handleTimeInputMouseDown}
              onFocus={handleTimeInputFocus("seconds")}
              onKeyDown={handleTimeInputKeyDown("seconds", secondsInput, setSecondsInput)}
              aria-label="Set seconds"
            />
          </label>
        </div>

        <div className="actions">
          <button type="button" onClick={setTimer} disabled={isSetDisabled}>
            Set
          </button>
          <button type="button" onClick={startTimer} disabled={isStartDisabled}>
            Start
          </button>
          <button type="button" onClick={pauseTimer} disabled={isPauseDisabled}>
            Pause
          </button>
          <button type="button" onClick={resetTimer} disabled={isResetDisabled}>
            Reset
          </button>
        </div>
      </section>
    </main>
  );
}
