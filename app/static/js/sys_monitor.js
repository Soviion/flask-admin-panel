const logContainer = document.getElementById("log-container");
const evt = new EventSource("/api/bot-logs");

evt.onmessage = function(e) {
    const line = document.createElement("div");
    line.className = "log-line";
    line.textContent = e.data;
    logContainer.appendChild(line);
    logContainer.scrollTop = logContainer.scrollHeight;
};