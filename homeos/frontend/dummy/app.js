// app.js
// ============ DUMMY DATA ============
const AGENTS = [
  { id: 'coordinator', name: 'Coordinator Agent', icon: '◉' },
  { id: 'pantry', name: 'Pantry Agent', icon: '▣' },
  { id: 'waste', name: 'Waste Agent', icon: '⚠' },
  { id: 'meal', name: 'Meal Planning Agent', icon: '◈' },
  { id: 'budget', name: 'Budget Agent', icon: '$' },
  { id: 'reflection', name: 'Reflection Agent', icon: '↻' },
  { id: 'reporting', name: 'Reporting Agent', icon: '▤' },
];

const PANTRY_CATEGORIES = {
  Staples: ['Rice'],
  Vegetables: ['Carrots'],
  Protein: ['Eggs'],
  Condiments: ['Soy Sauce'],
};

const WASTE_RISK = [
  { item: 'Carrots', level: 'high', reason: 'Perishable · 3 days shelf life' },
  { item: 'Eggs', level: 'medium', reason: 'Moderate · 10 days remaining' },
  { item: 'Rice', level: 'low', reason: 'Stable · 30+ days shelf life' },
  { item: 'Soy Sauce', level: 'low', reason: 'Stable · 180+ days shelf life' },
];

const MEAL_PLAN = [
  { day: 'Day 1', title: 'Vegetable Fried Rice', desc: 'Wok-fried rice with carrots, eggs, and soy sauce. Quick and waste-preventing.', tags: ['High-Protein', 'Low-Waste'] },
  { day: 'Day 2', title: 'Egg Rice Bowl', desc: 'Steamed rice topped with seasoned scrambled eggs and soy glaze.', tags: ['Budget', 'Quick'] },
  { day: 'Day 3', title: 'Carrot Stir Fry', desc: 'Crisp carrots stir-fried with egg ribbons over rice.', tags: ['Veggie', 'Waste-Prevention'] },
  { day: 'Day 4', title: 'Rice and Egg Curry', desc: 'Mild egg curry served with steamed rice and carrot pieces.', tags: ['Comfort', 'Family'] },
  { day: 'Day 5', title: 'Vegetable Rice', desc: 'One-pot rice cooked with diced carrots and scrambled egg.', tags: ['One-Pot', 'Easy'] },
  { day: 'Day 6', title: 'Egg Fried Rice', desc: 'Classic egg fried rice with soy seasoning and carrot garnish.', tags: ['Classic', 'Fast'] },
  { day: 'Day 7', title: 'Mixed Rice Bowl', desc: 'Leftover rice bowl with egg, carrots, and soy drizzle.', tags: ['Zero-Waste', 'Balanced'] },
];

const SHOPPING_LIST = [
  { item: 'Chicken', qty: '500g', cost: 850, priority: 'medium' },
  { item: 'Eggs', qty: '12 pcs', cost: 480, priority: 'high' },
  { item: 'Onions', qty: '3 pcs', cost: 180, priority: 'high' },
  { item: 'Beans', qty: '250g', cost: 220, priority: 'medium' },
  { item: 'Tomatoes', qty: '4 pcs', cost: 200, priority: 'high' },
  { item: 'Garlic', qty: '1 bulb', cost: 80, priority: 'low' },
  { item: 'Cooking Oil', qty: '250ml', cost: 170, priority: 'medium' },
];

const TRACE_DATA = [
  { name: 'Coordinator Agent', input: 'Budget: LKR 10,000 · Family: 4 · Pantry: 4 items', decision: 'Created planning objective and dispatched sub-agents', output: 'Structured household state object', time: '0.3s' },
  { name: 'Pantry Agent', input: 'Raw pantry inventory list', decision: 'Classified items into 4 categories by type and perishability', output: 'Categorized inventory with shelf-life metadata', time: '0.5s' },
  { name: 'Waste Agent', input: 'Categorized inventory + shelf-life', decision: 'Flagged carrots as high-risk, prioritized for early-week meals', output: 'Waste risk scores per item', time: '0.8s' },
  { name: 'Meal Planning Agent', input: 'Pantry + waste priorities + family size', decision: 'Generated 7-day meal plan prioritizing perishables first', output: '7-day meal schedule with recipes', time: '1.4s' },
  { name: 'Budget Agent', input: 'Meal plan + market prices', decision: 'Initial estimate LKR 11,300 exceeded budget', output: 'Cost breakdown with flag for reflection', time: '0.9s' },
  { name: 'Reflection Agent', input: 'Budget vs estimate comparison', decision: 'Constraint failed — triggered self-correction loop', output: 'Replan request with substitution rules', time: '0.6s' },
  { name: 'Reporting Agent', input: 'All agent outputs + reflection result', decision: 'Compiled final optimized plan within budget', output: 'Complete household economic report', time: '0.4s' },
];

// ============ STATE ============
const state = {
  budget: 10000,
  familySize: 4,
  pantry: ['Rice', 'Carrots', 'Eggs', 'Soy Sauce'],
  currentView: 'input',
};

// ============ DOM HELPERS ============
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function setView(name) {
  state.currentView = name;
  $$('.view').forEach(v => v.classList.remove('active'));
  const target = $('#view-' + name);
  if (target) target.classList.add('active');

  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  $('#crumb').textContent = {
    input: 'Dashboard',
    processing: 'Processing',
    dashboard: 'Dashboard',
    meals: 'Meal Plan',
    shopping: 'Shopping List',
    trace: 'Agent Trace',
    reflection: 'Reflection Loop',
    report: 'Final Report',
  }[name] || 'Dashboard';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ PANTRY CHIPS ============
function renderPantryChips() {
  const wrap = $('#pantryChips');
  wrap.innerHTML = '';
  state.pantry.forEach((item, idx) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `${item} <button data-idx="${idx}">×</button>`;
    wrap.appendChild(chip);
  });
  wrap.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.pantry.splice(parseInt(btn.dataset.idx), 1);
      renderPantryChips();
    });
  });
}

// ============ INPUT HANDLERS ============
$('#famPlus').addEventListener('click', () => {
  state.familySize++;
  $('#famSize').textContent = state.familySize;
});
$('#famMinus').addEventListener('click', () => {
  if (state.familySize > 1) {
    state.familySize--;
    $('#famSize').textContent = state.familySize;
  }
});

$('#addPantry').addEventListener('click', () => {
  const input = $('#pantryInput');
  const val = input.value.trim();
  if (val && !state.pantry.includes(val)) {
    state.pantry.push(val);
    renderPantryChips();
    input.value = '';
  }
});
$('#pantryInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('#addPantry').click();
});

$('#budget').addEventListener('input', (e) => {
  state.budget = parseInt(e.target.value) || 0;
});

// ============ NAV ============
$$('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const view = item.dataset.view;
    if (state.currentView === 'input' || state.currentView === 'processing') {
      // Don't allow navigation until plan generated
      return;
    }
    setView(view);
  });
});

$$('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.goto));
});

$('#menuToggle').addEventListener('click', () => {
  $('#sidebar').classList.toggle('open');
});

// ============ GENERATE PLAN ============
$('#generateBtn').addEventListener('click', async () => {
  if (state.pantry.length === 0) {
    alert('Please add at least one pantry item.');
    return;
  }
  setView('processing');
  await runAgentSimulation();
  renderDashboard();
  renderMeals();
  renderShopping();
  renderTrace();
  renderReflection();
  renderReport();
  setView('dashboard');
});

async function runAgentSimulation() {
  const list = $('#agentList');
  list.innerHTML = '';
  AGENTS.forEach(a => {
    const row = document.createElement('div');
    row.className = 'agent-row';
    row.id = 'agent-' + a.id;
    row.innerHTML = `
      <div class="icon">${a.icon}</div>
      <div class="name">${a.name}</div>
      <div class="status">Waiting</div>
    `;
    list.appendChild(row);
  });

  for (let i = 0; i < AGENTS.length; i++) {
    const a = AGENTS[i];
    const row = $('#agent-' + a.id);
    row.classList.add('active');
    row.querySelector('.status').innerHTML = '<span class="spinner"></span> Running';
    $('#procSub').textContent = `Executing ${a.name}...`;
    await sleep(700 + Math.random() * 500);
    row.classList.remove('active');
    row.classList.add('done');
    row.querySelector('.status').innerHTML = '✓ Completed';
  }
  $('#procSub').textContent = 'Plan generated successfully.';
  await sleep(600);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============ RENDER DASHBOARD ============
function renderDashboard() {
  $('#sBudget').textContent = 'LKR ' + state.budget.toLocaleString();

  // Pantry Analysis
  const pa = $('#pantryAnalysis');
  pa.innerHTML = '';
  const cats = {};
  state.pantry.forEach(item => {
    const lower = item.toLowerCase();
    let cat = 'Other';
    if (['rice','bread','flour','pasta','noodles'].includes(lower)) cat = 'Staples';
    else if (['carrot','tomato','onion','beans','potato','cabbage'].includes(lower)) cat = 'Vegetables';
    else if (['egg','chicken','fish','meat','tofu','soy'].includes(lower)) cat = 'Protein';
    else if (['sauce','oil','salt','pepper','soy sauce'].includes(lower)) cat = 'Condiments';
    if (!cats[cat]) cats[cat] = [];
    cats[cat].push(item);
  });
  Object.keys(cats).forEach(cat => {
    const el = document.createElement('div');
    el.className = 'pantry-cat';
    el.innerHTML = `
      <div class="pantry-cat-name">${cat}</div>
      <div class="pantry-cat-items">
        ${cats[cat].map(i => `<span class="pantry-item">${i}</span>`).join('')}
      </div>
    `;
    pa.appendChild(el);
  });

  // Waste Risk
  const wr = $('#wasteRisk');
  wr.innerHTML = '';
  WASTE_RISK.filter(w => state.pantry.map(p => p.toLowerCase()).includes(w.item.toLowerCase())).forEach(w => {
    const row = document.createElement('div');
    row.className = 'waste-row';
    row.innerHTML = `
      <div>
        <div class="item">${w.item}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">${w.reason}</div>
      </div>
      <span class="badge ${w.level}">${w.level.toUpperCase()}</span>
    `;
    wr.appendChild(row);
  });

  // Meal Preview
  const mp = $('#mealPreview');
  mp.innerHTML = '';
  MEAL_PLAN.forEach(m => {
    const row = document.createElement('div');
    row.className = 'meal-row';
    row.innerHTML = `
      <div class="meal-day">${m.day.replace('Day ', 'D')}</div>
      <div style="flex:1">
        <div class="meal-name">${m.title}</div>
        <div class="meal-meta">${m.tags.join(' · ')}</div>
      </div>
    `;
    mp.appendChild(row);
  });
}

// ============ RENDER MEALS ============
function renderMeals() {
  const grid = $('#mealsGrid');
  grid.innerHTML = '';
  MEAL_PLAN.forEach(m => {
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.innerHTML = `
      <div class="day">${m.day}</div>
      <div class="title">${m.title}</div>
      <div class="desc">${m.desc}</div>
      <div class="tags">${m.tags.map(t => `<span class="meal-tag">${t}</span>`).join('')}</div>
    `;
    grid.appendChild(card);
  });
}

// ============ RENDER SHOPPING ============
function renderShopping() {
  const rows = $('#shopRows');
  rows.innerHTML = '';
  let total = 0;
  SHOPPING_LIST.forEach(s => {
    total += s.cost;
    const color = s.priority === 'high' ? '#EF4444' : s.priority === 'medium' ? '#F59E0B' : '#10B981';
    const row = document.createElement('div');
    row.className = 'shop-row';
    row.innerHTML = `
      <div>${s.item}</div>
      <div>${s.qty}</div>
      <div>LKR ${s.cost}</div>
      <div><span class="priority-dot" style="background:${color}"></span>${s.priority}</div>
    `;
    rows.appendChild(row);
  });
  $('#shopTotal').textContent = 'LKR ' + total.toLocaleString();
}

// ============ RENDER TRACE ============
function renderTrace() {
  const flow = $('#traceFlow');
  flow.innerHTML = '';
  TRACE_DATA.forEach((t, i) => {
    const node = document.createElement('div');
    node.className = 'trace-node';
    node.style.animationDelay = (i * 0.1) + 's';
    node.innerHTML = `
      <div class="trace-head">
        <div class="trace-num">${i + 1}</div>
        <div class="trace-name">${t.name}</div>
        <div class="trace-time">⏱ ${t.time}</div>
      </div>
      <div class="trace-body">
        <div class="trace-field">
          <div class="trace-field-label">Input</div>
          <div class="trace-field-value">${t.input}</div>
        </div>
        <div class="trace-field">
          <div class="trace-field-label">Decision</div>
          <div class="trace-field-value">${t.decision}</div>
        </div>
        <div class="trace-field">
          <div class="trace-field-label">Output</div>
          <div class="trace-field-value">${t.output}</div>
        </div>
      </div>
    `;
    flow.appendChild(node);
    if (i < TRACE_DATA.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'trace-connector';
      flow.appendChild(conn);
    }
  });
}

// ============ RENDER REFLECTION ============
function renderReflection() {
  const stage = $('#reflectionStage');
  stage.innerHTML = `
    <div class="ref-phase fail">
      <div class="ref-head">
        <div class="ref-icon">✕</div>
        <div>
          <div class="ref-title">Reflection Check — Initial Failure</div>
          <div class="ref-sub">Budget constraint violated on first pass</div>
        </div>
      </div>
      <div class="ref-metrics">
        <div class="ref-metric">
          <div class="ref-metric-label">Estimated Cost</div>
          <div class="ref-metric-value" style="color:#FCA5A5">LKR 11,300</div>
        </div>
        <div class="ref-metric">
          <div class="ref-metric-label">Allowed Budget</div>
          <div class="ref-metric-value">LKR ${state.budget.toLocaleString()}</div>
        </div>
        <div class="ref-metric">
          <div class="ref-metric-label">Overrun</div>
          <div class="ref-metric-value" style="color:#FCA5A5">+LKR ${(11300 - state.budget).toLocaleString()}</div>
        </div>
      </div>
    </div>

    <div class="ref-phase retry">
      <div class="ref-head">
        <div class="ref-icon">↻</div>
        <div>
          <div class="ref-title">Self-Correction Loop</div>
          <div class="ref-sub">Replanning with substitution rules and budget constraint</div>
        </div>
      </div>
      <div class="retry-anim">
        <div class="retry-dots"><span></span><span></span><span></span></div>
        Replanning...
      </div>
      <div class="ref-metrics">
        <div class="ref-metric">
          <div class="ref-metric-label">Strategy</div>
          <div class="ref-metric-value" style="font-size:14px">Substitution</div>
        </div>
        <div class="ref-metric">
          <div class="ref-metric-label">Iterations</div>
          <div class="ref-metric-value">2</div>
        </div>
        <div class="ref-metric">
          <div class="ref-metric-label">Loop Time</div>
          <div class="ref-metric-value">1.8s</div>
        </div>
      </div>
    </div>

    <div class="ref-phase pass">
      <div class="ref-head">
        <div class="ref-icon">✓</div>
        <div>
          <div class="ref-title">Reflection Passed</div>
          <div class="ref-sub">All constraints satisfied · Plan approved</div>
        </div>
      </div>
      <div class="ref-metrics">
        <div class="ref-metric">
          <div class="ref-metric-label">New Cost</div>
          <div class="ref-metric-value" style="color:#6EE7B7">LKR 8,450</div>
        </div>
        <div class="ref-metric">
          <div class="ref-metric-label">Status</div>
          <div class="ref-metric-value" style="color:#6EE7B7">Approved</div>
        </div>
        <div class="ref-metric">
          <div class="ref-metric-label">Savings</div>
          <div class="ref-metric-value" style="color:#6EE7B7">LKR 2,850</div>
        </div>
      </div>
    </div>
  `;
}

// ============ RENDER REPORT ============
function renderReport() {
  const rm = $('#reportMeals');
  rm.innerHTML = MEAL_PLAN.map(m => `
    <div class="report-row"><span class="k">${m.day}</span><span class="v">${m.title}</span></div>
  `).join('');

  const rs = $('#reportShop');
  const total = SHOPPING_LIST.reduce((s, x) => s + x.cost, 0);
  rs.innerHTML = SHOPPING_LIST.map(s => `
    <div class="report-row"><span class="k">${s.item} · ${s.qty}</span><span class="v">LKR ${s.cost}</span></div>
  `).join('') + `<div class="report-row"><span class="k">Total</span><span class="v" style="color:#6EE7B7">LKR ${total.toLocaleString()}</span></div>`;

  const rb = $('#reportBudget');
  rb.innerHTML = `
    <div class="report-row"><span class="k">Budget</span><span class="v">LKR ${state.budget.toLocaleString()}</span></div>
    <div class="report-row"><span class="k">Initial Estimate</span><span class="v" style="color:#FCA5A5">LKR 11,300</span></div>
    <div class="report-row"><span class="k">Optimized Cost</span><span class="v" style="color:#6EE7B7">LKR 8,450</span></div>
    <div class="report-row"><span class="k">Total Savings</span><span class="v" style="color:#6EE7B7">LKR 2,850</span></div>
    <div class="report-row"><span class="k">Under Budget</span><span class="v">LKR 1,550</span></div>
  `;

  const rw = $('#reportWaste');
  rw.innerHTML = WASTE_RISK.filter(w => state.pantry.map(p => p.toLowerCase()).includes(w.item.toLowerCase())).map(w => `
    <div class="report-row"><span class="k">${w.item}</span><span class="v"><span class="badge ${w.level}" style="margin:0">${w.level}</span></span></div>
  `).join('') + `<div class="report-row"><span class="k">Items Protected</span><span class="v" style="color:#6EE7B7">3</span></div>`;

  $('#reportReasoning').innerHTML = `
    <strong style="color:#A5B4FC">AI Reasoning Summary</strong><br/><br/>
    The system prioritized <em style="color:#FCD34D">carrots</em> due to high spoilage risk and scheduled them for early-week meals.
    Eggs were flagged as medium-risk and distributed across multiple recipes to ensure full utilization before expiration.<br/><br/>
    During the initial budget pass, the estimated cost of <strong>LKR 11,300</strong> exceeded the allowed budget of <strong>LKR ${state.budget.toLocaleString()}</strong>.
    The Reflection Agent triggered a self-correction loop, replacing premium protein (chicken breast) with eggs and consolidating overlapping ingredients across meals.<br/><br/>
    After 2 optimization iterations, the final plan came in at <strong style="color:#6EE7B7">LKR 8,450</strong> — saving <strong>LKR 2,850</strong> while maintaining nutritional balance for a family of ${state.familySize}.
    All waste-risk items are consumed within their safe shelf-life window.
  `;
}

// ============ INIT ============
renderPantryChips();
setView('input');