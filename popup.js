function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs}h ${mins}m ${secs}s`;
}

function isDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getTopSites(data, limit = 3) {
    return Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
}

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];

    const totalTimeDiv = document.getElementById("totalTime");
    const siteList = document.getElementById("siteList");
    const historyList = document.getElementById("historyList");

    function loadTodayUsage(storageData) {
        const data = storageData[today] || {};
        const total = Object.values(data).reduce((sum, seconds) => sum + seconds, 0);

        totalTimeDiv.textContent = `Total Today: ${formatTime(total)}`;
        siteList.innerHTML = "";

        if (!Object.keys(data).length) {
            siteList.innerHTML = '<li class="empty-state">No tracked activity yet for today.</li>';
            return;
        }

        for (const [site, seconds] of Object.entries(data).sort((a, b) => b[1] - a[1])) {
            const percentage = total > 0 ? ((seconds / total) * 100).toFixed(1) : 0;
            const li = document.createElement("li");

            li.innerHTML = `
                <span class="site-title">${site}</span>
                Time: ${formatTime(seconds)}<br>
                Usage: ${percentage}%
            `;

            siteList.appendChild(li);
        }
    }

    function loadHistory(storageData) {
        const historicalDates = Object.keys(storageData)
            .filter((key) => isDateKey(key) && key !== today)
            .sort((a, b) => b.localeCompare(a));

        historyList.innerHTML = "";

        if (!historicalDates.length) {
            historyList.innerHTML = '<li class="empty-state">No previous usage history available yet.</li>';
            return;
        }

        for (const date of historicalDates) {
            const dayData = storageData[date] || {};
            const total = Object.values(dayData).reduce((sum, seconds) => sum + seconds, 0);
            const topSites = getTopSites(dayData)
                .map(([site, seconds]) => `${site} (${formatTime(seconds)})`)
                .join(" • ");

            const li = document.createElement("li");
            li.innerHTML = `
                <span class="history-date">${date}</span>
                <span class="history-meta">Total: ${formatTime(total)}</span>
                <div>${topSites || "No website details"}</div>
            `;

            historyList.appendChild(li);
        }
    }

    chrome.storage.local.get(null, (storageData) => {
        loadTodayUsage(storageData);
        loadHistory(storageData);
    });
});
