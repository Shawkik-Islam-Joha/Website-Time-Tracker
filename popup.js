function formatTime(seconds) {
    let hrs = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;

    return `${hrs}h ${mins}m ${secs}s`;
}

document.addEventListener("DOMContentLoaded", () => {

    let today = new Date().toISOString().split("T")[0];

    const totalTimeDiv = document.getElementById("totalTime");
    const siteList = document.getElementById("siteList");
    const resetBtn = document.getElementById("resetBtn");

    function loadData() {

        chrome.storage.local.get([today], (result) => {

            let data = result[today] || {};
            let total = 0;

            // Calculate total time
            for (let site in data) {
                total += data[site];
            }

            totalTimeDiv.textContent = "Total Today: " + formatTime(total);

            siteList.innerHTML = "";

            // Display each site with percentage
            for (let site in data) {

                let seconds = data[site];
                let percentage = total > 0
                    ? ((seconds / total) * 100).toFixed(1)
                    : 0;

                let li = document.createElement("li");

                li.innerHTML = `
                    <strong>${site}</strong><br>
                    Time: ${formatTime(seconds)}<br>
                    Usage: ${percentage}%
                `;

                siteList.appendChild(li);
            }
        });
    }

    // Reset button logic
    resetBtn.addEventListener("click", () => {
        chrome.storage.local.remove(today, () => {
            loadData();
        });
    });

    loadData();
});