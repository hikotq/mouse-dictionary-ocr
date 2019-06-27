import { TesseractWorker } from 'tesseract.js';
const worker = new TesseractWorker();

const MD_EXTENSION_ID = "dnclbikcihnpjohihfcmmldgkjnebgnj";
const DIALOG_ID = "____MOUSE_DICTIONARY_cf744bd007850b04601dc865815ec0f5e60c6970";

// 画像の解析結果が入ったテーブル
let analyzedTable = new Map();

// カーソルの位置にある単語を返す
const getTextAtCursor = (img, x, y) => {
  const tesseractId = img.getAttribute("data-tesseractId");
  if (!analyzedTable.has(tesseractId)) {
    return null;
  }
  const analyzed = analyzedTable.get(tesseractId);
  const word = analyzed.words.find(word => {
    const bbox = word.bbox;
    const left = bbox.x0;
    const top = bbox.y0;
    const right = bbox.x1;
    const bottom = bbox.y1;
    return (left <= x && x <= right && top <= y && y <= bottom) && word.confidence > 30;
  });
  if (word) {
    return word.text;
  }
  return null;
}

// 画像の上をカーソルが移動したときに呼び出される
const onMouseMove = (e) => {
  const img = e.target;
  const posX = e.offsetX ? (e.offsetX) : e.pageX - img.offsetLeft;
  const posY = e.offsetY ? (e.offsetY) : e.pageY - img.offsetTop;
  const textAtCursor = getTextAtCursor(img, posX, posY);
  console.log("cursor pos: (" + posX + ", " + posY + ")");
  console.log("text: " + textAtCursor);

  if (textAtCursor) {
    chrome.runtime.sendMessage(MD_EXTENSION_ID, {
      type: "text",
      text: textAtCursor,
      mustIncludeOriginalText: false,
      enableShortWord: true
    });
  }
}


const analyze = (img) => {
  const tesseractId = img.getAttribute("data-tesseractId");
  if (analyzedTable.has(tesseractId)) {
    return;
  }
  worker.recognize(img, 'eng')
    .progress(function(message) {
      console.log(message);
    })
    .catch(err => console.error(err))
    .then(function(result) {
      analyzedTable.set(tesseractId, result);
      console.log(result);
    })
    .finally(resultOrError => console.log(resultOrError))
}

// ページ中の画像を全て解析する
const analyzeAll = () => {
  let imgList = Array.prototype.slice.call(document.getElementsByTagName("img"));
  let n = 0;
  imgList.forEach(img => {
    if (img.src) {
      img.setAttribute("data-tesseractId", n);
      n += 1;
      analyze(img);
      img.onmousemove = onMouseMove; 
    }
  })
}

const main = () => {
  analyzeAll();
};

window.onload = () => main();
