const root: URL = new URL(window.location.href);
let timeoutID: number;

type Drawing = {
  [key: string]: string | number[];
  no: string;
  name: string;
  filename: string;
  binary: number[];
  thumbnail: number[];
};

type Header = {
  name: string;
  value: string;
};

const fetchSearchInput = () => {
  clearTimeout(timeoutID); // 前回のタイマーストップ
  // スピナーを表示する
  const spinner = document.querySelector(`.spinner-border`);
  if (!spinner) {
    return;
  }
  setTimeout(() => {
    timeoutID = setTimeout(() => { // 新しいタイマーを設置
      spinner.removeAttribute("style");
      const container = initResult();
      if (container === undefined) {
        console.error("Not found result-table or error-div");
        return;
      }
      getJSONfromURL()
        .then((data: Drawing[]) => {
          console.debug(data);
          createTable(data);
        })
        .catch((error) => {
          container.error.textContent = error.message;
        })
        .finally(() => spinner.setAttribute("style", "display:none"));
    }, 400); // 400ms以内に入力があったらfetchをキャンセル
  }, 25); // spinnerは25msec後に開始
};

const getJSONfromURL = async (): Promise<Drawing[]> => {
  const no = (document.getElementById("no") as HTMLInputElement).value;
  const name = (document.getElementById("name") as HTMLInputElement).value;
  const url = `${root.origin}/api/v1/search?no=${no}&name=${name}`;
  const response = await fetch(url);
  if (response.status === 200) {
    return await response.json() as Drawing[];
  }
  const errorData = await response.json();
  console.error(response.status, errorData);
  throw new Error(errorData.msg);
};

type Container = {
  result: HTMLTableElement;
  error: HTMLDivElement;
};

// 結果とエラーメッセージの選択とクリア
const initResult = (): Container | undefined => {
  // 結果を表示するテーブルの選択
  const resultTable = document.querySelector(
    "#result-table",
  ) as HTMLTableElement;
  if (!resultTable) return;

  // エラーを表示するdivの選択
  const errorDiv = document.querySelector("#error-div") as HTMLDivElement;
  if (!errorDiv) return;

  // clear previous result & error
  resultTable.innerHTML = "";
  errorDiv.innerHTML = "";
  return { result: resultTable, error: errorDiv };
};

const createTableHeader = (resultTable: HTMLTableElement, header: Header[]) => {
  const theadElem = resultTable.createTHead();
  const tr = theadElem.insertRow();
  header.forEach((cell: Header) => {
    const th = document.createElement("th"); // th要素の追加
    th.appendChild(document.createTextNode(cell.name)); // thにテキスト追加
    tr.appendChild(th); // thをtrへ追加
  });
  resultTable.appendChild(theadElem);
};

const createTable = (drawings: Drawing[]): void => {
  const resultTable = document.querySelector(
    "#result-table",
  ) as HTMLTableElement;
  if (resultTable === null) {
    console.error("Not found result-table");
    return;
  }
  const header: Header[] = [
    { name: "図面No", value: "no" },
    { name: "図面名", value: "name" },
    { name: "作成者", value: "creator" },
    { name: "作成日", value: "createdDate" },
    { name: "更新者", value: "modifier" },
    { name: "更新日", value: "modifiedDate" },
  ];
  createTableHeader(resultTable, header);

  const tbody = document.createElement("tbody");
  drawings.forEach((drawing: Drawing) => {
    const tr = tbody.insertRow();
    header.forEach((h: Header) => {
      const td = tr.insertCell();
      if (h.name === "図面No") {
        // ダウンロードリンク
        //
        // バイナリをBlobへ変換
        const ext = drawing.filename.split(".").pop();
        const array = new Uint8Array(drawing.binary);
        const blob = new Blob([array], { type: `image/${ext}` });
        const tiffDownloadLink = URL.createObjectURL(blob);

        // バイナリとファイル名をaタグへ挿入
        const a = document.createElement("a");
        // Blob オブジェクトをURLへ変換し、aタグへ挿入
        a.href = tiffDownloadLink;

        // ファイル名を決めてaタグへ挿入
        const filename = `${drawing.no}_${drawing.name}.${ext}`;
        a.download = filename;
        a.textContent = drawing.no;

        // サムネイル
        //
        // 画像を表示するエレメントを取得
        const imgAtag = document.getElementById("thumbnail");
        if (!imgAtag) return;
        const img = imgAtag.querySelector("img");
        if (!img) return;
        const imagePopup = document.getElementById("image-popup");
        if (!imagePopup) return;
        const imagePopupImg = imagePopup.querySelector("img");
        if (!imagePopupImg) return;
        const closeButton = document.getElementById("close-button");
        if (!closeButton) return;

        // マウスオーバー時にサムネイルを表示
        a.addEventListener("mouseover", () => {
          // サムネイルaタグにリンクを追加
          imgAtag.setAttribute("href", tiffDownloadLink);
          imgAtag.setAttribute("download", filename);
          // サムネイルを作成
          const array = new Uint8Array(drawing.thumbnail);
          const blob = new Blob([array], { type: "image/png" });
          img.setAttribute("src", URL.createObjectURL(blob));
          imagePopupImg.setAttribute("src", URL.createObjectURL(blob));

          // マウスオーバーで拡大
          img.addEventListener("mouseover", () => {
            // img.style.transform = "scale(4)";
            imagePopup.style.display = "block";
            imagePopupImg.style.maxWidth = window.innerWidth + "px";
            imagePopupImg.style.maxHeight = window.innerHeight + "px";
          });

          closeButton.addEventListener("click", () => {
            // img.style.transform = "scale(1)";
            imagePopup.style.display = "none";
          });
        });

        td.appendChild(a);
      } else {
        const text: string = drawing[h.value] === null
          ? ""
          : drawing[h.value].toString();
        td.appendChild(document.createTextNode(text));
      }
    });
    tbody.appendChild(tr);
  });
  resultTable.appendChild(tbody);
};
