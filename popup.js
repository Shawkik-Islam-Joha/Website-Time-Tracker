const SESSION_STATE_KEY = "__sessionState";

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs}h ${mins}m ${secs}s`;
}

function formatShortDate(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getRecentDates(limit = 7) {
    const dates = [];
    const now = new Date();

    for (let i = limit - 1; i >= 0; i -= 1) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
    }

    return dates;
}

function getDailyTotal(dayData) {
    return Object.values(dayData || {}).reduce((sum, seconds) => sum + seconds, 0);
}

function cloneStorageData(storageData) {
    return Object.fromEntries(
        Object.entries(storageData).map(([date, dayData]) => [date, { ...(dayData || {}) }])
    );
}

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

function drawUsageChart(canvas, statsByDate, dates) {
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    context.clearRect(0, 0, width, height);

    const totals = dates.map((date) => getDailyTotal(statsByDate[date]));
    const maxValue = Math.max(...totals, 1);
    const padding = 18;
    const chartHeight = height - padding * 2 - 14;
    const barWidth = (width - padding * 2) / dates.length - 6;

    totals.forEach((value, index) => {
        const barHeight = Math.round((value / maxValue) * chartHeight);
        const x = padding + index * (barWidth + 6);
        const y = height - padding - barHeight - 10;

        context.fillStyle = "#6750a4";
        context.fillRect(x, y, barWidth, barHeight);

        context.fillStyle = "#625b71";
        context.font = "10px Segoe UI";
        context.textAlign = "center";
        context.fillText(formatShortDate(dates[index]).replace(" ", "/"), x + barWidth / 2, height - 4);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    const recentDates = getRecentDates(7);

    const totalTimeDiv = document.getElementById("totalTime");
    const siteList = document.getElementById("siteList");
    const statsToggle = document.getElementById("statsToggle");
    const statsSection = document.getElementById("statsSection");
    const historyDateLabel = document.getElementById("historyDateLabel");
    const historyTotal = document.getElementById("historyTotal");
    const historySiteList = document.getElementById("historySiteList");
    const prevDayButton = document.getElementById("prevDay");
    const nextDayButton = document.getElementById("nextDay");
    const usageChart = document.getElementById("usageChart");

    let currentDateIndex = recentDates.length - 1;
    let storageData = {};
    let liveData = {};
    let refreshIntervalId = null;

    function renderTodayUsage() {
        const data = liveData[today] || {};
        const total = getDailyTotal(data);

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

    function renderHistoryDay() {
        const selectedDate = recentDates[currentDateIndex];
        const dayData = liveData[selectedDate] || {};
        const total = getDailyTotal(dayData);

        historyDateLabel.textContent = selectedDate;
        historyTotal.textContent = `Total: ${formatTime(total)} (${formatShortDate(selectedDate)})`;
        prevDayButton.disabled = currentDateIndex <= 0;
        nextDayButton.disabled = currentDateIndex >= recentDates.length - 1;

        historySiteList.innerHTML = "";

        const entries = Object.entries(dayData).sort((a, b) => b[1] - a[1]);

        if (!entries.length) {
            historySiteList.innerHTML = '<li class="empty-state">No website usage recorded for this day.</li>';
            return;
        }

        entries.forEach(([site, seconds]) => {
            const li = document.createElement("li");
            li.className = "history-site-row";
            li.innerHTML = `<span>${site}</span><span>${formatTime(seconds)}</span>`;
            historySiteList.appendChild(li);
        });
    }

    function renderStatistics() {
        renderHistoryDay();
        drawUsageChart(usageChart, liveData, recentDates);
    }

    function renderAll() {
        renderTodayUsage();
        if (!statsSection.classList.contains("hidden")) {
            renderStatistics();
        }
    }

    function applyLiveSessionTime(callback = () => {}) {
        chrome.storage.local.get([SESSION_STATE_KEY], (result) => {
            const sessionState = result[SESSION_STATE_KEY] || {};
            const lastTimestamp = sessionState.lastTimestamp;

            liveData = cloneStorageData(storageData);

            if (!lastTimestamp) {
                callback();
                return;
            }

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs && tabs[0];
                const activeDomain = activeTab && activeTab.url ? getTrackableDomain(activeTab.url) : null;

                if (!activeDomain || activeDomain !== sessionState.lastDomain) {
                    callback();
                    return;
                }

                const elapsedSeconds = Math.floor((Date.now() - lastTimestamp) / 1000);

                if (elapsedSeconds <= 0) {
                    callback();
                    return;
                }

                liveData[today] = liveData[today] || {};
                liveData[today][activeDomain] = (liveData[today][activeDomain] || 0) + elapsedSeconds;
                callback();
            });
        });
    }

    function refreshLiveView() {
        chrome.storage.local.get(null, (data) => {
            storageData = data || {};
            applyLiveSessionTime(renderAll);
        });
    }

    statsToggle.addEventListener("click", () => {
        const shouldShow = statsSection.classList.contains("hidden");
        statsSection.classList.toggle("hidden", !shouldShow);
        statsToggle.textContent = shouldShow ? "Hide Statistics" : "Show Statistics";
        statsToggle.setAttribute("aria-expanded", shouldShow ? "true" : "false");

        if (shouldShow) {
            renderStatistics();
        }
    });

    prevDayButton.addEventListener("click", () => {
        if (currentDateIndex > 0) {
            currentDateIndex -= 1;
            renderHistoryDay();
        }
    });

    nextDayButton.addEventListener("click", () => {
        if (currentDateIndex < recentDates.length - 1) {
            currentDateIndex += 1;
            renderHistoryDay();
        }
    });

    refreshLiveView();
    refreshIntervalId = setInterval(refreshLiveView, 1000);

    window.addEventListener("unload", () => {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
        }
    });
});