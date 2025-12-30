import { NextResponse } from "next/server";

type Body = {
  wordId: number;
  success: 0 | 1;
  isReviewedInForeign: 0 | 1;
  hintUsed?: 0 | 1;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body || typeof body.wordId !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const dbPath = process.cwd() + "/dalData.db";
    const mod = await import("better-sqlite3");
    const Database = (mod && (mod.default || mod)) as any;
    const db = new Database(dbPath);

    db.exec(
      `CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wordid INTEGER,
        reviewTimestamp INTEGER,
        success INTEGER,
        hintUsed INTEGER,
        isReviewedInForeign INTEGER
      )`
    );

    const ts = Math.floor(Date.now()) as number;
    const stmt = db.prepare(
      `INSERT INTO reviews (wordid, reviewTimestamp, success, hintUsed, isReviewedInForeign) VALUES (?, ?, ?, ?, ?)`
    );
    const info = stmt.run(body.wordId, ts, body.success, body.hintUsed ?? 0, body.isReviewedInForeign);
    db.close();

    return NextResponse.json({ id: info.lastInsertRowid });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
