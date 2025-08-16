// sdk-template.js
(function () {
  const BASE_URL = "http://localhost:5000/api/v1";
  const APP_SECRET = "__APP_SECRET__"; // injected on the server
  const CSS_URL = "__CSS_URL__"; // injected on the server

  // Auto-inject CSS once
  (function injectCSS() {
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      document.head.appendChild(link);
    }
  })();

  let token = null;
  class ChatBotSDK {
    constructor(options = {}) {
      this.baseUrl = options.baseUrl || BASE_URL;
      this.token = null;
      this.expireAt = 0; // ms epoch
      this._refreshSkewMs = 60 * 1000; // refresh 60s early
    }

    /** Internal: do we need a fresh token? */
    _isExpired() {
      return !this.token || Date.now() >= this.expireAt - this._refreshSkewMs;
    }

    /** Internal: fetch and cache token */
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
    }

    /** Ensure we have a valid token (refresh if needed) */
    async _ensureToken() {
      if (this._isExpired()) {
        await this._fetchToken();
      }
    }

    /** Public: send a query; returns the chatbot text answer */
    async send(query) {
      if (!query || !query.trim()) {
        return "";
      }
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
      // Expecting: { success, statusCode, message, data: "query answer" }
      return json?.data ?? "";
    }

    /** Optional UI: render a floating chat widget */
    async render(target = "body") {
      const tokenRes = await _fetchToken();
      if (!tokenRes) {
        return null;
      }
      this.token = tokenRes.token;
      this.expireAt = tokenRes.expireAt;

      const host = target === "body" ? document.body : document.querySelector(target);
      if (!host) {
        throw new Error(`Target "${target}" not found`);
      }

      // Container
      const wrapper = document.createElement("div");
      wrapper.className = "cb-wrapper";
      wrapper.innerHTML = `
        <div class="cb-widget">
          <div class="cb-header">Chat Bot</div>
          <div class="cb-messages" aria-live="polite"></div>
          <div class="cb-input-row">
            <input class="cb-input" type="text" placeholder="Type your message..." />
            <button class="cb-send">Send</button>
          </div>
        </div>
      `;
      host.appendChild(wrapper);

      const messagesEl = wrapper.querySelector(".cb-messages");
      const inputEl = wrapper.querySelector(".cb-input");
      const sendBtn = wrapper.querySelector(".cb-send");

      const pushMsg = (role, text) => {
        const item = document.createElement("div");
        item.className = `cb-msg cb-msg-${role}`;
        item.textContent = text;
        messagesEl.appendChild(item);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      };

      const setLoading = (loading) => {
        if (loading) {
          if (!wrapper.querySelector(".cb-loading")) {
            const l = document.createElement("div");
            l.className = "cb-loading";
            l.textContent = "Thinking…";
            messagesEl.appendChild(l);
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
        } else {
          const l = wrapper.querySelector(".cb-loading");
          if (l) {
            l.remove();
          }
        }
      };

      const doSend = async () => {
        const q = inputEl.value.trim();
        if (!q) {
          return;
        }
        inputEl.value = "";
        pushMsg("user", q);
        setLoading(true);
        try {
          const answer = await this.send(q);
          setLoading(false);
          pushMsg("bot", answer || "(No answer)");
        } catch (e) {
          setLoading(false);
          pushMsg("error", e.message || "Something went wrong");
        }
      };

      sendBtn.addEventListener("click", doSend);
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          doSend();
        }
      });

      // Pre-warm token (non-blocking)
      this._ensureToken().catch(() => {
        // ignore; will fetch on first send
      });
    }
  }

  // UMD-ish export
  if (typeof window !== "undefined") {
    window.ChatBotSDK = ChatBotSDK;
  }
})();
