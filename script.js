let state = {
  n: 0,
  nodes: [],
  edges: [],
  mst: [],
  cost: 0,
  visited: [],
  frontier: [],
  totalGraphCost: 0,
  running: false
};
let costChart = null;

function log(msg) {
  const div = document.getElementById("log");
  div.innerHTML += msg + "<br>";
  div.scrollTop = div.scrollHeight;
}

function layoutCircle(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: 250 + 200 * Math.cos((2 * Math.PI * i) / n),
    y: 250 + 200 * Math.sin((2 * Math.PI * i) / n)
  }));
}

function generateConnectedGraph(n, density) {
  const edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.random() < density) {
        edges.push({ source: i, target: j, w: Math.floor(1 + Math.random() * 20) });
      }
    }
  }
  if (edges.length === 0) edges.push({ source: 0, target: 1, w: 5 });
  return edges;
}

function buildGraph() {
  state.n = parseInt(document.getElementById("nodes").value);
  state.nodes = layoutCircle(state.n);
  state.edges = generateConnectedGraph(state.n, parseFloat(document.getElementById("density").value));
  state.totalGraphCost = state.edges.reduce((s, e) => s + e.w, 0);
  renderGraph();
  populateStartSelect();
  restartPrim(0);
  log(`📊 Graph created with ${state.n} nodes, total naive cost = ${state.totalGraphCost}`);
}

function renderGraph() {
  d3.select("#graph").selectAll("*").remove();
  const svg = d3.select("#graph").append("svg").attr("width", "100%").attr("height", "100%");

  svg.selectAll("line")
    .data(state.edges).enter()
    .append("line")
    .attr("x1", d => state.nodes[d.source].x)
    .attr("y1", d => state.nodes[d.source].y)
    .attr("x2", d => state.nodes[d.target].x)
    .attr("y2", d => state.nodes[d.target].y)
    .attr("stroke", "#ddd").attr("stroke-width", 2).attr("class", "edge");

  svg.selectAll("text.weight")
    .data(state.edges).enter()
    .append("text")
    .attr("x", d => (state.nodes[d.source].x + state.nodes[d.target].x) / 2)
    .attr("y", d => (state.nodes[d.source].y + state.nodes[d.target].y) / 2)
    .attr("class", "weight")
    .text(d => d.w);

  svg.selectAll("circle")
    .data(state.nodes).enter()
    .append("circle")
    .attr("cx", d => d.x).attr("cy", d => d.y)
    .attr("r", 18).attr("fill", "#2563eb").attr("stroke", "white").attr("stroke-width", 2);

  svg.selectAll("text.node")
    .data(state.nodes).enter()
    .append("text")
    .attr("x", d => d.x).attr("y", d => d.y + 5)
    .attr("class", "node").attr("text-anchor", "middle").attr("fill", "white")
    .text(d => d.id);
}

function populateStartSelect() {
  const sel = document.getElementById("startNode");
  sel.innerHTML = "";
  state.nodes.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n.id; opt.textContent = n.id;
    sel.appendChild(opt);
  });
}

function restartPrim(start = 0) {
  state.start = parseInt(document.getElementById("startNode").value) || start;
  state.mst = [];
  state.cost = 0;
  state.visited = [state.start];
  state.frontier = [];
  log(`🔄 Restart from node ${state.start}`);
  highlightGraph();
}

function primFrontier() {
  return state.edges.filter(e =>
    (state.visited.includes(e.source) && !state.visited.includes(e.target)) ||
    (state.visited.includes(e.target) && !state.visited.includes(e.source))
  );
}

function primStep() {
  state.frontier = primFrontier();
  if (state.frontier.length === 0) {
    if (state.mst.length === state.n - 1) {
      log(`✅ MST complete. Optimized cost = ${state.cost}`);
      const savings = state.totalGraphCost - state.cost;
      const percent = ((savings / state.totalGraphCost) * 100).toFixed(1);
      log(`💡 Naive cost = ${state.totalGraphCost}, Savings = ${savings} (${percent}%)`);
      updateComparisonChart(state.cost, state.totalGraphCost);
    }
    return false;
  }
  const minEdge = state.frontier.reduce((a, b) => (a.w < b.w ? a : b));
  state.mst.push(minEdge);
  state.cost += minEdge.w;
  if (state.visited.includes(minEdge.source)) state.visited.push(minEdge.target);
  else state.visited.push(minEdge.source);
  log(`➕ Added edge (${minEdge.source}-${minEdge.target}) cost ${minEdge.w}`);
  highlightGraph();
  return true;
}

function highlightGraph() {
  const svg = d3.select("#graph svg");
  svg.selectAll("line").attr("stroke", "#ddd").attr("stroke-width", 2);
  svg.selectAll("line")
    .data(state.edges).attr("stroke", d => state.mst.includes(d) ? "green" : "#ddd")
    .attr("stroke-width", d => state.mst.includes(d) ? 4 : 2);
  svg.selectAll("circle").attr("fill", d => state.visited.includes(d.id) ? "#22c55e" : "#2563eb");
}

function stepPrim() { primStep(); }
function runPrim() {
  state.running = true;
  function loop() {
    if (!state.running) return;
    if (!primStep()) { state.running = false; return; }
    setTimeout(loop, 1000);
  }
  loop();
}

function updateComparisonChart(mstCost, totalCost) {
  const ctx = document.getElementById("costChart").getContext("2d");
  if (costChart) costChart.destroy();
  costChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Naive (All Edges)", "Optimized (MST)"],
      datasets: [{
        data: [totalCost, mstCost],
        backgroundColor: ["#ef4444", "#22c55e"]
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}

// build initial graph
buildGraph();

