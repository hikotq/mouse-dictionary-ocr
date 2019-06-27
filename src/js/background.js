import '../img/icon-128.png'
import '../img/icon-34.png'
chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.executeScript({
    file: "./main.js"
  });
});
