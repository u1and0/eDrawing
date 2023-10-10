/* data以下のtifファイルをedawing.dbへ追加 */
import { fromFileUrl } from "https://deno.land/std@0.203.0/path/win32.ts";
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

async function readFiles(root: string): Promise<string[]> {
  const paths = [];
  for await (const entry of walk(root)) {
    if (entry.isFile && entry.name.endsWith(".tif")) {
      paths.push(entry.path);
    }
  }
  return paths;
}

// 図面のプロパティ
type Drawing = {
  no: string;
  name: string;
  filename: string;
  binary: Blob | Uint8Array;
};

class EDB extends DB {
  drawings: Drawing[] = [];
  constructor(dbPath: string) {
    super(dbPath);
    for (const row of super.query("SELECT * FROM 図面")) {
      const drawing: Drawing = {
        no: row[0],
        name: row[1],
        filename: row[2],
        binary: row[3],
      };
      this.drawings.push(drawing);
    }
    // 読み込んだデータを一覧表示
    this.drawings.forEach((d) => console.debug(d));
  }

  // テスト用のテーブルを新規作成する
  refresh() {
    // DBを新規作成
    super.execute("DROP TABLE IF EXISTS 図面");
    super.execute(`
             CREATE TABLE IF NOT EXISTS 図面 (
               no TEXT PRIMARY KEY,
               name TEXT,
               filename TEXT,
               binary BLOB
             )
             `);
  }

  // Drawingを新規レコードとして追加
  insert(d: Drawing) {
    super.query(
      ` INSERT INTO 図面 (no, name ,filename,  binary) VALUES (?, ?, ?, ?)`,
      [d.no, d.name, d.filename, d.binary],
    );
  }
}

// テストデータを更新
const newTest = () => {
  const db = new EDB("./data/edrawing.db");
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
  const db = new EDB("./data/edrawing.db");

  /* エンドポイント定義 */

  const router = new Router();
  router.get("/", (ctx: RouterContext) => {
    ctx.response.body = "Hello world!";
  });

  // Sample
  // localhost:3000/search?no=555&name=1
  router.get("/search", (ctx: RouterContext) => {
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

  // Sample
  // localhost:3000/hello?name=Ben
  router.get("/hello", (ctx: RouterContext) => {
    const q = helpers.getQuery(ctx, { mergeParams: true });
    const eta = new Eta({ views: "./templates" });
    const res = eta.render("./index", { name: q.name });
    ctx.response.type = "text/html";
    ctx.response.body = res;
  });

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
