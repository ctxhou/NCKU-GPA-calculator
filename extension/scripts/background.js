'use strict';

chrome.runtime.onInstalled.addListener(function(details) {
    console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    var url = tab.url;
    if (url.match("qrys.sso2.ncku.edu.tw") || url.match("140.116.165.71:8888") || url.match("140.116.165.72:8888") || url.match("140.116.165.73:8888")) {
        chrome.pageAction.show(tabId);
    }
});
// after user click the icon, show gpa result
chrome.pageAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "show_gpa"}, function(response) {});  
    });
});
