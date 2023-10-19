/* data以下のtifファイルをedawing.dbへ追加 */
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import {
  Application,
  helpers,
  Router,
  RouterContext,
  send,
} from "https:deno.land/x/oak/mod.ts";

import { createThumbnail, EDB, readFiles } from "./mod/db.ts";
import { Drawing } from "./mod/file.ts";

const VERSION = "v0.1.0";

// テストデータを更新
const newTest = async () => {
  const db = new EDB();
  db.refresh();
  await readFiles("./data")
    .then((imagePaths) => {
      imagePaths.forEach(async (path: string, i: number) => {
        // イメージの読み込み
        const image: Uint8Array = Deno.readFileSync(path);
        await createThumbnail(path)
          .then((thumbnail) => {
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
              thumbnail: thumbnail,
            };
            // 図面をDBへ登録
            db.insert(drawing);
          })
          .catch((error) => {
            console.error(error);
          });
      });
    });
  // db close するとinsertできない。forEachの後に
  // db.closeしているのになんで？？
  //
  // SqliteError: Database was closed.
  //     at EDB.prepareQuery (https://deno.land/x/sqlite@v3.8/src/db.ts:357:13)
  //     at EDB.query (https://deno.land/x/sqlite@v3.8/src/db.ts:258:24)
  //     at EDB.insert (file:///mnt/3_Personal/2%E8%AA%B2/ando-yu/vms/fekoubuntu/eDrawing/mod/db.ts:
  // 93:11)
  //     at file:///mnt/3_Personal/2%E8%AA%B2/ando-yu/vms/fekoubuntu/eDrawing/index.ts:40:16
  //     at async file:///mnt/3_Personal/2%E8%AA%B2/ando-yu/vms/fekoubuntu/eDrawing/index.ts:25:9
  // db.close();
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
// await newTest(); // 古いテストデータを捨てて新しいテストデータを構築する
