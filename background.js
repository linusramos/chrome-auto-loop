// Auto-loop over URLs
// https://github.com/one10/chrome-auto-loop
// based on chrome ext. examples

var minDefaultSleep = 60000; // e.g., 3000 is 3 seconds
var maxDefaultSleep = 60000; // e.g., 3000 is 3 seconds

if (localStorage["min_default_sleep"]) {
    minDefaultSleep = parseInt(localStorage["min_default_sleep"]);
}

if (localStorage["max_default_sleep"]) {
    maxDefaultSleep = parseInt(localStorage["max_default_sleep"]);
}

var urlsObj;

var urlFilename = 'urls';
if (localStorage["filetype"] == "json") {
   urlFilename = urlFilename + ".json";
} else {
   urlFilename = urlFilename + ".txt";
}

var curUrlIndex = 0;
var isRunning = 1;

updateIcon(isRunning);

// load JSON file with URLs
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = parseInput;
xhr.open("GET", chrome.extension.getURL(urlFilename), true);
xhr.send(null);

// allow disabling the loop via icon click
chrome.browserAction.onClicked.addListener(toggleRunning);

// kick off perpetual visitUrl 
var interval = setInterval(visitUrl, maxDefaultSleep);

function visitUrl() {
    if (isRunning == 1) {
        chrome.tabs.getSelected(null, function(tab) {
            full_url = localStorage["url_prefix"] ? localStorage["url_prefix"].trim() : "";
            full_url += localStorage["query_prefix"] ? localStorage["query_prefix"].trim() : "";
            full_url += urlsObj.urls[curUrlIndex].url;
        
            if (urlsObj.urls[curUrlIndex].pause) {
                pause = urlsObj.urls[curUrlIndex].pause;
            }
            else {
                pause = (minDefaultSleep + Math.floor(Math.random() * maxDefaultSleep));
            }

            // increment or roll over the URL counter
            if (curUrlIndex == (urlsObj.urls.length - 1)) {
                curUrlIndex = 0;
            } else {
                curUrlIndex += 1;
            }
            updateIcon(isRunning);

            // re-set the interval to either default or from JSON
            clearInterval(interval); 
            interval = setInterval(visitUrl, pause);

            chrome.tabs.update(tab.id, {url: full_url});
        });
    }
}

function toggleRunning() {
    isRunning = isRunning == 1 ? 0 : 1;
    updateIcon(isRunning);
}

function updateIcon(isRunning) {
    chrome.browserAction.setIcon({path:"images/" + isRunning + ".png"});
}

function parseInput() { 
    if (xhr.readyState == 4) {
        if (xhr.responseText) {
            // expecting either JSON or plaintext with urls
            if (localStorage["filetype"] == "json") {
                urlsObj = JSON.parse(xhr.responseText);
            }
            else {
                // for plaintext, mimic the JSON structure
                urlsObj = { "urls":[] };
                var urls = xhr.responseText.trim().split('\n');
                for (var i in urls) {
                    var url = new Object();
                    url.url  = urls[i];
                    urlsObj.urls.push(url);
                }
            }
        }
        
        if (!xhr.responseText || !urlsObj || urlsObj.urls.length == 0) {
            alert("Error loading the URL JSON, extension not running");
            isRunning = 0;
        }
        else {
            isRunning = 1;
        }
    }
}
