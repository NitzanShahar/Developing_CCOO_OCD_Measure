// Survey flow: welcome -> per domain [intro -> one card per item -> (if any "yes") reminder + follow-up questions] -> end.

const app = document.getElementById("app");

const data = {
  started_at: new Date().toISOString(),
  user_agent: navigator.userAgent,
  screener: {},   // item id -> { response: 1 | 0, rt_ms }
  followup: {},   // question id -> { response: index 0-3, label, rt_ms }
  finished_at: null
};

// Build the full list of steps up front; follow-up steps are skipped at
// render time when nothing in their domain was endorsed.
const steps = [{ type: "welcome" }];
DOMAINS.forEach(domain => {
  steps.push({ type: "intro", domain });
  domain.items.forEach((item, n) => steps.push({ type: "item", domain, item, n }));
  steps.push({ type: "followupIntro", domain });
  domain.followup.forEach((q, n) => steps.push({ type: "question", domain, q, n }));
});
steps.push({ type: "end" });

let current = 0;
let shownAt = 0;
let advanceTimer = null;

function endorsed(domain) {
  return domain.items.filter(it => data.screener[it.id] && data.screener[it.id].response === 1);
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

function progressBar(done, total) {
  const pct = Math.round((done / total) * 100);
  return el("div", { class: "progress", role: "progressbar", "aria-valuenow": pct, "aria-valuemin": 0, "aria-valuemax": 100 },
    el("div", { class: "progress-fill", style: `width:${pct}%` }));
}

function backButton() {
  return el("button", { class: "link-btn", onclick: () => go(-1) }, [icon("arrow-left"), " Back"]);
}

function reminder(domain) {
  return el("details", { class: "reminder" }, [
    el("summary", { text: `Your ${domain.title.toLowerCase()} behaviors (${endorsed(domain).length})` }),
    el("ul", {}, endorsed(domain).map(it => el("li", { text: it.text })))
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
      el("p", { class: "eyebrow", text: domain.title }),
      ...domain.intro.map(t => el("p", { text: t })),
      el("div", { class: "row-between" }, [
        backButton(),
        el("button", { class: "primary", onclick: () => go(1) }, ["Continue ", icon("arrow-right")])
      ])
    ]);
  },

  item({ domain, item, n }) {
    const prev = data.screener[item.id];
    const answer = response => {
      data.screener[item.id] = { response, rt_ms: Math.round(performance.now() - shownAt) };
      go(1);
    };
    return el("section", { class: "card item-card" }, [
      progressBar(n, domain.items.length),
      el("p", { class: "meta", text: `${n + 1} of ${domain.items.length}` }),
      el("p", { class: "prompt", text: domain.screenerCardPrompt }),
      el("div", { class: "item-body" }, [
        icon(item.icon, "item-icon"),
        el("p", { class: "item-text", text: item.text })
      ]),
      el("div", { class: "yn" }, [
        el("button", { class: "choice" + (prev && prev.response === 0 ? " selected" : ""), onclick: () => answer(0) }, "No"),
        el("button", { class: "choice" + (prev && prev.response === 1 ? " selected" : ""), onclick: () => answer(1) }, "Yes")
      ]),
      backButton()
    ]);
  },

  followupIntro({ domain }) {
    return el("section", { class: "card" }, [
      el("p", { class: "eyebrow", text: domain.title }),
      el("p", { text: "You said you frequently repeat or double-check the following:" }),
      el("ul", { class: "endorsed-list" }, endorsed(domain).map(it => el("li", {}, [icon(it.icon), el("span", { text: it.text })]))),
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
      el("p", { class: "meta", text: `${n + 1} of ${domain.followup.length}` }),
      reminder(domain),
      el("p", { class: "question", text: q.text }),
      el("div", { class: "options" }, options),
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

function render() {
  const step = steps[current];
  app.replaceChildren(screens[step.type](step));
  shownAt = performance.now();
  window.scrollTo(0, 0);
  const focusTarget = app.querySelector("h1, .prompt, .question, .eyebrow");
  if (focusTarget) { focusTarget.setAttribute("tabindex", "-1"); focusTarget.focus({ preventScroll: true }); }
}

render();
