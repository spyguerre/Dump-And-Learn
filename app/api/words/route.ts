import { NextResponse } from "next/server";

type Body = {
  native?: string;
  foreign?: string;
  description?: string;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    const nativeWord = (body.native || "").toString().trim();
    const foreignWord = (body.foreign || "").toString().trim();
    const description = (body.description || "").toString();

    if (!nativeWord || !foreignWord) {
      return NextResponse.json({ error: "Both native and foreign are required" }, { status: 400 });
    }

    const dbPath = process.cwd() + "/dalData.db";

    // Dynamically import better-sqlite3 to avoid ESM/CJS issues in environments.
    const mod = await import("better-sqlite3");
    const Database = (mod && (mod.default || mod)) as any;
    const db = new Database(dbPath);

    db.exec(
      `CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        native TEXT,
        "foreign" TEXT,
        description TEXT,
        timestamp INTEGER
      )`
    );

    const stmt = db.prepare('INSERT INTO words (native, "foreign", description, timestamp) VALUES (?, ?, ?, ?)');
    const info = stmt.run(nativeWord, foreignWord, description, Math.floor(Date.now() / 1000));
    db.close();

    return NextResponse.json({ id: info.lastInsertRowid, nativeWord: nativeWord, foreignWord: foreignWord, description: description });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
