import { NextResponse } from "next/server";

type RequestBody = {
  wordCount?: number | string;
  reviewMode?: "native" | "foreign" | "both";
  priorityMode?: string;
  marginOfError?: number | string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    const reviewMode = (body.reviewMode || "foreign") as "native" | "foreign" | "both";
    const priority = (body.priorityMode || "random").toString();

    // TODO: For now only random priority is supported
    if (priority !== "random") {
      return NextResponse.json(
        { error: `Priority mode '${priority}' not implemented yet` },
        { status: 400 }
      );
    }

    // Determine count
    let count = 10;
    if (body.wordCount !== undefined) {
      const v = typeof body.wordCount === "string" ? body.wordCount.trim() : String(body.wordCount);
      const n = Number(v);
      if (!Number.isNaN(n) && n > 0) count = Math.max(1, Math.floor(n));
    }

    const dbPath = process.cwd() + "/dalData.db";
    const mod = await import("better-sqlite3");
    const Database = (mod && (mod.default || mod)) as any;
    const db = new Database(dbPath, { readonly: true });

    // Select random words up to the requested count
    const stmt = db.prepare(
      `SELECT id, native, "foreign" as foreign_word, description, timestamp FROM words ORDER BY RANDOM() LIMIT ?`
    );
    const rows = stmt.all(count);

    const words = rows.map((r: any) => {
      let askIn: "native" | "foreign";
      if (reviewMode === "both") {
        askIn = Math.random() < 0.5 ? "native" : "foreign";
      } else {
        askIn = reviewMode;
      }
      return {
        id: r.id,
        native: r.native,
        foreign: r.foreign_word,
        description: r.description,
        timestamp: r.timestamp,
        askIn,
      };
    });

    db.close();

    return NextResponse.json({ words });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
