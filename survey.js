// Survey flow: welcome -> per part [explanation -> one screen per item -> (if any item at/above
// threshold) follow-up questions with a reminder of endorsed items] -> end.

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

// Lead sentence + panel listing the behaviors the person endorsed (short labels).
function context(domain) {
  return el("div", { class: "context" }, [
    el("p", { class: "context-lead", text: domain.followupLead }),
    el("div", { class: "reminder" }, [
      el("ul", { class: "reminder-list" }, endorsed(domain).map(it =>
        el("li", {}, [icon(it.icon), el("span", { text: it.short || it.text })])))
    ])
  ]);
}

// One layout for the lead-in (n = -1) and every follow-up question, so nothing
// moves between them. On the lead-in the progress row, question and answers
// are present but invisible, and Next is shown; on questions Next is invisible.
function followupScreen(domain, q, n) {
  const isIntro = n < 0;
  const prev = data.followup[q.id];
  const options = q.options.map((label, idx) =>
    el("button", {
      class: "option" + (!isIntro && prev && prev.response === idx ? " selected" : ""),
      onclick: e => {
        data.followup[q.id] = { response: idx, label, rt_ms: Math.round(performance.now() - shownAt) };
        app.querySelectorAll(".option").forEach(b => b.classList.remove("selected"));
        e.currentTarget.classList.add("selected");
        advanceTimer = setTimeout(() => go(1), 250);
      }
    }, label));
  const hidden = isIntro ? { class: "center ghost", "aria-hidden": "true" } : { class: "center" };
  const progress = progressBar(Math.max(n, 0), domain.followup.length);
  if (isIntro) { progress.classList.add("ghost"); progress.setAttribute("aria-hidden", "true"); }
  const nextBtn = el("button", { class: "primary" + (isIntro ? "" : " ghost"), onclick: () => go(1) }, ["Next ", icon("arrow-right")]);
  if (!isIntro) { nextBtn.setAttribute("aria-hidden", "true"); nextBtn.tabIndex = -1; }
  return el("section", { class: "card" }, [
    progress,
    el("div", { class: "followup-layout" }, [
      context(domain),
      el("div", hidden, [
        el("div", { class: "q-block" }, [el("p", { class: "question", text: q.text })]),
        el("div", { class: "options" }, options)
      ])
    ]),
    el("div", { class: "row-between" }, [backButton(), nextBtn])
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
        el("div", { class: "q-block" }, [
          el("p", { class: "prompt", text: domain.screenerPrompt }),
          el("div", { class: "item-head" }, [icon(item.icon, "item-icon"), el("p", { class: "question", text: item.text })])
        ]),
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

  // Lead-in before a part's follow-up questions: the lead sentence and the
  // list of endorsed behaviors, then Next. It is built exactly like a question
  // screen with the question area kept invisible, so when the questions start
  // the sentence and list stay in the same place and the question appears below.
  followupIntro({ domain }) {
    return followupScreen(domain, domain.followup[0], -1);
  },

  question({ domain, q, n }) {
    return followupScreen(domain, q, n);
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
  const list = card.querySelector(".reminder");
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
// Keep the layout still between screens: give the question the height of the
// longest question of the same kind (all items, or all follow-ups) at the
// current width, so the prompt and answer buttons never move when a question
// wraps onto more lines. Stored in em so it scales with fitToCard.
// The question block (prompt + question) is bottom-aligned inside the reserved
// space, so the question always sits right above its answers and any spare
// space goes above it.
function reserveQuestionHeight() {
  const step = steps[current];
  if (step.type !== "item" && step.type !== "question" && step.type !== "followupIntro") return;
  const block = app.querySelector(".q-block");
  const prompt = block.querySelector(".prompt");
  const question = block.querySelector(".question");
  app.querySelector(".card").style.setProperty("--s", 1);
  block.style.minHeight = "";
  const originals = [prompt && prompt.textContent, question.textContent];
  const variants = step.type === "item"
    ? DOMAINS.flatMap(d => d.items.map(it => [d.screenerPrompt, it.text]))
    : DOMAINS.flatMap(d => d.followup.map(f => [null, f.text]));
  let max = 0;
  variants.forEach(([p, q]) => {
    if (prompt) prompt.textContent = p;
    question.textContent = q;
    max = Math.max(max, block.getBoundingClientRect().height);
  });
  if (prompt) prompt.textContent = originals[0];
  question.textContent = originals[1];
  block.style.minHeight = `${max / parseFloat(getComputedStyle(block).fontSize)}em`;
}

function layout() {
  reserveQuestionHeight();
  fitToCard();
}
window.addEventListener("resize", layout);

function render() {
  const step = steps[current];
  const card = screens[step.type](step);
  if (step.domain) card.prepend(partHeader(step.domain));
  app.replaceChildren(card);
  shownAt = performance.now();
  layout();
  const focusTarget = app.querySelector(step.type === "question" ? ".q-block .question" : "h1, .context-lead, .prompt, .question");
  if (focusTarget) { focusTarget.setAttribute("tabindex", "-1"); focusTarget.focus({ preventScroll: true }); }
}

render();
