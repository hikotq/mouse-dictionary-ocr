import '../img/icon48.png';
import '../img/icon128.png';

import utils from './lib/utils';

import { TesseractWorker } from 'tesseract.js';
const worker = new TesseractWorker();

const MD_EXTENSION_ID = utils.getMdExtensionId();
const DIALOG_ID = "____MOUSE_DICTIONARY_cf744bd007850b04601dc865815ec0f5e60c6970";

// 画像の解析結果が入ったテーブル
let analyzedTable = new Map();
let n = 0;

const main = () => {
  const body = document.querySelector("body");
  const observer = new MutationObserver(() => {
    const md = document.getElementById(DIALOG_ID);
    if (md) {
      observer.disconnect();
      addOnMouseMoveListner();
      observeMouseDictionary();
    }
  });
  const config = { childList: true };
  observer.observe(body, config);
}

const observeMouseDictionary = () => {
  const md = document.getElementById(DIALOG_ID);
  let prevIsHidden = md.getAttribute("data-mouse-dictionary-hidden");

  const observer = new MutationObserver(() => {
    const md = document.getElementById(DIALOG_ID);
    const isHidden = md.getAttribute("data-mouse-dictionary-hidden") === "true";
    if (!isHidden && prevIsHidden) {
      addOnMouseMoveListner();
    }
    prevIsHidden = isHidden;
  });

  const config = { attributes: true };
  observer.observe(md, config);
}

const addOnMouseMoveListner = () => {
   let imgList = Array.prototype.slice.call(document.getElementsByTagName("img"));
   imgList.forEach(img => {
     if (img.src && !img.hasAttribute("data-tesseractId")) {
       img.setAttribute("data-tesseractId", n);
       n += 1;
       img.onmousemove = onMouseMove; 
     }
   })
}

// 画像の上をカーソルが移動したときに呼び出される
const onMouseMove = (e) => {
  const img = e.target;
  const md = document.getElementById(DIALOG_ID);
  const tesseractId = img.getAttribute("data-tesseractId");

  if (!md || md.getAttribute("data-mouse-dictionary-hidden") === "true") {
    return;
  }
  if (!analyzedTable.has(tesseractId)) {
    analyze(img);
  }

  const posX = e.offsetX ? (e.offsetX) : e.pageX - img.offsetLeft;
  const posY = e.offsetY ? (e.offsetY) : e.pageY - img.offsetTop;
  const textAtCursor = getTextAtCursor(img, posX, posY);

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
  analyzedTable.set(tesseractId, null);

  chrome.runtime.sendMessage(
    {
      id: tesseractId,
      title: "Analyzing Image-" + tesseractId,
      message: "0% analyzed!",
    }
  )
  let analyzePromise = worker.recognize(img, 'eng')
    .progress((message) => {
      if (message.status == "recognizing text") {
        const progress = parseInt(message.progress * 100);
        chrome.runtime.sendMessage(
          {
            id: tesseractId,
            title: "Analyzing Image-" + tesseractId,
            message: progress + "% analyzed!",
          }
        )
      }
    })
    .then(function(result) {
      analyzedTable.set(tesseractId, result);
    })
  return analyzePromise;
}

// カーソルの位置にある単語を返す
const getTextAtCursor = (img, x, y) => {
  const tesseractId = img.getAttribute("data-tesseractId");
  if (!analyzedTable.has(tesseractId) || !analyzedTable.get(tesseractId)) {
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

main();
