let activeTabDomain = null;

// Get domain from URL
function getDomain(url) {
    try {
        let urlObject = new URL(url);
        return urlObject.hostname;
    } catch (e) {
        return null;
    }
}

// Check active tab every second
setInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;

        let tab = tabs[0];
        if (!tab.url) return;

        let domain = getDomain(tab.url);
        if (!domain) return;

        activeTabDomain = domain;

        // Get today's date
        let today = new Date().toISOString().split("T")[0];

        chrome.storage.local.get([today], (result) => {
            let data = result[today] || {};

            if (!data[domain]) {
                data[domain] = 0;
            }

            data[domain] += 1;

            chrome.storage.local.set({ [today]: data });
        });
    });
}, 1000);