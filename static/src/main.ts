const root: URL = new URL(window.location.href);
let timeoutID: number;

type Drawing = {
  no: string;
  name: string;
  filename: string;
  binary: Blob | Uint8Array;
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
      getJSONfromURL()
        .then((data: Drawing[]) => {
          // createTableFromJSON(data);
          console.log(data);
        })
        .catch((error) => {
          const container = initResult();
          if (container === undefined) {
            console.error("Not found result-table or error-div");
            return;
          }
          if (container.error) {
            container.error.textContent = error.message;
          }
        })
        .finally(() => spinner.setAttribute("style", "display:none"));
    }, 400); // 400ms以内に入力があったらfetchをキャンセル
  }, 25); // spinnerは25msec後に開始
};

const getJSONfromURL = async () => {
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
