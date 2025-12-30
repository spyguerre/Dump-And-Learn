"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import TextInput from "./textInput";

type WordItem = {
  id: number;
  native: string;
  foreign: string;
  description?: string;
  timestamp?: number;
  askIn: "native" | "foreign";
};

function levenshtein(a: string, b: string) {
  const A = removeAccents(a) || "";
  const B = removeAccents(b) || "";
  const m = A.length;
  const n = B.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function ReviewPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<WordItem[]>([]);
  const [nextCycle, setNextCycle] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0); // index inside queue
  const [answerValue, setAnswerValue] = useState("");
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [waitingTimeout, setWaitingTimeout] = useState<boolean>(false);
  const wrongRecordedRef = useRef<Set<number>>(new Set());

  const nativeInputRef = useRef<HTMLInputElement>(null);
  const foreignInputRef = useRef<HTMLInputElement>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // load settings from localStorage and fetch words
  useEffect(() => {
    const stored = localStorage.getItem("reviewSettings");
    let settings: any = null;
    try {
      settings = stored ? JSON.parse(stored) : null;
    } catch (e) {
      settings = null;
    }

    async function fetchWords() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wordCount: settings?.wordCount ?? 10,
            reviewMode: settings?.reviewMode ?? "both",
            priorityMode: settings?.priorityMode ?? "random",
            marginOfError: settings?.marginOfError ?? 1,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
        // initialize queue
        setQueue(data.words || []);
        setNextCycle([]);
        setCurrentIndex(0);
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
        setSettingsLoaded(true);
      }
    }

    fetchWords();
  }, []);

  // helper to post review attempt to server
  async function postReview(wordId: number, success: 0 | 1, askIn: "native" | "foreign") {
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId,
          success,
          isReviewedInForeign: askIn === "foreign" ? 1 : 0,
          hintUsed: 0,
          reviewTimestamp: Math.floor(Date.now()),
        }),
      });
    } catch (e) {
      console.error("Failed to save review:", e);
    }
  }

  // advance to next word or cycle
  function advanceToNext() {
    // if more in queue
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((c) => c + 1);
      setAnswerValue("");
      setFeedback(null);
      return;
    }

    // queue exhausted
    if (nextCycle.length > 0) {
      setQueue(nextCycle);
      setNextCycle([]);
      wrongRecordedRef.current = new Set();
      
      setCurrentIndex(0);
      setAnswerValue("");
      setFeedback(null);

      return;
    }

    // both empty -> go home
    router.push("/");
  }

  // handle submit/confirm button
  async function handleConfirm() {
    if (loading || !settingsLoaded) return;
    if (queue.length === 0) {
      router.push("/");
      return;
    }
    if (waitingTimeout) return;

    const current = queue[currentIndex];
    const askIn = current.askIn; // prompt language
    const expected = askIn === "native" ? current.foreign : current.native;
    const userAnswer = (answerValue || "").trim();

    // if showing feedback, pressing button moves on
    if (feedback) {
      setFeedback(null);
      // if it was wrong we should show the same word again (do not advance)
      if (feedback === "wrong") {
        // clear answer for re-attempt
        setAnswerValue("");
        return;
      }
      // if feedback was correct, advance
      advanceToNext();
      return;
    }

    // compute margin of error from settings
    const stored = localStorage.getItem("reviewSettings");
    let margin = 0;
    try {
      const parsed = stored ? JSON.parse(stored) : null;
      margin = parsed && parsed.marginOfError ? Number(parsed.marginOfError) || 0 : 0;
    } catch (e) {
      margin = 0;
    }

    const dist = levenshtein(userAnswer.toLowerCase(), (expected || "").toLowerCase());
    const isCorrect = dist <= margin;

    if (isCorrect) {
      // show green feedback; save correct attempt
      setFeedback("correct");
      // if no wrong attempt before, save attempt as correct in db
      if (!wrongRecordedRef.current.has(current.id)) {
          await postReview(current.id, 1, askIn);
      }
    } else {
      // wrong: record once per word until it's corrected
      setFeedback("wrong");
      // show correct answer in answer field for 1s or until user presses button
      setAnswerValue(expected);

      // record wrong attempt only once per word until corrected
      if (!wrongRecordedRef.current.has(current.id)) {
        wrongRecordedRef.current.add(current.id);
        await postReview(current.id, 0, askIn);
        // add to nextCycle
        setNextCycle((n) => [...n, current]);
      }

      // after 3s, restore answer to empty and allow retry
      setTimeout(() => {
        setAnswerValue("");
        setFeedback(null);
        setWaitingTimeout(false);
      }, 3000);
      setWaitingTimeout(true);
    }
  }

  if (loading) return <div className="p-8">Loading words...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (queue.length === 0) return <div className="p-8">No words to review.</div>;

  const current = queue[currentIndex];
  const prompt = current.askIn === "native" ? current.native : current.foreign;

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="w-full max-w-2xl p-8 shadow rounded">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Review Session</h1>
          <div className="text-sm opacity-80">{currentIndex + 1} / {queue.length} (next cycle: {nextCycle.length})</div>
        </div>

        <div ref={nativeInputRef}>
          <TextInput
            langType="native"
            askIn={current.askIn}
            value={current.askIn === "native" ? answerValue : prompt}
            feedback={feedback}
            onChange={setAnswerValue}
            onEnter={handleConfirm}
          />
        </div>

        <div ref={foreignInputRef}>
          <TextInput
            langType="foreign"
            askIn={current.askIn}
            value={current.askIn === "foreign" ? answerValue : prompt}
            feedback={feedback}
            onChange={setAnswerValue}
            onEnter={handleConfirm}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={handleConfirm} className="w-full px-4 py-2 rounded" disabled={waitingTimeout}>
            {feedback ? (feedback === "correct" ? "Next" : "Retry") : "Submit"}
          </button>
          <button onClick={() => router.push("/")} className="px-4 py-2 rounded border">Quit</button>
        </div>

        {feedback && current.description && <div className="mt-4 text-sm text-muted">{current.description}</div>}
      </main>
    </div>
  );
}
