"use client"


type TextInputProps = {
  langType: "native" | "foreign";
  askIn: "native" | "foreign";
  value: string;
  feedback: "correct" | "wrong" | null;
  onChange?: (value: string) => void;
  onEnter?: () => void;
};

export default function TextInput({
  langType,
  askIn,
  value,
  feedback,
  onChange,
  onEnter,
}: TextInputProps) {
  if (langType === askIn) {
    return (
      <div className="mb-3">
        <label className="block font-medium mb-1">Your answer</label>
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter?.(); } }}
          placeholder={`Enter your answer in ${askIn === "native" ? "native" : "foreign"} language`}
          readOnly={feedback !== null}
          className={`w-full px-3 py-2 border rounded ${feedback === "correct" ? "correct-answer" : feedback === "wrong" ? "wrong-answer" : ""}`}
        />
      </div>
      );
  } else {
    return (
      <div className="mb-3">
        <label className="block font-medium mb-1">Prompt</label>
        <input
          readOnly
          value={value}
          className={`w-full px-3 py-2 border rounded ${feedback === "correct" ? "correct-answer" : feedback === "wrong" ? "wrong-answer" : ""}`}
        />
      </div>
    );
  }
}
