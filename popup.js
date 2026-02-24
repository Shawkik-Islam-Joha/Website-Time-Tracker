function formatTime(seconds) {
    let hrs = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
}

document.addEventListener("DOMContentLoaded", () => {

    let today = new Date().toISOString().split("T")[0];

    chrome.storage.local.get([today], (result) => {
        let data = result[today] || {};
        let total = 0;

        for (let site in data) {
            total += data[site];
        }

        document.getElementById("totalTime").textContent =
            "Total: " + formatTime(total);

        let siteList = document.getElementById("siteList");
        siteList.innerHTML = "";

        for (let site in data) {
            let li = document.createElement("li");
            li.textContent = site + " - " + formatTime(data[site]);
            siteList.appendChild(li);
        }
    });
});