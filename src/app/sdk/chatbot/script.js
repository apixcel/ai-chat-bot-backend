(async function () {
  const BASE_URL = "http://localhost:5000/api/v1";
  const APP_SECRET = "__APP_SECRET__";
  const CSS_URL = "__CSS_URL__";

  // Auto-inject CSS once
  (function injectCSS() {
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      document.head.appendChild(link);
    }
  })();

  const messageSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
</svg>

`;

  const xSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>
`;

  class ChatBotSDK {
    constructor() {
      this.baseUrl = BASE_URL;
      this.token = null;
      this.expireAt = 0; // ms epoch
      this._refreshSkewMs = 60 * 1000; // refresh 60s early
      this.style = {
        bottom: "20px",
        right: "20px",
        color: "#615fff",
      };
      this.hostImg = `${this.baseUrl.split("/api/v1")[0]}/assets/customer_host.png`;
      this.hostName = "Customer Support";
      this.isChatBoxOpen = false;

      this.isQueryFetching = false;
    }
    _isExpired() {
      return !this.token || Date.now() >= this.expireAt - this._refreshSkewMs;
    }
    async _fetchToken() {
      const res = await fetch(`${this.baseUrl}/chat-bot/access-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appSecret: APP_SECRET }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Token request failed: ${res.status} ${text}`);
      }
      const json = await res.json();
      const { data } = json || {};
      if (!data?.token || !data?.expireAt) {
        throw new Error("Invalid token response");
      }
      this.token = data.token;
      this.expireAt = new Date(data.expireAt).getTime();
      return json.data;
    }
    async _ensureToken() {
      if (this._isExpired()) {
        await this._fetchToken();
      }
    }

    async getQueryResponse(query) {
      if (!query || !query.trim() || this.isQueryFetching) {
        return "";
      }
      this.isQueryFetching = true;
      await this._ensureToken();
      const res = await fetch(`${this.baseUrl}/chat-bot/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Query failed: ${res.status} ${text}`);
      }

      const json = await res.json();

      this.isQueryFetching = false;

      // Expecting: { success, statusCode, message, data: "query answer" }
      return json?.data ?? "Sorry, something went wrong! Please try again.";
    }

    async toggle() {
      const toggleBtn = document.getElementById("cb-toggle-btn");
      const chatWidget = document.querySelector(".cb-widget");
      if (!toggleBtn || !chatWidget) return;
      this.isChatBoxOpen = !this.isChatBoxOpen;
      toggleBtn.innerHTML = this.isChatBoxOpen ? xSvg : messageSvg;
      chatWidget.style.display = this.isChatBoxOpen ? "flex" : "none";
    }

    sendHostMessage(message) {
      if (!message || !message.trim()) return;
      const messageContainer = document.querySelector(".cb-messages");

      const innerHTML = `
        <div class="cb-host-message">
            <div class="cb-host-avatar"><img src="${this.hostImg}"/></div>
            <div class="cb-host-message-text" style="background: ${this.style.color}">${message}</div>
        </div>
      `;

      messageContainer.innerHTML += innerHTML;
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    async askQuery(query) {
      if (!query || !query.trim() || this.isQueryFetching) return;
      const messageContainer = document.querySelector(".cb-messages");
      const innerrHTML = `<div class="cb-guest-message">
      <span>${query}</span>
      </div>`;
      messageContainer.innerHTML += innerrHTML;
      messageContainer.scrollTop = messageContainer.scrollHeight;

      this.toggleHostTyping();
      const message = await this.getQueryResponse(query);
      this.sendHostMessage(message);

      this.toggleHostTyping();
    }

    async toggleHostTyping() {
      const messagesContainer = document.querySelector(".cb-messages");
      if (!messagesContainer) return;

      const typing = messagesContainer.querySelector("#cb-host-typing");
      if (typing) {
        typing.remove();
        return;
      }

      messagesContainer.innerHTML += `<div id="cb-host-typing">
  <span class="cb-host-typing-avatar"><img src="${this.hostImg}"/></span>
     <div class="cb-host-typing-content">
     <span class="cb-host-typing-text">${this.hostName} is typing...</span>
      <div class="cb-host-typing-dots">       
         <span class="cb-host-typing-dot"></span>
        <span class="cb-host-typing-dot"></span>
        <span class="cb-host-typing-dot"></span>
      </div>
     </div
      </div>`;
    }
    async render(host = "body") {
      const tokenRes = await this._fetchToken();
      if (!tokenRes) {
        return null;
      }
      this.token = tokenRes.token;
      this.expireAt = tokenRes.expireAt;

      const target = host === "body" ? document.body : document.querySelector(target);
      if (!target) {
        throw new Error(`Target "${target}" not found`);
      }

      // Wrapper
      const wrapper = document.createElement("div");
      wrapper.classList.add("cb-wrapper");
      wrapper.style.bottom = this.style.bottom;
      wrapper.style.right = this.style.right;

      // chat widget
      const widget = document.createElement("div");
      widget.classList.add("cb-widget");
      widget.style.display = "none";

      widget.innerHTML = `
        <div class="cb-widget-header" style="background: ${this.style.color}">
          <div class="cb-host">
            <span class="cb-host-avatar"><img src="${this.hostImg}"/></span>
            <span class="cb-host-name">${this.hostName}</span>
          </div>
        </div>
        <div class="cb-messages"></div>
        <form class="cb-input-form">
          <input class="cb-input" type="text" placeholder="Type your message..." name="cb_query" />
          <button class="cb-send" type="submit">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
</svg>
</button>
        </form>
      `;

      wrapper.appendChild(widget);
      wrapper.innerHTML += `<button type="button" id="cb-toggle-btn" class="cb-toggle" style="background: ${this.style.color}">${messageSvg}</button>`;

      target?.appendChild(wrapper);
      const btn = wrapper.querySelector("#cb-toggle-btn");
      btn.addEventListener("click", () => this.toggle());
      this.sendHostMessage(`Hi, I'm ${this.hostName}. How can I help you?`);
      const form = wrapper.querySelector(".cb-input-form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (this.isQueryFetching) return;
        const form = e.target;
        const inputValu = form.cb_query?.value;
        form.reset();

        if (inputValu) {
          await this.askQuery(inputValu);
        }
      });
    }
  }
  if (typeof window !== "undefined") {
    {
      await new ChatBotSDK().render();
    }
  }
})();
