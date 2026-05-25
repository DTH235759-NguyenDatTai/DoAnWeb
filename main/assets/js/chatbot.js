// Chatbot frontend: mo/dong widget, hien thi tin nhan va goi API PHP.
(function () {
    const currentScript = document.currentScript;
    const API_URL = currentScript
        ? new URL("../../api/ai_chatbot.php", currentScript.src).toString()
        : "../api/ai_chatbot.php";

    let isReady = false;

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function addMessage(sender, text) {
        const messages = document.getElementById("chatbotMessages");
        if (!messages) return null;

        const row = document.createElement("div");
        row.className = "chatbot-row " + (sender === "user" ? "user" : "bot");
        row.innerHTML = `
            <div class="chatbot-bubble">
                <span class="chatbot-name">${sender === "user" ? "Bạn" : "Bot tư vấn"}</span>
                <p class="chatbot-text">${escapeHtml(text)}</p>
            </div>
        `;

        messages.appendChild(row);
        messages.scrollTop = messages.scrollHeight;
        return row;
    }

    function setLoading(isLoading) {
        const input = document.getElementById("chatbotInput");
        const send = document.getElementById("chatbotSend");
        const quickButtons = document.querySelectorAll(".chatbot-quick-btn");

        if (input) input.disabled = isLoading;
        if (send) send.disabled = isLoading;
        quickButtons.forEach((button) => {
            button.disabled = isLoading;
        });
    }

    async function askChatbot(question) {
        const cleanQuestion = question.trim();
        if (!cleanQuestion) return;

        addMessage("user", cleanQuestion);
        const loadingRow = addMessage("bot", "Đang tìm trong dữ liệu cửa hàng...");
        setLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ question: cleanQuestion })
            });

            const data = await response.json();
            const answer = data && data.answer
                ? data.answer
                : "Xin lỗi, hiện tại tôi chưa có thông tin về nội dung này.";

            if (loadingRow) loadingRow.remove();
            addMessage("bot", answer);
        } catch (error) {
            if (loadingRow) loadingRow.remove();
            addMessage("bot", "Không gọi được API chatbot. Bạn kiểm tra lại đường dẫn /api/ai_chatbot.php và Vertrigo Server nhé.");
            console.error("Lỗi chatbot:", error);
        } finally {
            setLoading(false);
            const input = document.getElementById("chatbotInput");
            if (input) input.focus();
        }
    }

    window.initChatbot = function initChatbot() {
        if (isReady) return;

        const fab = document.getElementById("chatbotFab");
        const widget = document.getElementById("chatbotWidget");
        const close = document.getElementById("chatbotClose");
        const form = document.getElementById("chatbotForm");
        const input = document.getElementById("chatbotInput");

        if (!fab || !widget || !form || !input) return;

        fab.addEventListener("click", () => {
            widget.classList.toggle("hidden");
            widget.setAttribute("aria-hidden", widget.classList.contains("hidden") ? "true" : "false");
            if (!widget.classList.contains("hidden")) input.focus();
        });

        if (close) {
            close.addEventListener("click", () => {
                widget.classList.add("hidden");
                widget.setAttribute("aria-hidden", "true");
            });
        }

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const question = input.value;
            input.value = "";
            askChatbot(question);
        });

        document.querySelectorAll(".chatbot-quick-btn").forEach((button) => {
            button.addEventListener("click", () => {
                askChatbot(button.dataset.chatbotMessage || button.textContent || "");
            });
        });

        addMessage("bot", "Xin chào! Bạn có thể hỏi tôi về sản phẩm, giá, tồn kho, mô tả hoặc chính sách cửa hàng.");
        isReady = true;
    };

    document.addEventListener("DOMContentLoaded", window.initChatbot);
})();
