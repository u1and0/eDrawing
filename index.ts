/* data以下のtifファイルをedawing.dbへ追加 */
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import {
  Application,
  helpers,
  Router,
  RouterContext,
  send,
} from "https:deno.land/x/oak/mod.ts";

import { EDB, readFiles } from "./mod/db.ts";
import { Drawing } from "./mod/file.ts";

const VERSION = "v0.1.0";

// テストデータを更新
const newTest = () => {
  const db = new EDB();
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
  const db = new EDB();
  db.load();

  /* エンドポイント関数定義 */

  // topPage API はトップページへアクセスするHTMLハンドラです。
  const topPage = (ctx: RouterContext) => {
    const eta = new Eta({ views: "./templates" });
    const res = eta.render("./index", {
      version: VERSION,
    });
    ctx.response.type = "text/html";
    ctx.response.body = res;
  };

  // search API は図面番号と図面名称を渡してそれが含まれるDrawingインスタンスを返します。
  const search = (ctx: RouterContext) => {
    const q = helpers.getQuery(ctx, { mergeParams: true });
    console.debug("query:", q);
    const results = db.drawings.filter((drawing: Drawing) => {
      // q.noかつq.nameを含んでいるレコードだけ返す
      return (!q.no || drawing.no.includes(q.no.toUpperCase())) &&
        (!q.name || drawing.name.includes(q.name));
    });
    console.debug("matched:", results);
    // string[]形式のJSONを返す
    ctx.response.body = results;
  };

  /* エンドポイント定義 */

  // User interface router group
  const router = new Router();
  router
    .get("/", (ctx: RouterContext) => {
      ctx.response.status = 301; // Moved Permanently
      ctx.response.headers.set("Location", "/index");
    })
    .get("/index", (ctx: RouterContext) => topPage(ctx));

  // Application programing interface router group
  const apiv1 = new Router();

  // Sample:localhost:3000/search?no=555&name=1
  apiv1.get("/search", (ctx: RouterContext) => search(ctx));

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
