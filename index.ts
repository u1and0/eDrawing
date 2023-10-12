/* data以下のtifファイルをedawing.dbへ追加 */
import { walk } from "https:deno.land/std/fs/mod.ts";
import { DB } from "https:deno.land/x/sqlite/mod.ts";
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import {
  Application,
  helpers,
  Router,
  RouterContext,
  send,
} from "https:deno.land/x/oak/mod.ts";

const VERSION = "v0.1.0";
const dbfile = "./data/edrawing.db";
const tableName = "DrawingTable";

async function readFiles(root: string): Promise<string[]> {
  const paths = [];
  for await (const entry of walk(root)) {
    if (entry.isFile && entry.name.endsWith(".tif")) {
      paths.push(entry.path);
    }
  }
  return paths;
}

class Folder {
  constructor() {
  }
}

// 図面のプロパティ
type Drawing = {
  // Standard info
  no: string;
  name: string;
  creator: string;
  createdDate: Date;
  modifier: string;
  modifiedDate: Date;
  // Image
  filename: string;
  binary: Uint8Array;
  // Folder info
  // pairentsFolder: Folder[];
  // Graph info
  // pairentsDrawings: Drawing[];
  // childrenDrawings: Drawing[];
};

class EDB extends DB {
  drawings: Drawing[] = [];
  constructor(dbPath: string) {
    super(dbPath);
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

// テストデータを更新
const newTest = () => {
  const db = new EDB(dbfile);
  db.refresh();
  readFiles("./data")
    .then((imagePaths) => {
      imagePaths.forEach((path: string, i: number) => {
        // イメージの読み込み
        const image: Uint8Array = Deno.readFileSync(path);
        // Drawingを規定
        const drawing: Drawing = {
          no: `RSW55555${i}`,
          name: `テストモジュール${i}`,
          creator: `Tester${i}`,
          createdDate: new Date(2000, 1, 2, 6, 4, 5),
          modifier: `Tester${i + 10}`,
          modifiedDate: new Date(),
          filename: path,
          binary: image,
        };
        // 図面をDBへ登録
        db.insert(drawing);
      });
      db.close();
    });
};

const main = async () => {
  const db = new EDB(dbfile);
  db.load();

  /* エンドポイント定義 */

  // User interface router group
  const router = new Router();
  router.get("/", (ctx: RouterContext) => {
    ctx.response.body = "Hello world!";
  });

  // Sample
  // localhost:3000/hello?name=Ben
  router.get("/index", (ctx: RouterContext) => {
    const q = helpers.getQuery(ctx, { mergeParams: true });
    const eta = new Eta({ views: "./templates" });
    const res = eta.render("./index", {
      version: VERSION,
      name: q.name,
    });
    ctx.response.type = "text/html";
    ctx.response.body = res;
  });

  // Application programing interface router group
  const apiv1 = new Router();

  // Sample
  // localhost:3000/search?no=555&name=1
  apiv1.get("/search", (ctx: RouterContext) => {
    const q = helpers.getQuery(ctx, { mergeParams: true });
    console.debug("query:", q);
    const results = db.drawings.filter((drawing: Drawing) => {
      // q.noかつq.nameを含んでいるレコードだけ返す
      return (!q.no || drawing.no.includes(q.no)) &&
        (!q.name || drawing.name.includes(q.name));
    });
    console.debug("matched:", results);
    // string[]形式のJSONを返す
    ctx.response.body = results;
  });

  router.use("/api/v1", apiv1.routes(), apiv1.allowedMethods());

  /* appを立てて配信 */
  const app = new Application();
  const port = 3000;
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.use(async (ctx: RouterContext) => {
    await send(ctx, ctx.request.url.pathname, {
      root: `${Deno.cwd()}/static`,
    });
  });

  console.log(`distribute on localhost:${port}`);
  await app.listen({ port: port });
  db.close(); // 最後にかならずDBを閉じる
};

await main();
// newTest(); // 古いテストデータを捨てて新しいテストデータを構築する
