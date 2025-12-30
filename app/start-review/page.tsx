"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ReviewSettings = {
  wordCount: string;
  reviewMode: "native" | "foreign" | "both";
  priorityMode: "random" | "lessReviewed" | "oftenFailed" | "recent";
  marginOfError: string;
};

const STORAGE_KEY = "reviewSettings";

const DEFAULT_SETTINGS: ReviewSettings = {
  wordCount: "10",
  reviewMode: "foreign",
  priorityMode: "random",
  marginOfError: "1",
};

export default function StartReview() {
  const router = useRouter();
  
  const [settings, setSettings] = useState<ReviewSettings>(DEFAULT_SETTINGS);
  const [customWordCount, setCustomWordCount] = useState("");
  const [customMargin, setCustomMargin] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ReviewSettings;
        setSettings(parsed);
        // initialize temp inputs when stored values are custom/non-preset
        const presets = ["5", "10", "15", "20", "30", "42"];
        if (!presets.includes(parsed.wordCount)) setCustomWordCount(parsed.wordCount);
        const margins = ["0", "1", "2", "3"];
        if (!margins.includes(parsed.marginOfError)) setCustomMargin(parsed.marginOfError);
      } catch (e) {
        console.error("Failed to parse stored settings:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever settings change
  const updateSettings = (newSettings: Partial<ReviewSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  if (!isLoaded) return null; // Prevent hydration mismatch

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="w-full max-w-2xl p-8 shadow rounded">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">Review Settings</h1>
          <Link href="/" className="text-sm underline hover:opacity-80">
            Back to Add
          </Link>
        </div>

        {/* Number of words */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Number of Words</label>
          <div className="flex flex-wrap gap-2">
            {["5", "10", "15", "20", "30", "42"].map((count) => (
              <button
                key={count}
                onClick={() => updateSettings({ wordCount: count })}
                className={`px-4 py-2 rounded border transition ${
                  settings.wordCount === count
                    ? "" : "secondary"
                }`}
              >
                {count}
              </button>
            ))}
            <input
              type="number"
              min="1"
              max="1000"
              placeholder="Custom"
              value={customWordCount}
              onChange={(e) => setCustomWordCount(e.target.value)}
              onFocus={(e) => {
                const presets = ["5", "10", "15", "20", "30", "42"];
                if (!presets.includes(settings.wordCount)) {
                  setCustomWordCount(settings.wordCount);
                } else {
                  setCustomWordCount("");
                }
              }}
              onBlur={() => {
                if (customWordCount && customWordCount.trim() !== "") {
                  updateSettings({ wordCount: customWordCount.trim() });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (customWordCount && customWordCount.trim() !== "") {
                    updateSettings({ wordCount: customWordCount.trim() });
                  }
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="px-3 py-2 border rounded w-24"
            />
          </div>
        </div>

        {/* Review Mode */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Review Mode</label>
          <div className="flex flex-wrap gap-2">
            {["native", "foreign", "both"].map((mode) => (
              <button
                key={mode}
                onClick={() =>
                  updateSettings({
                    reviewMode: mode as
                      | "native"
                      | "foreign"
                      | "both",
                  })
                }
                className={`px-4 py-2 rounded border transition capitalize ${
                  settings.reviewMode === mode
                    ? "" : "secondary"
                }`}
              >
                {mode === "both" ? "Both (Random)" : mode}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Mode */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Priority</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "random", label: "Random" },
              { key: "lessReviewed", label: "Less Reviewed" },
              { key: "oftenFailed", label: "Often Failed" },
              { key: "recent", label: "Recent" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() =>
                  updateSettings({
                    priorityMode: key as
                      | "random"
                      | "lessReviewed"
                      | "oftenFailed"
                      | "recent",
                  })
                }
                className={`px-4 py-2 rounded border transition ${
                  settings.priorityMode === key
                    ? "" : "secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Margin of Error */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Margin of Error</label>
          <div className="flex flex-wrap gap-2">
            {["0", "1", "2", "3"].map((margin) => (
              <button
                key={margin}
                onClick={() => updateSettings({ marginOfError: margin })}
                className={`px-4 py-2 rounded border transition ${
                  settings.marginOfError === margin
                    ? "" : "secondary"
                }`}
              >
                {margin}
              </button>
            ))}
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Custom"
              value={customMargin}
              onChange={(e) => setCustomMargin(e.target.value)}
              onFocus={(e) => {
                const margins = ["0", "1", "2", "3"];
                if (!margins.includes(settings.marginOfError)) {
                  setCustomMargin(settings.marginOfError);
                } else {
                  setCustomMargin("");
                }
              }}
              onBlur={() => {
                if (customMargin && customMargin.trim() !== "") {
                  updateSettings({ marginOfError: customMargin.trim() });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (customMargin && customMargin.trim() !== "") {
                    updateSettings({ marginOfError: customMargin.trim() });
                  }
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="px-3 py-2 border rounded w-24"
            />
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-6">
          <button
            onClick={ () => {setLoading(true); router.push("/review")} }
            className="w-full px-6 py-3 rounded font-medium bg-blue-600 text-white"
            disabled={loading}
          >
            {loading ? "Loading..." : "Start Review"}
          </button>
        </div>
      </main>
    </div>
  );
}
