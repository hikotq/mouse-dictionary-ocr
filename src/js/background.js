chrome.runtime.onMessage.addListener((notify) => {
  const title = notify.title;
  const message = notify.message;
  let id = "ocr-notification-" + notify.id;
  chrome.notifications.create(id, {
    "type": "basic",
    "title": title,
    "message": message,
    "iconUrl": "icon48.png",
  })
});
