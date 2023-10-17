const root: URL = new URL(window.location.href);
let timeoutID: number;

type Drawing = {
  [key: string]: string | number[];
  no: string;
  name: string;
  filename: string;
  binary: number[];
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
        // バイナリをBlobへ変換
        const ext = drawing.filename.split(".").pop();
        const array = new Uint8Array(drawing.binary);
        const blob = new Blob([array], { type: `image/${ext}` });

        // BlobオブジェクトをURLに変換
        const objectUrl = URL.createObjectURL(blob);

        // サムネイルイメージ用の要素を作成
        const img = document.getElementById("img");
        if (!img) return;
        img.setAttribute("style", "displey='none'");

        // バイナリとファイル名をaタグへ挿入
        const a = document.createElement("a");
        // Blob オブジェクトをURLへ変換し、aタグへ挿入
        a.href = objectUrl;

        // ファイル名を決めてaタグへ挿入
        a.download = `${drawing.no}_${drawing.name}.${ext}`;
        a.textContent = drawing.no;

        // マウスオーバー時にサムネイルを表示
        a.addEventListener("mouseover", () => {
          img.setAttribute("src", objectUrl);
          img.style.display = "inline";
          img.setAttribute("width", "100vw");
        });

        // マウスが移動した時にサムネイルを非表示
        a.addEventListener("mouseout", () => {
          img.style.display = "none";
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
