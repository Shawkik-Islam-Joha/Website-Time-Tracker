const SESSION_STATE_KEY = "__sessionState";
const TRACK_ALARM_NAME = "trackActiveTabTime";

function getTodayKey() {
    return new Date().toISOString().split("T")[0];
}

// Track only normal web pages and ignore browser/extension pages (including New Tab pages).
function getTrackableDomain(url) {
    try {
        const urlObject = new URL(url);
        const isWebPage = urlObject.protocol === "http:" || urlObject.protocol === "https:";

        if (!isWebPage || !urlObject.hostname) {
            return null;
        }

        return urlObject.hostname;
    } catch (e) {
        return null;
    }
}

function isTrackingAllowed(callback) {
    chrome.windows.getLastFocused({}, (windowInfo) => {
        if (chrome.runtime.lastError || !windowInfo) {
            callback(false);
            return;
        }

        callback(windowInfo.state !== "minimized");
    });
}

function getCurrentActiveDomain(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0 || !tabs[0].url) {
            callback(null);
            return;
        }

        callback(getTrackableDomain(tabs[0].url));
    });
}

function addElapsedTimeToStorage(domain, elapsedSeconds, callback) {
    if (!domain || elapsedSeconds <= 0) {
        callback();
        return;
    }

    const today = getTodayKey();

    chrome.storage.local.get([today], (result) => {
        const data = result[today] || {};
        data[domain] = (data[domain] || 0) + elapsedSeconds;

        chrome.storage.local.set({ [today]: data }, callback);
    });
}

function saveSessionState(state, callback = () => {}) {
    chrome.storage.local.set({ [SESSION_STATE_KEY]: state }, callback);
}

function trackActiveTabTime() {
    const now = Date.now();

    isTrackingAllowed((allowed) => {
        chrome.storage.local.get([SESSION_STATE_KEY], (result) => {
            const sessionState = result[SESSION_STATE_KEY] || {};
            const lastDomain = sessionState.lastDomain || null;
            const lastTimestamp = sessionState.lastTimestamp || now;
            const elapsedSeconds = Math.floor((now - lastTimestamp) / 1000);

            if (!allowed) {
                addElapsedTimeToStorage(lastDomain, elapsedSeconds, () => {
                    saveSessionState({
                        lastDomain: null,
                        lastTimestamp: now
                    });
                });
                return;
            }

            getCurrentActiveDomain((currentDomain) => {
                addElapsedTimeToStorage(lastDomain, elapsedSeconds, () => {
                    saveSessionState({
                        lastDomain: currentDomain,
                        lastTimestamp: now
                    });
                });
            });
        });
    });
}

function ensureTrackingAlarm() {
    chrome.alarms.create(TRACK_ALARM_NAME, { periodInMinutes: 1 });
}

chrome.runtime.onInstalled.addListener(() => {
    ensureTrackingAlarm();
    trackActiveTabTime();
});

chrome.runtime.onStartup.addListener(() => {
    ensureTrackingAlarm();
    trackActiveTabTime();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === TRACK_ALARM_NAME) {
        trackActiveTabTime();
    }
});

chrome.tabs.onActivated.addListener(() => {
    trackActiveTabTime();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.status === "complete" || changeInfo.url) {
        trackActiveTabTime();
    }
});

chrome.windows.onFocusChanged.addListener(() => {
    trackActiveTabTime();
});
