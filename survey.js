// Survey flow: welcome -> per domain [intro -> screens of items rated on a frequency scale
// -> (if any item at/above threshold) reminder + follow-up questions] -> end.

const app = document.getElementById("app");

const data = {
  started_at: new Date().toISOString(),
  user_agent: navigator.userAgent,
  screener: {},   // item id -> { response: index into screenerOptions, label, rt_ms (since screen shown) }
  followup: {},   // question id -> { response: index 0-3, label, rt_ms }
  finished_at: null
};

// Build the full list of steps up front; follow-up steps are skipped at
// render time when nothing in their domain was endorsed.
const steps = [{ type: "welcome" }];
DOMAINS.forEach(domain => {
  steps.push({ type: "intro", domain });
  const size = domain.itemsPerScreen;
  const screenCount = Math.ceil(domain.items.length / size);
  for (let n = 0; n < screenCount; n++) {
    const items = domain.items.slice(n * size, (n + 1) * size);
    steps.push(size === 1
      ? { type: "item", domain, item: items[0], n, screenCount }
      : { type: "itemGroup", domain, items, n, screenCount });
  }
  steps.push({ type: "followupIntro", domain });
  domain.followup.forEach((q, n) => steps.push({ type: "question", domain, q, n }));
});
steps.push({ type: "end" });

let current = 0;
let shownAt = 0;
let advanceTimer = null;

function endorsed(domain) {
  return domain.items.filter(it => data.screener[it.id] && data.screener[it.id].response >= domain.endorseThreshold);
}

function isSkipped(step) {
  return (step.type === "followupIntro" || step.type === "question") && endorsed(step.domain).length === 0;
}

function go(direction) {
  clearTimeout(advanceTimer);
  let next = current + direction;
  while (next > 0 && next < steps.length - 1 && isSkipped(steps[next])) next += direction;
  current = Math.max(0, Math.min(steps.length - 1, next));
  render();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  [].concat(children).forEach(c => c && node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return node;
}

function icon(name, cls = "") {
  return el("i", { class: `ti ti-${name} ${cls}`, "aria-hidden": "true" });
}

// Progress within the current part: thin bar with "3 of 12" on the same row.
function progressBar(done, total, label = `${done + 1} of ${total}`) {
  const pct = Math.round((done / total) * 100);
  return el("div", { class: "progress-row" }, [
    el("div", { class: "progress", role: "progressbar", "aria-valuenow": pct, "aria-valuemin": 0, "aria-valuemax": 100 },
      el("div", { class: "progress-fill", style: `width:${pct}%` })),
    el("span", { class: "meta", text: label })
  ]);
}

function backButton() {
  return el("button", { class: "link-btn", onclick: () => go(-1) }, [icon("arrow-left"), " Back"]);
}

// Numbered part markers 1..TOTAL_PARTS. Only the current part's title is shown;
// upcoming parts are numbers only.
function partSteps(currentIndex) {
  return el("div", { class: "parts-steps", "aria-hidden": "true" },
    Array.from({ length: TOTAL_PARTS }, (_, i) =>
      el("span", { class: i < currentIndex ? "done" : i === currentIndex ? "current" : "" },
        i < currentIndex ? icon("check") : String(i + 1))));
}

function partHeader(domain) {
  const i = DOMAINS.indexOf(domain);
  return el("div", { class: "parts" }, [
    el("p", { class: "parts-label" }, [
      `Part ${i + 1} of ${TOTAL_PARTS} · `,
      el("strong", { text: domain.title })
    ]),
    partSteps(i)
  ]);
}

function reminder(domain) {
  return el("div", { class: "reminder" }, [
    el("p", { class: "reminder-title", text: domain.reminderTitle }),
    el("ul", { class: "reminder-list" }, endorsed(domain).map(it =>
      el("li", {}, [icon(it.icon), el("span", { text: it.short || it.text })])))
  ]);
}

const screens = {
  welcome() {
    return el("section", { class: "card" }, [
      el("h1", { text: WELCOME.title }),
      ...WELCOME.text.map(t => el("p", { text: t })),
      el("button", { class: "primary", onclick: () => go(1) }, ["Start ", icon("arrow-right")])
    ]);
  },

  intro({ domain }) {
    return el("section", { class: "card" }, [
      el("h1", { text: domain.title }),
      ...domain.intro.map(t => el("p", { text: t })),
      el("div", { class: "row-between" }, [
        backButton(),
        el("button", { class: "primary", onclick: () => go(1) }, ["Continue ", icon("arrow-right")])
      ])
    ]);
  },

  item({ domain, item, n, screenCount }) {
    const prev = data.screener[item.id];
    const options = domain.screenerOptions.map((label, idx) =>
      el("button", {
        class: "option" + (prev && prev.response === idx ? " selected" : ""),
        onclick: e => {
          data.screener[item.id] = { response: idx, label, rt_ms: Math.round(performance.now() - shownAt) };
          app.querySelectorAll(".option").forEach(b => b.classList.remove("selected"));
          e.currentTarget.classList.add("selected");
          advanceTimer = setTimeout(() => go(1), 250);
        }
      }, label));
    return el("section", { class: "card" }, [
      progressBar(n, screenCount),
      el("div", { class: "center" }, [
        el("p", { class: "prompt", text: domain.screenerPrompt }),
        el("div", { class: "item-head" }, [icon(item.icon, "item-icon"), el("p", { class: "question", text: item.text })]),
        el("div", { class: "options" }, options)
      ]),
      backButton()
    ]);
  },

  itemGroup({ domain, items, n, screenCount }) {
    const error = el("p", { class: "error", role: "alert" });
    const rows = items.map(item => {
      const chips = domain.screenerOptions.map((label, idx) => {
        const prev = data.screener[item.id];
        return el("button", {
          class: "chip" + (prev && prev.response === idx ? " selected" : ""),
          "aria-pressed": prev && prev.response === idx ? "true" : "false",
          onclick: e => {
            data.screener[item.id] = { response: idx, label, rt_ms: Math.round(performance.now() - shownAt) };
            e.currentTarget.parentNode.querySelectorAll(".chip").forEach(b => {
              b.classList.remove("selected"); b.setAttribute("aria-pressed", "false");
            });
            e.currentTarget.classList.add("selected");
            e.currentTarget.setAttribute("aria-pressed", "true");
            e.currentTarget.closest(".rate-row").classList.remove("missing");
            if (items.every(it => data.screener[it.id])) error.textContent = "";
          }
        }, label);
      });
      return el("div", { class: "rate-row", "data-id": item.id }, [
        el("div", { class: "rate-label" }, [icon(item.icon), el("span", { text: item.text })]),
        el("div", { class: "chips", role: "group", "aria-label": item.text }, chips)
      ]);
    });
    const next = () => {
      const missing = items.filter(it => !data.screener[it.id]);
      if (missing.length) {
        missing.forEach(it => app.querySelector(`[data-id="${it.id}"]`).classList.add("missing"));
        error.textContent = "Rate every item to continue";
        return;
      }
      go(1);
    };
    return el("section", { class: "card" }, [
      progressBar(n, screenCount, `Screen ${n + 1} of ${screenCount}`),
      el("p", { class: "question", text: domain.screenerPrompt }),
      ...rows,
      error,
      el("div", { class: "row-between" }, [
        backButton(),
        el("button", { class: "primary", onclick: next }, [n === screenCount - 1 ? "Continue " : "Next ", icon("arrow-right")])
      ])
    ]);
  },

  followupIntro({ domain }) {
    return el("section", { class: "card" }, [
      el("p", { text: domain.endorsedIntro }),
      el("ul", { class: "endorsed-list" }, endorsed(domain).map(it => el("li", {}, [
        icon(it.icon), el("span", { text: it.text }), el("span", { class: "freq-tag", text: data.screener[it.id].label })
      ]))),
      el("p", { class: "strong", text: domain.followupIntro }),
      el("div", { class: "row-between" }, [
        backButton(),
        el("button", { class: "primary", onclick: () => go(1) }, ["Continue ", icon("arrow-right")])
      ])
    ]);
  },

  question({ domain, q, n }) {
    const prev = data.followup[q.id];
    const options = q.options.map((label, idx) =>
      el("button", {
        class: "option" + (prev && prev.response === idx ? " selected" : ""),
        onclick: e => {
          data.followup[q.id] = { response: idx, label, rt_ms: Math.round(performance.now() - shownAt) };
          app.querySelectorAll(".option").forEach(b => b.classList.remove("selected"));
          e.currentTarget.classList.add("selected");
          advanceTimer = setTimeout(() => go(1), 250);
        }
      }, label));
    return el("section", { class: "card" }, [
      progressBar(n, domain.followup.length),
      // Short-label reminder chips above the question.
      el("div", { class: "followup-layout" }, [
        reminder(domain),
        el("div", { class: "center" }, [
          el("p", { class: "question", text: q.text }),
          el("div", { class: "options" }, options)
        ])
      ]),
      backButton()
    ]);
  },

  end() {
    data.finished_at = new Date().toISOString();
    const download = () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = el("a", { href: URL.createObjectURL(blob), download: `responses_${Date.now()}.json` });
      a.click();
    };
    return el("section", { class: "card" }, [
      el("h1", { text: END.title }),
      el("p", { text: END.text }),
      // Pilot only: no data is sent anywhere yet.
      el("button", { class: "secondary", onclick: download }, [icon("download"), " Download responses (pilot)"])
    ]);
  }
};

// Keep the frame a fixed size and never scroll: if this screen's content is
// taller than the card, shrink the card's text scale step by step until it fits.
// The reminder list shrinks first (down to 80%), so the question and answer
// buttons keep their full size; only then does the whole card scale down.
function fitToCard() {
  const card = app.querySelector(".card");
  if (!card) return;
  const overflows = () => card.scrollHeight > card.clientHeight + 1;
  const list = card.querySelector(".reminder, .endorsed-list");
  let s = 1;
  card.style.setProperty("--s", s);
  if (list) {
    let r = 1;
    list.style.fontSize = "";
    while (overflows() && r > 0.8) {
      r = Math.round((r - 0.04) * 100) / 100;
      list.style.fontSize = `${r}em`;
    }
  }
  while (overflows() && s > 0.6) {
    s = Math.round((s - 0.04) * 100) / 100;
    card.style.setProperty("--s", s);
  }
}
window.addEventListener("resize", fitToCard);
app.addEventListener("toggle", fitToCard, true);

function render() {
  const step = steps[current];
  const card = screens[step.type](step);
  if (step.domain) card.prepend(partHeader(step.domain));
  app.replaceChildren(card);
  shownAt = performance.now();
  fitToCard();
  const focusTarget = app.querySelector("h1, .prompt, .question, .eyebrow");
  if (focusTarget) { focusTarget.setAttribute("tabindex", "-1"); focusTarget.focus({ preventScroll: true }); }
}

render();
