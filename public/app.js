// FAQBot - Azure OpenAI
// Smart FAQ Assistant

const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatBox = document.getElementById("chatBox");
const systemPrompt = document.getElementById("systemPrompt");

// Add message to chat
function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.classList.add("message", type);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

// Send message to Azure OpenAI
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Show user message
  addMessage(message, "user");
  userInput.value = "";
  sendBtn.disabled = true;

  // Show loading
  const loadingMsg = addMessage(" Thinking...", "loading");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        systemPrompt: systemPrompt.value,
      }),
    });

    const data = await response.json();
    
    console.log("HTTP Status:", response.status);
    console.log("Response:", data);

    // Remove loading message
    chatBox.removeChild(loadingMsg);

    if (data.reply) {
      addMessage(data.reply, "bot");
    } else if (data.error) {
      addMessage("Error: " + data.error, "bot");
    } else {
      addMessage("Unknown error occurred.", "bot");
    }
  } catch (error) {
    chatBox.removeChild(loadingMsg);
    addMessage("Error connecting to server. Please refresh.", "bot");
  }

  sendBtn.disabled = false;
}

// Send on button click
sendBtn.addEventListener("click", sendMessage);

// Send on Enter key
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
