const SESSION_STATE_KEY = "__sessionState";
const FAVICON_CACHE_KEY = "__faviconCache";

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs}h ${mins}m ${secs}s`;
}

function formatHours(seconds) {
    const hours = seconds / 3600;
    return `${hours.toFixed(1)}h`;
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
        Object.entries(storageData)
            .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
            .map(([date, dayData]) => [date, { ...(dayData || {}) }])
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

function getDefaultFaviconUrl(domain) {
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`;
}

function drawUsageChart(canvas, statsByDate, dates, hoveredBarIndex = -1) {
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    context.clearRect(0, 0, width, height);

    const totals = dates.map((date) => getDailyTotal(statsByDate[date]));
    const maxValue = Math.max(...totals, 1);
    const yAxisSteps = 4;
    const roundedMaxHours = Math.max(1, Math.ceil(maxValue / 3600));
    const maxSecondsForAxis = roundedMaxHours * 3600;

    const leftPadding = 50;
    const rightPadding = 12;
    const topPadding = 20;
    const bottomPadding = 32;
    const chartHeight = height - topPadding - bottomPadding;
    const chartWidth = width - leftPadding - rightPadding;
    const barGap = 6;
    const barWidth = Math.max(8, chartWidth / dates.length - barGap);

    context.strokeStyle = "#d0cfe0";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(leftPadding, topPadding);
    context.lineTo(leftPadding, height - bottomPadding);
    context.lineTo(width - rightPadding, height - bottomPadding);
    context.stroke();

    context.fillStyle = "#625b71";
    context.font = "10px Segoe UI";
    context.textAlign = "right";

    for (let step = 0; step <= yAxisSteps; step += 1) {
        const y = topPadding + (step / yAxisSteps) * chartHeight;
        const stepValueInHours = roundedMaxHours * ((yAxisSteps - step) / yAxisSteps);

        context.strokeStyle = "#ebe7f9";
        context.beginPath();
        context.moveTo(leftPadding, y);
        context.lineTo(width - rightPadding, y);
        context.stroke();

        context.fillText(`${stepValueInHours.toFixed(1)}h`, leftPadding - 6, y + 3);
    }

    context.save();
    context.translate(14, height / 2);
    context.rotate(-Math.PI / 2);
    context.fillStyle = "#625b71";
    context.font = "10px Segoe UI";
    context.textAlign = "center";
    context.fillText("Time Duration (Hours)", 0, 0);
    context.restore();

    totals.forEach((value, index) => {
        const barHeight = Math.round((value / maxSecondsForAxis) * chartHeight);
        const x = leftPadding + index * (barWidth + barGap);
        const y = height - bottomPadding - barHeight;

        context.fillStyle = index === hoveredBarIndex ? "#4d3b87" : "#6750a4";
        context.fillRect(x, y, barWidth, barHeight);

        context.fillStyle = "#625b71";
        context.font = "10px Segoe UI";
        context.textAlign = "center";
        context.fillText(formatShortDate(dates[index]).replace(" ", "/"), x + barWidth / 2, height - 12);
    });

    return {
        bars: totals.map((value, index) => {
            const barHeight = Math.round((value / maxSecondsForAxis) * chartHeight);
            const x = leftPadding + index * (barWidth + barGap);
            const y = height - bottomPadding - barHeight;
            return {
                index,
                x,
                y,
                width: barWidth,
                height: barHeight,
                total: value
            };
        })
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    const recentDates = getRecentDates(7);

    const dailyView = document.getElementById("dailyView");
    const statsView = document.getElementById("statsView");
    const chartView = document.getElementById("chartView");

    const totalTimeDiv = document.getElementById("totalTime");
    const siteList = document.getElementById("siteList");
    const historyDateLabel = document.getElementById("historyDateLabel");
    const historyTotal = document.getElementById("historyTotal");
    const historySiteList = document.getElementById("historySiteList");
    const prevDayButton = document.getElementById("prevDay");
    const nextDayButton = document.getElementById("nextDay");
    const usageChart = document.getElementById("usageChart");
    const chartHoverTotal = document.getElementById("chartHoverTotal");

    const showStatsButton = document.getElementById("showStats");
    const toDailyFromStats = document.getElementById("toDailyFromStats");
    const toChartButton = document.getElementById("toChart");
    const toStatsFromChart = document.getElementById("toStatsFromChart");
    const toDailyFromChart = document.getElementById("toDailyFromChart");

    let currentDateIndex = recentDates.length - 1;
    let storageData = {};
    let liveData = {};
    let faviconCache = {};
    let refreshIntervalId = null;
    let hoveredBarIndex = -1;
    let chartBars = [];

    function showView(viewName) {
        dailyView.classList.toggle("hidden", viewName !== "daily");
        statsView.classList.toggle("hidden", viewName !== "stats");
        chartView.classList.toggle("hidden", viewName !== "chart");

        if (viewName === "stats") {
            renderHistoryDay();
        }

        if (viewName === "chart") {
            const chartData = drawUsageChart(usageChart, liveData, recentDates, hoveredBarIndex);
            chartBars = chartData.bars;
        }
    }

    function getFavicon(site) {
        return faviconCache[site] || getDefaultFaviconUrl(site);
    }

    function createSiteItem(site, seconds, totalSeconds) {
        const percentage = totalSeconds > 0 ? ((seconds / totalSeconds) * 100).toFixed(1) : 0;
        const li = document.createElement("li");
        li.className = "site-row";

        li.innerHTML = `
            <div class="site-meta">
                <div class="site-headline">
                    <img class="site-icon" src="${getFavicon(site)}" alt="${site} icon" referrerpolicy="no-referrer">
                    <span class="site-title">${site}</span>
                </div>
                <span>Usage: ${percentage}%</span>
            </div>
            <span class="site-time">${formatTime(seconds)}</span>
        `;

        return li;
    }

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
            siteList.appendChild(createSiteItem(site, seconds, total));
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
            li.innerHTML = `
                <div class="site-headline">
                    <img class="site-icon" src="${getFavicon(site)}" alt="${site} icon" referrerpolicy="no-referrer">
                    <span class="site-title">${site}</span>
                </div>
                <span>${formatTime(seconds)}</span>
            `;
            historySiteList.appendChild(li);
        });
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

    function updateFaviconCache(done = () => {}) {
        chrome.tabs.query({}, (tabs) => {
            const updatedCache = { ...faviconCache };

            (tabs || []).forEach((tab) => {
                const domain = tab.url ? getTrackableDomain(tab.url) : null;
                if (!domain) {
                    return;
                }

                if (tab.favIconUrl) {
                    updatedCache[domain] = tab.favIconUrl;
                } else if (!updatedCache[domain]) {
                    updatedCache[domain] = getDefaultFaviconUrl(domain);
                }
            });

            faviconCache = updatedCache;
            chrome.storage.local.set({ [FAVICON_CACHE_KEY]: faviconCache }, done);
        });
    }

    function refreshLiveView() {
        chrome.storage.local.get(null, (data) => {
            storageData = data || {};
            faviconCache = storageData[FAVICON_CACHE_KEY] || {};
            updateFaviconCache(() => {
                applyLiveSessionTime(() => {
                    renderTodayUsage();
                    if (!statsView.classList.contains("hidden")) {
                        renderHistoryDay();
                    }
                    if (!chartView.classList.contains("hidden")) {
                        const chartData = drawUsageChart(usageChart, liveData, recentDates, hoveredBarIndex);
                        chartBars = chartData.bars;
                    }
                });
            });
        });
    }

    usageChart.addEventListener("mousemove", (event) => {
        const rect = usageChart.getBoundingClientRect();
        const scaleX = usageChart.width / rect.width;
        const scaleY = usageChart.height / rect.height;
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        const hoveredBar = chartBars.find((bar) => {
            if (bar.height === 0) {
                return false;
            }

            return mouseX >= bar.x && mouseX <= bar.x + bar.width && mouseY >= bar.y && mouseY <= bar.y + bar.height;
        });

        const nextHoverIndex = hoveredBar ? hoveredBar.index : -1;

        if (nextHoverIndex !== hoveredBarIndex) {
            hoveredBarIndex = nextHoverIndex;
            const chartData = drawUsageChart(usageChart, liveData, recentDates, hoveredBarIndex);
            chartBars = chartData.bars;
        }

        if (hoveredBar) {
            chartHoverTotal.textContent = `${recentDates[hoveredBar.index]}: ${formatTime(hoveredBar.total)} (${formatHours(hoveredBar.total)})`;
        } else {
            chartHoverTotal.textContent = "Hover a bar to see the day's total usage.";
        }
    });

    usageChart.addEventListener("mouseleave", () => {
        hoveredBarIndex = -1;
        const chartData = drawUsageChart(usageChart, liveData, recentDates, hoveredBarIndex);
        chartBars = chartData.bars;
        chartHoverTotal.textContent = "Hover a bar to see the day's total usage.";
    });

    showStatsButton.addEventListener("click", () => {
        showView("stats");
    });

    toDailyFromStats.addEventListener("click", () => {
        showView("daily");
    });

    toChartButton.addEventListener("click", () => {
        showView("chart");
    });

    toStatsFromChart.addEventListener("click", () => {
        showView("stats");
    });

    toDailyFromChart.addEventListener("click", () => {
        showView("daily");
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
