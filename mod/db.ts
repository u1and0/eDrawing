/* データベース関連クラス */
import { DB } from "https:deno.land/x/sqlite/mod.ts";
import { walk } from "https:deno.land/std/fs/mod.ts";

const dbfile = "./data/edrawing.db";
const tableName = "DrawingTable";

export async function readFiles(root: string): Promise<string[]> {
  const paths = [];
  for await (const entry of walk(root)) {
    if (entry.isFile && entry.name.endsWith(".tif")) {
      paths.push(entry.path);
    }
  }
  return paths;
}

export class EDB extends DB {
  drawings: Drawing[] = [];
  constructor() {
    super(dbfile);
  }
  load() {
    for (const row of super.query(`SELECT * FROM ${tableName}`)) {
      const drawing: Drawing = {
        no: row[0] as string,
        name: row[1] as string,
        creator: row[2] as string,
        createdDate: row[3] as Date,
        modifier: row[4] as string,
        modifiedDate: row[5] as Date,
        filename: row[6] as string,
        binary: Array.from(row[7] as Uint8Array),
      };
      this.drawings.push(drawing);
    }
    // 読み込んだデータを一覧表示
    this.drawings.forEach((d) => console.debug(d));
  }

  // テスト用のテーブルを新規作成する
  refresh() {
    // DBを新規作成
    super.execute(`DROP TABLE IF EXISTS ${tableName}`);
    super.execute(`
             CREATE TABLE IF NOT EXISTS ${tableName} (
               no TEXT PRIMARY KEY,
               name TEXT,
               creator TEXT,
               createdDate TEXT,
               modifier TEXT,
               modifiedDate TEXT,
               filename TEXT,
               binary BLOB
             )
             `);
  }

  // Drawingを新規レコードとして追加
  insert(d: Drawing) {
    const convert = [
      d.no as string,
      d.name as string,
      d.creator as string,
      d.createdDate as Date,
      d.modifier as string,
      d.modifiedDate as Date,
      d.filename as string,
      d.binary as Uint8Array,
    ];
    console.log(convert);
    super.query(
      `INSERT INTO ${tableName} (
        no,
        name,
        creator,
        createdDate,
        modifier,
        modifiedDate,
        filename,
        binary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      convert,
    );
  }
}
