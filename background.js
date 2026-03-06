// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchBibtex') {
    fetch(request.url)
      .then(response => response.text())
      .then(text => sendResponse({ success: true, data: text }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // 异步响应
  }
});
