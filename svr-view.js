// svr-view.js — native Compound × Chainlink SVR Liquidation Ledger view for the hub
// Exposes: window.renderSvrNative(containerEl)
// containerEl: a DOM element whose contents will be replaced with the dashboard.
// Reads: data/svr-tracker.json (full liquidation ledger: {rows, comets, summary})
// Self-contained: injects its own scoped <style> (all classes prefixed .svn-) so it
// never clashes with the hub's global CSS. Uses window.Chart (Chart.js) if present,
// otherwise renders lightweight inline-bar fallbacks. Degrades gracefully on missing fields.
(function () {
'use strict';

var STYLE_ID = 'svn-style';
var CSS = [
'.svn{--bg:#0b0e14;--panel:#141926;--panel2:#1b2233;--line:#26304a;--txt:#e6ebf5;--mut:#8b97b3;',
'--comp:#00D395;--link:#5b7cf0;--linkD:#375BD2;--warn:#f5a623;--bad:#ff5c7c;--eth:#8ea2ff;',
'color:var(--txt);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
'line-height:1.5;background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:22px 20px;display:block}',
'.svn *{box-sizing:border-box}',
'.svn .hd{border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:18px}',
'.svn .eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);font-weight:700}',
'.svn h3.t{margin:6px 0 8px;font-size:24px;line-height:1.15;font-weight:800;font-family:inherit}',
'.svn h3.t .g{color:var(--comp)}.svn h3.t .b{color:var(--link)}',
'.svn .sub{color:var(--mut);font-size:14px;max-width:880px}',
'.svn .asof{margin-top:10px;font-size:12.5px;color:var(--mut)}.svn .asof b{color:var(--txt)}',
'.svn .viewbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 18px;padding:12px 14px;background:var(--panel);border:1px solid var(--line);border-radius:12px}',
'.svn .viewbar label{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);font-weight:700}',
'.svn .viewbar select{background:var(--panel2);border:1px solid var(--line);color:var(--txt);border-radius:8px;padding:8px 12px;font-size:14px;font-weight:600;outline:none;min-width:230px}',
'.svn .scope{font-size:12.5px;color:var(--mut)}',
'.svn h4{font-size:17px;margin:30px 0 4px;font-weight:700}',
'.svn .h2sub{color:var(--mut);font-size:13px;margin-bottom:14px;max-width:880px}',
'.svn .grid{display:grid;gap:14px}',
'.svn .kpis{grid-template-columns:repeat(4,1fr)}',
'@media(max-width:880px){.svn .kpis{grid-template-columns:repeat(2,1fr)}}',
'@media(max-width:520px){.svn .kpis{grid-template-columns:1fr}}',
'.svn .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px}',
'.svn .kpi .lab{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;font-weight:600}',
'.svn .kpi .val{font-size:24px;font-weight:800;margin-top:6px}',
'.svn .kpi .val small{font-size:13px;font-weight:600;color:var(--mut)}',
'.svn .kpi .note{font-size:12px;color:var(--mut);margin-top:6px}',
'.svn .accent-g .val{color:var(--comp)}.svn .accent-w .val{color:var(--warn)}.svn .accent-e .val{color:var(--eth)}',
'.svn .chain-h{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin:16px 0 8px}',
'.svn .mkts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}',
'@media(max-width:880px){.svn .mkts{grid-template-columns:1fr}}',
'.svn .mkt-card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;cursor:pointer;transition:border-color .12s,background .12s}',
'.svn .mkt-card:hover{border-color:var(--link)}',
'.svn .mkt-card.sel{border-color:var(--comp);background:#10231e}',
'.svn .mkt-card .top{display:flex;justify-content:space-between;align-items:baseline}',
'.svn .mkt-card .nm{font-size:15px;font-weight:800}',
'.svn .mkt-card .st{font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px}',
'.svn .st-live{background:rgba(0,211,149,.14);color:var(--comp)}.svn .st-idle{background:rgba(245,166,35,.14);color:var(--warn)}',
'.svn .mkt-card .meta{font-size:10.5px;color:var(--mut);margin:3px 0 11px}',
'.svn .mkt-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;font-size:12px}',
'.svn .mkt-grid .l{color:var(--mut)}.svn .mkt-grid .v{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}',
'.svn .v.g{color:var(--comp)}',
'.svn .chartbox{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 16px 8px}',
'.svn .canv{position:relative;height:300px}',
'.svn .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:880px){.svn .two{grid-template-columns:1fr}}',
'.svn .waterfall{display:flex;flex-direction:column;gap:9px}',
'.svn .wf{display:grid;grid-template-columns:170px 1fr 140px;align-items:center;gap:12px;font-size:12px}',
'.svn .wf .bar{height:22px;border-radius:6px;min-width:2px}.svn .wf .num{text-align:right;color:var(--mut);font-variant-numeric:tabular-nums}',
'.svn .legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;font-size:11.5px;color:var(--mut)}',
'.svn .legend span{display:inline-flex;align-items:center;gap:6px}.svn .sw{width:11px;height:11px;border-radius:3px;display:inline-block}',
'.svn .controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px}',
'.svn .controls input[type=text]{background:var(--panel2);border:1px solid var(--line);color:var(--txt);border-radius:8px;padding:8px 11px;font-size:13px;outline:none;min-width:200px}',
'.svn .controls label{font-size:12.5px;color:var(--mut);display:inline-flex;align-items:center;gap:7px;cursor:pointer}',
'.svn .controls .spacer{flex:1}.svn .controls .count{font-size:12.5px;color:var(--mut)}',
'.svn .tbl-wrap{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow-x:auto}',
'.svn table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:860px}',
'.svn th,.svn td{padding:9px 12px;text-align:right;border-bottom:1px solid var(--line);white-space:nowrap}',
'.svn th:nth-child(-n+4),.svn td:nth-child(-n+4){text-align:left}',
'.svn th{color:var(--mut);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.03em;cursor:pointer;user-select:none;background:var(--panel2)}',
'.svn th:hover{color:var(--txt)}.svn th .ar{opacity:.5;font-size:9px;margin-left:3px}',
'.svn tbody tr:hover{background:var(--panel2)}',
'.svn td a{color:var(--link);text-decoration:none}.svn td a:hover{text-decoration:underline}',
'.svn .pill{display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px}',
'.svn .p-svr{background:rgba(0,211,149,.14);color:var(--comp)}.svn .p-no{background:rgba(139,151,179,.12);color:var(--mut)}.svn .p-unk{background:rgba(245,166,35,.13);color:var(--warn)}',
'.svn .ch{font-size:11px;font-weight:700}.svn .ch.Ethereum{color:#8ea2ff}.svn .ch.Base{color:#3c8aff}.svn .ch.Arbitrum{color:#5ea8d8}',
'.svn .co{font-weight:700;font-size:11.5px}',
'.svn .usdv{font-variant-numeric:tabular-nums}.svn .usdv.g{color:var(--comp)}',
'.svn .more{display:block;width:100%;background:var(--panel2);border:1px solid var(--line);border-top:0;color:var(--link);padding:11px;font-size:13px;font-weight:600;cursor:pointer}',
'.svn .more:hover{background:#222c41}',
'.svn .flag{background:linear-gradient(180deg,rgba(255,92,124,.09),rgba(255,92,124,.03));border:1px solid rgba(255,92,124,.30);border-radius:14px;padding:14px 17px;margin-top:14px;font-size:13px}',
'.svn .flag b{color:var(--bad)}',
'.svn .meth{font-size:13px;color:var(--mut)}.svn .meth p{margin:0 0 10px}.svn .meth b{color:var(--txt)}',
'.svn .empty{color:var(--mut);padding:24px;text-align:center}'
].join('');

function ensureStyle() {
if (document.getElementById(STYLE_ID)) return;
var s = document.createElement('style');
s.id = STYLE_ID; s.textContent = CSS;
document.head.appendChild(s);
}

var ADDR = {
'Ethereum|cUSDCv3': '0xc3d688…84cdc3', 'Ethereum|cUSDTv3': '0x3Afdc9…AB0840',
'Base|cUSDCv3': '0xb125E6…15Eb2F', 'Base|cWETHv3': '0x46e6b2…6970bf', 'Base|cAEROv3': '0x784efe…bECE89',
'Arbitrum|cUSDCv3': '0x9c4ec7…Ff58bf', 'Arbitrum|cUSDTv3': '0xd98Be0…a57d07', 'Arbitrum|cWETHv3': '0x6f7D51…dEe486'
};
var EXP = { Ethereum: 'https://etherscan.io/tx/', Base: 'https://basescan.org/tx/', Arbitrum: 'https://arbiscan.io/tx/' };

function fmtUSD(v) {
if (v == null) return '—';
var a = Math.abs(v);
if (a >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
if (a >= 1000) return '$' + Math.round(v).toLocaleString();
return '$' + (v || 0).toFixed(2);
}
function fmtM(v) {
if (v == null) return '—';
if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
if (v >= 1000) return '$' + Math.round(v / 1000) + 'K';
return '$' + Math.round(v);
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

function build(container, DATA) {
var rows = DATA.rows || [];
var CM = DATA.comets || [];
var hasChart = typeof window.Chart !== 'undefined';
var charts = {};

function agg(rs) {
var a = { n: rs.length, nsvr: 0, vl: 0, av: 0, gross: 0, dao: 0, cl: 0, daoE: 0 };
rs.forEach(function (r) {
a.vl += r.vl || 0; a.av += r.av || 0;
if (r.svr === true) a.nsvr++;
if (r.daoU) { a.gross += r.recU || 0; a.dao += r.daoU || 0; a.cl += r.clU || 0; a.daoE += r.daoE || 0; }
});
return a;
}
function monthly(rs) {
var m = {};
rs.forEach(function (r) {
if (!r.d) return;
var k = r.d.slice(0, 7);
(m[k] = m[k] || { m: k, n: 0, svr: 0, vl: 0, av: 0, rec: 0 });
m[k].n++; if (r.svr === true) m[k].svr++;
m[k].vl += r.vl || 0; m[k].av += r.av || 0; if (r.recU) m[k].rec += r.recU;
});
return Object.keys(m).map(function (k) { return m[k]; }).sort(function (x, y) { return x.m < y.m ? -1 : 1; });
}

var chains = ['Ethereum', 'Base', 'Arbitrum'];
var marketsHtml = chains.map(function (ch) {
var cards = CM.filter(function (c) { return c.ch === ch; }).map(function (c) {
var live = c.daoU > 0;
return '<div class="mkt-card" data-key="' + esc(c.ch + '|' + c.co) + '">' +
'<div class="top"><span class="nm">' + esc(c.co) + '</span>' +
'<span class="st ' + (live ? 'st-live' : 'st-idle') + '">' + (live ? 'earning' : 'no recapture') + '</span></div>' +
'<div class="meta">SVR since <b>' + esc(c.act) + '</b> · ' + esc(ADDR[c.ch + '|' + c.co] || '') + '</div>' +
'<div class="mkt-grid">' +
'<span class="l">Liquidations</span><span class="v">' + (c.n != null ? c.n : '—') + '</span>' +
'<span class="l">Via SVR</span><span class="v">' + (c.svr != null ? c.svr : '—') + '</span>' +
'<span class="l">Value liquidated</span><span class="v">' + fmtUSD(c.vl) + '</span>' +
'<span class="l">OEV available</span><span class="v">' + fmtUSD(c.av) + '</span>' +
'<span class="l">To DAO</span><span class="v g">' + (live ? fmtUSD(c.daoU) + ' (' + (c.daoE != null ? c.daoE.toFixed(0) : '?') + ' ETH)' : '—') + '</span>' +
'</div></div>';
}).join('');
return '<div class="chain-h">' + esc(ch) + '</div><div class="mkts">' + cards + '</div>';
}).join('');

var viewOpts = '<option value="all">All comets (3 chains)</option>' +
CM.map(function (c) { return '<option value="' + esc(c.ch + '|' + c.co) + '">' + esc(c.ch + ' · ' + c.co) + '</option>'; }).join('');

container.classList.add('svn');
container.innerHTML =
'<div class="hd"><div class="eyebrow">Compound DAO · On-chain liquidation analysis</div>' +
'<h3 class="t">Chainlink <span class="b">SVR</span> — <span class="g">Liquidation Ledger</span></h3>' +
'<p class="sub">Every liquidation on Compound\'s SVR-enabled markets, counted from the block each comet\'s feeds were switched to the SVR aggregator on-chain. Value liquidated, the OEV incentive available, whether it routed through SVR, and how recaptured value split between the DAO and Chainlink versus what leaked to liquidators.</p>' +
'<div class="asof">' + CM.length + ' comets, 3 chains · SVR split <b>55% DAO / 45% Chainlink</b>' + (DATA.updatedAt ? ' · snapshot <b>' + esc(new Date(DATA.updatedAt).toLocaleDateString()) + '</b>' : '') + '</div></div>' +
'<div class="viewbar"><label for="svn-view">View</label><select id="svn-view">' + viewOpts + '</select><span class="scope" id="svn-scope"></span></div>' +
'<div class="grid kpis">' +
'<div class="card kpi"><div class="lab">Liquidations</div><div class="val" id="svn-k_n">—</div><div class="note" id="svn-k_n2"></div></div>' +
'<div class="card kpi accent-g"><div class="lab">Routed through SVR</div><div class="val" id="svn-k_svr">—</div><div class="note" id="svn-k_svr2"></div></div>' +
'<div class="card kpi accent-w"><div class="lab">OEV incentive available</div><div class="val" id="svn-k_av">—</div><div class="note">on-chain liquidation penalty</div></div>' +
'<div class="card kpi accent-e"><div class="lab">Recaptured to DAO</div><div class="val" id="svn-k_dao">—</div><div class="note" id="svn-k_dao2"></div></div>' +
'</div>' +
'<h4>SVR markets</h4><div class="h2sub">All comets where SVR price feeds were activated on-chain, with the activation date. Click any card to filter the page to that comet.</div>' +
'<div id="svn-markets">' + marketsHtml + '</div>' +
'<h4>Where the OEV went</h4><div class="h2sub" id="svn-oev-sub"></div>' +
'<div class="two"><div class="chartbox"><div class="canv"><canvas id="svn-routeChart"></canvas><div id="svn-routeFb"></div></div></div>' +
'<div class="card"><div class="waterfall" id="svn-waterfall"></div>' +
'<div class="legend"><span><i class="sw" style="background:var(--bad)"></i> Leaked to liquidators</span>' +
'<span><i class="sw" style="background:var(--linkD)"></i> Chainlink 45%</span>' +
'<span><i class="sw" style="background:var(--comp)"></i> Compound DAO 55%</span></div></div></div>' +
'<div class="flag"><b>⚠ </b><span id="svn-leak"></span></div>' +
'<h4>Over time</h4><div class="h2sub">Left: liquidations per month, total vs. routed through SVR. Right: value liquidated against OEV available and recaptured (USD).</div>' +
'<div class="two"><div class="chartbox"><div class="canv"><canvas id="svn-monChart"></canvas><div id="svn-monFb"></div></div></div>' +
'<div class="chartbox"><div class="canv"><canvas id="svn-valChart"></canvas><div id="svn-valFb"></div></div></div></div>' +
'<h4>Recapture rate — promised vs actual</h4><div class="h2sub">Recaptured OEV ÷ total available OEV across all liquidations on SVR-enabled markets, per month. Dashed lines are Chainlink\'s publicly stated targets.</div>' +
'<div class="card" style="border-color:#caa53a;margin-bottom:14px"><div style="font-weight:700;margin-bottom:6px">Stated commitments</div><div class="meth" style="font-size:12.5px"><p>Chainlink initially projected <b>~90%</b> OEV recapture (<a href="https://www.comp.xyz/t/chainlink-svr-onboarding-on-usdc-mainnet/7298/3" target="_blank">forum</a>), then revised to <b>~80%</b> citing <b>40–60%</b> during volatile periods (<a href="https://www.comp.xyz/t/chainlink-svr-onboarding-on-usdc-mainnet/7298/4" target="_blank">forum</a>, <a href="https://www.comp.xyz/t/chainlink-svr-onboarding-on-usdc-mainnet/7298/5" target="_blank">reiterated</a>). Actual has run far below since launch.</p></div></div>' +
'<div class="chartbox"><div class="canv"><canvas id="svn-recChart"></canvas><div id="svn-recFb"></div></div></div>' +
'<h4>Liquidation ledger</h4><div class="h2sub">"Available" = on-chain OEV incentive. → DAO / → Chainlink are USD valued at recapture-time. Click a header to sort.</div>' +
'<div class="controls"><input type="text" id="svn-search" placeholder="Search tx hash…">' +
'<label><input type="checkbox" id="svn-fsvr"> SVR-routed only</label>' +
'<label><input type="checkbox" id="svn-fdust" checked> hide dust (&lt; $1)</label>' +
'<div class="spacer"></div><div class="count" id="svn-rowcount"></div></div>' +
'<div class="tbl-wrap"><table id="svn-tbl"><thead><tr>' +
'<th data-k="d">Date<span class="ar"></span></th><th data-k="ch">Chain</th><th data-k="co">Comet</th><th data-k="tx" style="text-align:left">Tx hash</th>' +
'<th data-k="vl">Value liquidated<span class="ar"></span></th><th data-k="av">Available OEV<span class="ar"></span></th>' +
'<th data-k="svr">Via SVR<span class="ar"></span></th><th data-k="daoU">→ DAO<span class="ar"></span></th><th data-k="clU">→ Chainlink<span class="ar"></span></th>' +
'</tr></thead><tbody id="svn-tbody"></tbody></table><button class="more" id="svn-more">Show more</button></div>' +
'<h4>Method &amp; reliability</h4><div class="card meth">' +
'<p><b>Activation windows.</b> Liquidations are counted only from the block each comet\'s feeds were switched to the SVR aggregator on-chain (Comet proxy <code>Upgraded</code> event).</p>' +
'<p><b>Liquidations &amp; available incentive.</b> Every <code>AbsorbDebt</code> event per comet (value liquidated = on-chain usdValue). Available OEV = sum of collateral_usd * storeFrontPriceFactor * (1 - liquidationFactor), read on-chain. Theoretical-max discount, so "leaked" is an upper bound.</p>' +
'<p><b>Routing.</b> Mainnet: SVR-routed if the SVR aggregator\'s price update lands in the same Flashbots block as the liquidation (the backrun bundle). L2: Atlas bundles the oracle update + solver op + bid into one metacall tx, read directly per-tx.</p>' +
'<p><b>Recapture amounts.</b> Mainnet: the verified ETH delivered to the DAO recipient is allocated across oracle-routed liquidations by available incentive (per-row = estimate, total = exact). L2: the winning Atlas bid per liquidation is read on-chain. Independent community analysis inside the Compound hub — not financial advice.</p>' +
'</div>';

var $ = function (id) { return container.querySelector('#' + id); };
var view = $('svn-view');
var sortK = 'd', sortDir = -1, shown = 80, curRows = rows;

function destroyChart(k) { if (charts[k]) { try { charts[k].destroy(); } catch (e) {} charts[k] = null; } }

function fbBars(el, items, fmtFn, color) {
var max = items.reduce(function (m, x) { return Math.max(m, x.v); }, 0) || 1;
el.innerHTML = '<div style="display:flex;flex-direction:column;gap:6px;padding:8px 0">' + items.map(function (x) {
return '<div style="display:grid;grid-template-columns:90px 1fr 90px;gap:8px;align-items:center;font-size:11px;color:var(--mut)">' +
'<span>' + esc(x.l) + '</span><span><span style="display:inline-block;height:14px;border-radius:4px;background:' + (x.c || color || '#00D395') + ';width:' + Math.max(2, (x.v / max) * 100).toFixed(1) + '%"></span></span>' +
'<span style="text-align:right">' + fmtFn(x.v) + '</span></div>';
}).join('') + '</div>';
}

function renderTable(rs) {
var q = $('svn-search').value.trim().toLowerCase();
var so = $('svn-fsvr').checked, hd = $('svn-fdust').checked;
var r = rs.filter(function (x) {
return (!so || x.svr === true) && (!hd || (x.vl || 0) >= 1) &&
(!q || (x.b || '').toLowerCase().indexOf(q) >= 0 || (x.tx || '').toLowerCase().indexOf(q) >= 0);
});
r.sort(function (a, b) {
var va = a[sortK], vb = b[sortK];
if (sortK === 'svr') { va = va ? 1 : 0; vb = vb ? 1 : 0; }
if (va == null) va = -1; if (vb == null) vb = -1;
if (va < vb) return -sortDir; if (va > vb) return sortDir; return 0;
});
$('svn-rowcount').textContent = r.length.toLocaleString() + ' shown';
$('svn-tbody').innerHTML = r.slice(0, shown).map(function (x) {
var svr = x.svr === true ? '<span class="pill p-svr">SVR</span>' : x.svr === false ? '<span class="pill p-no">no</span>' : '<span class="pill p-unk">n/a</span>';
var exp = EXP[x.ch] || 'https://etherscan.io/tx/';
return '<tr><td>' + esc(x.d) + '</td><td><span class="ch ' + esc(x.ch) + '">' + esc(x.ch) + '</span></td><td><span class="co">' + esc(x.co) + '</span></td>' +
'<td style="text-align:left"><a href="' + exp + esc(x.tx) + '" target="_blank" rel="noopener">' + esc((x.tx||'').slice(0,10)) + '…</a></td>' +
'<td class="usdv">' + fmtUSD(x.vl) + '</td><td class="usdv">' + fmtUSD(x.av) + '</td><td>' + svr + '</td>' +
'<td class="usdv g">' + fmtUSD(x.daoU) + '</td><td class="usdv">' + fmtUSD(x.clU) + '</td></tr>';
}).join('');
$('svn-more').style.display = r.length > shown ? 'block' : 'none';
}

function render() {
var v = view.value;
var rs = v === 'all' ? rows : rows.filter(function (r) { return r.ch + '|' + r.co === v; });
curRows = rs;
var A = agg(rs), M = monthly(rs);
var single = v !== 'all';
var isL2 = single && v.indexOf('Ethereum') !== 0;

container.querySelectorAll('.mkt-card').forEach(function (c) { c.classList.toggle('sel', c.getAttribute('data-key') === v); });
$('svn-scope').textContent = v === 'all' ? 'Showing all ' + CM.length + ' comets across Ethereum, Base & Arbitrum' : 'Showing ' + v.replace('|', ' · ') + ' only';

$('svn-k_n').textContent = A.n.toLocaleString();
$('svn-k_n2').textContent = (A.n - A.nsvr) + ' bypassed SVR';
$('svn-k_svr').innerHTML = A.nsvr + ' <small>(' + (A.n ? Math.round(A.nsvr / A.n * 100) : 0) + '%)</small>';
$('svn-k_svr2').textContent = isL2 ? 'via Atlas auction (per-tx)' : (single ? 'via same-block oracle unlock' : 'oracle-unlock (L1) + Atlas (L2)');
$('svn-k_av').textContent = fmtM(A.av);
$('svn-k_dao').textContent = A.dao > 0 ? fmtM(A.dao) : '—';
$('svn-k_dao2').textContent = A.dao > 0 ? ('= ' + A.daoE.toFixed(1) + ' ETH · Chainlink ' + fmtM(A.cl)) : (isL2 ? 'no on-chain recapture' : '—');

$('svn-oev-sub').textContent = (v === 'all' ? 'All comets' : v.replace('|', ' · ')) +
'. "Available" is the theoretical-max liquidation discount; recaptured is what reached the DAO + Chainlink; the rest leaked to liquidators.';
var miss = A.av - A.gross;
$('svn-leak').innerHTML = A.gross > 0
? '<b>Most OEV never reaches the DAO.</b> Of ' + fmtM(A.av) + ' available, ' + fmtM(A.gross) + ' (' + Math.round(A.gross / A.av * 100) + '%) was recaptured — ' + fmtM(A.dao) + ' to the DAO, ' + fmtM(A.cl) + ' to Chainlink. ' + fmtM(miss) + ' (' + Math.round(miss / A.av * 100) + '%) leaked to liquidators, mostly on the ' + (A.n - A.nsvr) + ' liquidations that never routed through SVR.'
: '<b>No OEV recaptured here.</b> All ' + fmtM(A.av) + ' of available OEV across ' + A.n + ' liquidations went to ordinary liquidators.';

var wf = [
{ l: 'Available OEV', v: A.av, p: 1, c: '#2c3650' },
{ l: 'Leaked to liquidators', v: miss, p: A.av ? miss / A.av : 0, c: '#ff5c7c' },
{ l: 'Recaptured (gross)', v: A.gross, p: A.av ? A.gross / A.av : 0, c: '#5b7cf0' },
{ l: '→ Chainlink (45%)', v: A.cl, p: A.av ? A.cl / A.av : 0, c: '#375BD2' },
{ l: '→ Compound DAO (55%)', v: A.dao, p: A.av ? A.dao / A.av : 0, c: '#00D395' }
];
$('svn-waterfall').innerHTML = wf.map(function (r) {
return '<div class="wf"><div>' + r.l + '</div><div><div class="bar" style="width:' + Math.max(r.p * 100, 0).toFixed(1) + '%;background:' + r.c + '"></div></div>' +
'<div class="num">' + fmtUSD(r.v) + ' · ' + Math.round(r.p * 100) + '%</div></div>';
}).join('');

var labels = M.map(function (x) { return x.m; });
var gridc = '#26304a';
if (hasChart) {
var Chart = window.Chart;
destroyChart('route');
charts.route = new Chart($('svn-routeChart'), {
type: 'doughnut',
data: { labels: ['Routed via SVR', 'Bypassed SVR'], datasets: [{ data: [A.nsvr, A.n - A.nsvr], backgroundColor: ['#00D395', '#2c3650'], borderColor: '#141926', borderWidth: 3 }] },
options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color: '#8b97b3', boxWidth: 12, usePointStyle: true, padding: 14 } }, title: { display: true, text: 'Liquidations by routing', color: '#e6ebf5', font: { size: 13 } }, tooltip: { callbacks: { label: function (c) { return c.label + ': ' + c.raw + ' (' + (A.n ? Math.round(c.raw / A.n * 100) : 0) + '%)'; } } } } }
});
destroyChart('mon');
charts.mon = new Chart($('svn-monChart'), {
data: { labels: labels, datasets: [
{ type: 'bar', label: 'Total liquidations', data: M.map(function (x) { return x.n; }), backgroundColor: '#2c3650', borderRadius: 4 },
{ type: 'bar', label: 'Routed via SVR', data: M.map(function (x) { return x.svr; }), backgroundColor: '#00D395', borderRadius: 4 }] },
options: { maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8b97b3', boxWidth: 12, usePointStyle: true } }, title: { display: true, text: 'Liquidations per month', color: '#e6ebf5', font: { size: 13 } } }, scales: { y: { grid: { color: gridc }, ticks: { color: '#8b97b3' } }, x: { grid: { display: false }, ticks: { color: '#8b97b3' } } } }
});
destroyChart('val');
charts.val = new Chart($('svn-valChart'), {
data: { labels: labels, datasets: [
{ type: 'bar', label: 'OEV available', data: M.map(function (x) { return x.av; }), backgroundColor: '#f5a623', borderRadius: 4, yAxisID: 'y', order: 3 },
{ type: 'bar', label: 'Recaptured', data: M.map(function (x) { return x.rec; }), backgroundColor: '#00D395', borderRadius: 4, yAxisID: 'y', order: 2 },
{ type: 'line', label: 'Value liquidated', data: M.map(function (x) { return x.vl; }), borderColor: '#5b7cf0', backgroundColor: 'rgba(91,124,240,.1)', fill: true, tension: .25, pointRadius: 2, yAxisID: 'y1', order: 1 }] },
options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { color: '#8b97b3', boxWidth: 12, usePointStyle: true } }, title: { display: true, text: 'Value over time (USD)', color: '#e6ebf5', font: { size: 13 } }, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + fmtUSD(c.raw); } } } }, scales: { y: { position: 'left', grid: { color: gridc }, ticks: { color: '#8b97b3', callback: function (v) { return '$' + (v / 1e6).toFixed(2) + 'M'; } } }, y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#8b97b3', callback: function (v) { return '$' + (v / 1e6).toFixed(0) + 'M'; } } }, x: { grid: { display: false }, ticks: { color: '#8b97b3' } } } }
});
destroyChart('rec');
charts.rec = new Chart($('svn-recChart'), {
type: 'line',
data: { labels: labels, datasets: [
{ label: 'Actual recapture', data: M.map(function (x) { return x.av > 0 ? +(x.rec / x.av * 100).toFixed(1) : null; }), borderColor: '#00D395', backgroundColor: 'rgba(0,211,149,.12)', fill: true, tension: .25, pointRadius: 3, borderWidth: 2.5 },
{ label: 'Promised 90%', data: labels.map(function () { return 90; }), borderColor: '#ff5c7c', borderDash: [6,4], pointRadius: 0, borderWidth: 1.5 },
{ label: 'Calm-market 80%', data: labels.map(function () { return 80; }), borderColor: '#f5a623', borderDash: [6,4], pointRadius: 0, borderWidth: 1.5 },
{ label: 'Volatile max 60%', data: labels.map(function () { return 60; }), borderColor: '#8b97b3', borderDash: [3,3], pointRadius: 0, borderWidth: 1 },
{ label: 'Volatile min 40%', data: labels.map(function () { return 40; }), borderColor: '#8b97b3', borderDash: [3,3], pointRadius: 0, borderWidth: 1 }] },
options: { maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8b97b3', boxWidth: 12, usePointStyle: true } }, title: { display: true, text: 'Recapture rate vs stated targets', color: '#e6ebf5', font: { size: 13 } }, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + c.parsed.y + '%'; } } } }, scales: { y: { min: 0, max: 100, grid: { color: gridc }, ticks: { color: '#8b97b3', callback: function (v) { return v + '%'; } } }, x: { grid: { display: false }, ticks: { color: '#8b97b3' } } } }
});
} else {
fbBars($('svn-routeFb'), [{ l: 'Routed via SVR', v: A.nsvr, c: '#00D395' }, { l: 'Bypassed', v: A.n - A.nsvr, c: '#2c3650' }], function (v) { return v + ''; });
fbBars($('svn-monFb'), M.map(function (x) { return { l: x.m, v: x.n, c: '#2c3650' }; }), function (v) { return v + ''; });
fbBars($('svn-valFb'), M.map(function (x) { return { l: x.m, v: x.vl, c: '#5b7cf0' }; }), fmtUSD);
}

renderTable(rs);
}

container.querySelectorAll('.mkt-card').forEach(function (card) {
card.addEventListener('click', function () { view.value = card.getAttribute('data-key'); shown = 80; render(); });
});
container.querySelectorAll('#svn-tbl th[data-k]').forEach(function (th) {
th.addEventListener('click', function () {
var k = th.getAttribute('data-k');
if (sortK === k) sortDir *= -1;
else { sortK = k; sortDir = (['d', 'vl', 'av', 'daoU', 'clU', 'svr'].indexOf(k) >= 0) ? -1 : 1; }
container.querySelectorAll('#svn-tbl .ar').forEach(function (a) { a.textContent = ''; });
var ar = th.querySelector('.ar'); if (ar) ar.textContent = sortDir < 0 ? '▼' : '▲';
shown = 80; renderTable(curRows);
});
});
['svn-search', 'svn-fsvr', 'svn-fdust'].forEach(function (id) {
$(id).addEventListener('input', function () { shown = 80; renderTable(curRows); });
});
$('svn-more').addEventListener('click', function () { shown += 150; renderTable(curRows); });
view.addEventListener('change', function () { shown = 80; render(); });

render();
}

window.renderSvrNative = function (container) {
if (!container) return;
ensureStyle();
container.classList.add('svn');
container.innerHTML = '<div class="empty">Loading SVR Liquidation Ledger…</div>';
fetch('data/svr-tracker.json?t=' + Date.now())
.then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
.then(function (DATA) {
if (!DATA || !DATA.rows) { container.innerHTML = '<div class="empty">No svr-tracker data available.</div>'; return; }
build(container, DATA);
})
.catch(function (e) {
container.innerHTML = '<div class="empty">Could not load <code>data/svr-tracker.json</code> (' + esc(e.message || e) + ').</div>';
});
};
})();
