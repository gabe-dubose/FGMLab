// application state
const state = {
    simResults : null,
    simParams : null,
    animState : {
        pop : { playing: false, frame: 0, timer: null },
        dist : { playing: false, frame: 0, timer: null }
    }
};

// pyodide state
let pyodide = null;

// tab switching
function switchMode(mode, el) {

    state.mode = mode;
    document.querySelectorAll('#mode-tabs [role="tab"]').forEach(t => {
        t.setAttribute('aria-selected', 'false');
    });
    el.setAttribute('aria-selected', 'true');
    document.getElementById('panel-standard').style.display =
        mode === 'standard' ? 'block' : 'none';
    document.getElementById('panel-migration').style.display =
        mode === 'migration' ? 'block' : 'none';
    document.getElementById('panel-info').style.display =
        mode === 'info' ? 'block' : 'none';
}

function switchViz(viz, el) {
    // update tab selected state
    document.querySelectorAll('#viz-tabs menu li').forEach(li => {
        li.removeAttribute('aria-selected');
    });
    el.setAttribute('aria-selected', 'true');
    // show correct panel
    const panels = ['landscape', 'population', 'distribution', 'trajectory'];
    panels.forEach(p => {
        document.getElementById('viz-' + p).style.display = p === viz ? '' : 'none';
    });
    // trigger plotly resize so plots fill their containers correctly
    window.dispatchEvent(new Event('resize'));
}

// dimension toggle
function onDimChange() {
    const dim = document.getElementById('n-dim').value;
    // toggle main parameter fields
    document.getElementById('params-1d').style.display = dim === '1' ? '' : 'none';
    document.getElementById('params-2d').style.display = dim === '2' ? '' : 'none';
    // toggle migration mean fields
    document.getElementById('mig-mean').parentElement.style.display = dim === '1' ? '' : 'none';
    document.getElementById('mig-mean-1').parentElement.style.display = dim === '2' ? '' : 'none';
    document.getElementById('mig-mean-2').parentElement.style.display = dim === '2' ? '' : 'none';
    // update landscape plot immediately
    onLandscapeParamChange();
}

// live landscape update
function onLandscapeParamChange() {
    if (!pyodide) return;
    const dim = document.getElementById('n-dim').value;
    const sigmaSel = parseFloat(document.getElementById('sigma-sel').value) || 2;
    if (dim === '1') {
        const zOpt = parseFloat(document.getElementById('z-opt').value) || 10;
        const raw = pyodide.runPython(`
import json
z_vals, w_vals = fitness_landscape_1d(${zOpt}, ${sigmaSel})
json.dumps({'z_vals': z_vals, 'w_vals': w_vals})
        `);
        const data = JSON.parse(raw);
        plotLandscape1D(data.z_vals, data.w_vals, zOpt);
    } else {
        const zOpt1 = parseFloat(document.getElementById('z-opt-1').value) || 10;
        const zOpt2 = parseFloat(document.getElementById('z-opt-2').value) || 10;
        const raw = pyodide.runPython(`
import json
import numpy as np
z1_vals, z2_vals, w_grid = fitness_landscape_2d(np.array([${zOpt1}, ${zOpt2}]), ${sigmaSel})
json.dumps({'z1_vals': z1_vals, 'z2_vals': z2_vals, 'w_grid': w_grid})
        `);
        const data = JSON.parse(raw);
        plotLandscape2D(data.z1_vals, data.z2_vals, data.w_grid, zOpt1, zOpt2);
    }
}

// collect parameters from UI
function collectParams() {
	const mode = state.mode || 'standard';
    const dim = document.getElementById('n-dim').value;

    const p = {
        n_dim : dim,
        sigma_sel : document.getElementById('sigma-sel').value,
        sigma_m : document.getElementById('sigma-m').value,
        init_spread : document.getElementById('init-spread').value,
        n_pop : document.getElementById('n-pop').value,
        n_gen : document.getElementById('n-gen').value,
        n_reps : document.getElementById('n-reps').value,
        seed : document.getElementById('seed').value
    };
    // dimension-dependent fields
    if (dim === '1') {
        p.z_init = document.getElementById('z-init').value;
        p.z_opt = document.getElementById('z-opt').value;
    } else {
        p.z_init_1 = document.getElementById('z-init-1').value;
        p.z_init_2 = document.getElementById('z-init-2').value;
        p.z_opt_1 = document.getElementById('z-opt-1').value;
        p.z_opt_2 = document.getElementById('z-opt-2').value;
    }
    // migration fields
    if (mode === 'migration') {
        p.mig_rate = document.getElementById('mig-rate').value;
        p.mig_sd = document.getElementById('mig-sd').value;
        if (dim === '1') {
            p.mig_mean = document.getElementById('mig-mean').value;
        } else {
            p.mig_mean_1 = document.getElementById('mig-mean-1').value;
            p.mig_mean_2 = document.getElementById('mig-mean-2').value;
        }
    }
    return p;
}

// run simulation
async function runSimulation() {
    const params = collectParams();
    // disable run button and show status
    document.getElementById('run-btn').disabled = true;
    document.getElementById('status-text').textContent = 'Running...';
    // run simulation in pyodide
    await new Promise(resolve => setTimeout(resolve, 10));  // allow UI to update
    try {
        const raw = pyodide.runPython(`
import json
p = ${JSON.stringify(params)}
n_dim     = int(p['n_dim'])
n_pop     = min(int(p['n_pop']), 10000)
n_gen     = min(int(p['n_gen']), 2000)
n_reps    = min(int(p['n_reps']), 50)
sigma_m   = float(p['sigma_m'])
sigma_sel = float(p['sigma_sel'])
init_spread = float(p['init_spread'])
if n_dim == 1:
    z_init = [float(p['z_init'])]
    z_opt  = [float(p['z_opt'])]
else:
    z_init = [float(p['z_init_1']), float(p['z_init_2'])]
    z_opt  = [float(p['z_opt_1']),  float(p['z_opt_2'])]
mig_rate = float(p.get('mig_rate', 0.0))
mig_sd   = float(p.get('mig_sd',   1.0))
mig_mean = None
if mig_rate > 0:
    if n_dim == 1:
        mig_mean = [float(p['mig_mean'])]
    else:
        mig_mean = [float(p['mig_mean_1']), float(p['mig_mean_2'])]
if p.get('seed', '') != '':
    set_seed(int(p['seed']))
results = run_replicates(
    z_init=z_init, z_opt=z_opt, n_pop=n_pop, n_gen=n_gen,
    sigma_m=sigma_m, sigma_sel=sigma_sel, n_reps=n_reps,
    mig_rate=mig_rate, mig_mean=mig_mean, mig_sd=mig_sd,
    init_spread=init_spread
)
json.dumps({
    'results': results,
    'params' : {
        'n_dim'    : n_dim,
        'n_pop'    : n_pop,
        'n_gen'    : n_gen,
        'n_reps'   : n_reps,
        'z_opt'    : z_opt,
        'z_init'   : z_init,
        'sigma_sel': sigma_sel
    }
})
        `);
        const data = JSON.parse(raw);
        onSimulationComplete(data);
    } catch (err) {
        document.getElementById('status-text').textContent = 'Error: ' + err.message;
        document.getElementById('run-btn').disabled = false;
    }
}

// called when simulation completes
function onSimulationComplete(data) {
    // re-enable run button
    document.getElementById('run-btn').disabled = false;
    document.getElementById('status-text').textContent = 'Done.';
    // store results
    state.simResults = data.results;
    state.simParams = data.params;
    // reset animation state
    stopAnim('pop');
    stopAnim('dist');
    // update scrubber max values
    const nGen = data.params.n_gen;
    document.getElementById('scrub-pop').max = nGen;
    document.getElementById('scrub-pop').value = 0;
    document.getElementById('scrub-dist').max = nGen;
    document.getElementById('scrub-dist').value = 0;
    document.getElementById('gen-label-pop').textContent = 'Gen 0';
    document.getElementById('gen-label-dist').textContent = 'Gen 0';
    // render all visualizations
    renderPopulation(0);
    renderDistribution(0);
    renderTrajectory();
}

// fitness landscape plots
function plotLandscape1D(zVals, wVals, zOpt) {
    const trace = {
        x : zVals,
        y : wVals,
        type : 'scatter',
        mode : 'lines',
        line : { color: '#000080', width: 2 },
        name : 'Fitness'
    };
    const optLine = {
        x : [zOpt, zOpt],
        y : [0, 1],
        type : 'scatter',
        mode : 'lines',
        line : { color: 'red', width: 1, dash: 'dash' },
        name : 'Optimum'
    };
    const layout = {
        xaxis : { title: 'Trait value (z)', zeroline: false },
        yaxis : { title: 'Fitness (W)', range: [0, 1.05] },
        margin : { t: 20, r: 20, b: 50, l: 55 },
        legend : { orientation: 'h', y: -0.2 },
        paper_bgcolor : '#c0c0c0',
        plot_bgcolor : '#ffffff'
    };
    Plotly.newPlot('plot-landscape', [trace, optLine], layout,
                   { responsive: true, displayModeBar: false });
}

function plotLandscape2D(z1Vals, z2Vals, wGrid, zOpt1, zOpt2) {
    const trace = {
        x : z1Vals,
        y : z2Vals,
        z : wGrid,
        type : 'surface',
        colorscale : 'Viridis',
        showscale : false,
        opacity : 0.9
    };
    const layout = {
        scene : {
            xaxis: { title: 'Trait 1 (z₁)' },
            yaxis: { title: 'Trait 2 (z₂)' },
            zaxis: { title: 'Fitness (W)', range: [0, 1] }
        },
        margin: { t: 20, r: 20, b: 20, l: 20 },
        paper_bgcolor: '#c0c0c0'
    };
    Plotly.newPlot('plot-landscape', [trace], layout,
                   { responsive: true, displayModeBar: false });
}

// population on landscape animation
function renderPopulation(frameIdx) {
    if (!state.simResults) return;
    const dim = state.simParams.n_dim;
    const rep = state.simResults[0];
    const popFrame = rep.pop_history[frameIdx];
    const zOpt = state.simParams.z_opt;
    const sigmaSel = state.simParams.sigma_sel;

    if (parseInt(dim) === 1) {
        // build fitness curve
        const zMin = zOpt[0] - 10;
        const zMax = zOpt[0] + 10;
        const zCurve = Array.from({ length: 200 },
                           (_, i) => zMin + i * (zMax - zMin) / 199);
        const wCurve = zCurve.map(z =>
                           Math.exp(-((z - zOpt[0]) ** 2) / (2 * sigmaSel**2)));
        const landscapeTrace = {
            x: zCurve, y: wCurve,
            type : 'scatter', mode: 'lines',
            line : { color: '#808080', width: 2 },
            name : 'Fitness', showlegend: false
        };
        // individual points plotted at their fitness value on the curve
        const zVals = popFrame.map(p => p[0]);
        const wVals = zVals.map(z =>
                          Math.exp(-((z - zOpt[0]) ** 2) / (2 * sigmaSel**2)));
        const popTrace = {
            x: zVals, y: wVals,
            type : 'scatter', mode: 'markers',
            marker : { color: '#000080', size: 4, opacity: 0.5 },
            name : 'Individuals'
        };
        const layout = {
            xaxis : { title: 'Trait value (z)', zeroline: false },
            yaxis : { title: 'Fitness (W)', range: [0, 1.05] },
            margin : { t: 20, r: 20, b: 50, l: 55 },
            paper_bgcolor : '#c0c0c0',
            plot_bgcolor : '#ffffff'
        };
        Plotly.newPlot('plot-population', [landscapeTrace, popTrace],
                       layout, { responsive: true, displayModeBar: false });
    } else {
        // 2D: individuals as scatter colored by fitness
        const zVals1 = popFrame.map(p => p[0]);
        const zVals2 = popFrame.map(p => p[1]);
        const wVals = zVals1.map((z1, i) => {
            const z2 = zVals2[i];
            return Math.exp(
                -(((z1 - zOpt[0]) ** 2) + ((z2 - zOpt[1]) ** 2)) / (2 * sigmaSel**2)
            );
        });
        const popTrace = {
            x: zVals1, y: zVals2,
            type: 'scatter', mode: 'markers',
            marker: {
                color : wVals,
                colorscale : 'Viridis',
                size : 5,
                opacity : 0.6,
                showscale : true,
                cmin: 0, cmax: 1
            },
            name: 'Individuals'
        };
        // compute axis range 
        const zInit = state.simParams.z_init;
        const minX = Math.min(zInit[0], zOpt[0]);
        const maxX = Math.max(zInit[0], zOpt[0]);
        const minY = Math.min(zInit[1], zOpt[1]);
        const maxY = Math.max(zInit[1], zOpt[1]);
        const padX = Math.max((maxX - minX) * 0.3, 5);
        const padY = Math.max((maxY - minY) * 0.3, 5);
        const layout = {
            xaxis : {
                title : 'Trait 1 (z₁)',
                range : [minX - padX, maxX + padX]
            },
            yaxis : {
                title : 'Trait 2 (z₂)',
                range : [minY - padY, maxY + padY]
            },
            margin: { t: 20, r: 20, b: 50, l: 55 },
            paper_bgcolor: '#c0c0c0',
            plot_bgcolor : '#ffffff'
        };
        Plotly.newPlot('plot-population', [popTrace], layout,
                       { responsive: true, displayModeBar: false });
    }
    // update generation label and scrubber
    document.getElementById('gen-label-pop').textContent = `Gen ${frameIdx}`;
    document.getElementById('scrub-pop').value = frameIdx;
}

// trait distribution animation
function renderDistribution(frameIdx) {
    if (!state.simResults) return;
    const dim = state.simParams.n_dim;
    const rep = state.simResults[0];
    const popFrame = rep.pop_history[frameIdx];
    const zOpt = state.simParams.z_opt;

    if (parseInt(dim) === 1) {
        const zVals = popFrame.map(p => p[0]);
        const trace = {
            x : zVals,
            type : 'histogram',
            marker : { color: '#000080', opacity: 0.7 },
            nbinsx : 30,
            name : 'Trait distribution'
        };
        const optLine = {
            x : [zOpt[0], zOpt[0]],
            y : [0, popFrame.length / 5],
            type : 'scatter', mode : 'lines',
            line : { color: 'red', width : 2, dash: 'dash' },
            name : 'Optimum'
        };
        const spread = Math.max(state.simParams.sigma_sel * 6, 10);
        const layout = {
            xaxis : {
                title : 'Trait value (z)',
                range : [zOpt[0] - spread, zOpt[0] + spread]
            },
            yaxis : { title : 'Count' },
            margin : { t : 20, r : 20, b : 50, l : 55 },
            legend : { orientation: 'h', y : -0.2 },
            paper_bgcolor : '#c0c0c0',
            plot_bgcolor : '#ffffff',
            bargap: 0.05
        };
        Plotly.newPlot('plot-distribution', [trace, optLine], layout,
                       { responsive : true, displayModeBar: false });
    } else {
        // 2D: 2D histogram of trait distribution
        const z1Vals = popFrame.map(p => p[0]);
        const z2Vals = popFrame.map(p => p[1]);
        const trace  = {
            x : z1Vals,
            y : z2Vals,
            type : 'histogram2d',
            colorscale : 'Viridis',
            name : 'Trait distribution'
        };
        // compute axis range to show both start and optimum
        const zInit  = state.simParams.z_init;
        const minX = Math.min(zInit[0], zOpt[0]);
        const maxX = Math.max(zInit[0], zOpt[0]);
        const minY = Math.min(zInit[1], zOpt[1]);
        const maxY = Math.max(zInit[1], zOpt[1]);
        const padX = Math.max((maxX - minX) * 0.3, 5);
        const padY = Math.max((maxY - minY) * 0.3, 5);
        const layout = {
            xaxis : {
                title: 'Trait 1 (z₁)',
                range: [minX - padX, maxX + padX]
            },
            yaxis : {
                title: 'Trait 2 (z₂)',
                range: [minY - padY, maxY + padY]
            },
            margin: { t: 20, r: 20, b: 50, l: 55 },
            paper_bgcolor: '#c0c0c0',
            plot_bgcolor : '#ffffff'
        };
        Plotly.newPlot('plot-distribution', [trace], layout,
                       { responsive: true, displayModeBar: false });
    }
    // update generation label and scrubber
    document.getElementById('gen-label-dist').textContent = `Gen ${frameIdx}`;
    document.getElementById('scrub-dist').value = frameIdx;
}

// mean trajectory plot
function renderTrajectory() {
    if (!state.simResults) return;
    const dim = state.simParams.n_dim;
    const nGen = state.simParams.n_gen;
    const zOpt = state.simParams.z_opt;
    const gens = Array.from({ length: nGen + 1 }, (_, i) => i);
    const viridis = [
        '#440154', '#482878', '#3e4989', '#31688e', '#26828e',
        '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725'
    ];

    if (parseInt(dim) === 1) {
        const traces = state.simResults.map((rep, idx) => ({
            x : gens,
            y : rep.mean_history.map(m => m[0]),
            type : 'scatter',
            mode : 'lines',
            line : { color: viridis[idx % viridis.length], width: 2 },
            name : `Rep ${idx + 1}`
        }));
        const optLine = {
            x : [0, nGen],
            y : [zOpt[0], zOpt[0]],
            type : 'scatter', mode: 'lines',
            line : { color: 'black', width: 2, dash: 'dash' },
            name : 'Optimum', showlegend: true
        };
        const layout = {
            xaxis : { title: 'Generation' },
            yaxis : { title: 'Mean trait value (z̄)' },
            margin : { t: 20, r: 20, b: 50, l: 55 },
            legend : { orientation: 'h', y: -0.25 },
            paper_bgcolor: '#c0c0c0',
            plot_bgcolor : '#ffffff'
        };
        Plotly.newPlot('plot-trajectory', [...traces, optLine], layout,
                       { responsive: true, displayModeBar: false });
    } else {
        // 2D: trajectory through trait space as connected scatter
        const traces = state.simResults.map((rep, idx) => ({
            x : rep.mean_history.map(m => m[0]),
            y : rep.mean_history.map(m => m[1]),
            type : 'scatter',
            mode : 'lines+markers',
            marker : { size: 3 },
            line : { color: viridis[idx % viridis.length], width: 2 },
            name : `Rep ${idx + 1}`
        }));
        const optPoint = {
            x : [zOpt[0]],
            y : [zOpt[1]],
            type : 'scatter',
            mode : 'markers',
            marker : { color: 'red', size: 10, symbol: 'x' },
            name : 'Optimum'
        };
        const layout = {
            xaxis : { title: 'Trait 1 (z₁)' },
            yaxis : { title: 'Trait 2 (z₂)' },
            margin : { t: 20, r: 20, b: 50, l: 55 },
            legend : { orientation: 'h', y: -0.25 },
            paper_bgcolor : '#c0c0c0',
            plot_bgcolor : '#ffffff'
        };
        Plotly.newPlot('plot-trajectory', [...traces, optPoint], layout,
                       { responsive: true, displayModeBar: false });
    }
}

// animation controls
function togglePlay(which) {
    const anim = state.animState[which];
    if (anim.playing) {
        stopAnim(which);
    } else {
        startAnim(which);
    }
}

function startAnim(which) {
    const anim = state.animState[which];
    const nGen = state.simParams ? state.simParams.n_gen : 0;
    anim.playing = true;
    document.getElementById(`btn-play-${which}`).textContent = '⏸ Pause';
    anim.timer   = setInterval(() => {
        if (anim.frame >= nGen) {
            stopAnim(which);
            return;
        }
        anim.frame++;
        if (which === 'pop')  renderPopulation(anim.frame);
        if (which === 'dist') renderDistribution(anim.frame);
    }, 50);   // ~20fps
}

function stopAnim(which) {
    const anim = state.animState[which];
    anim.playing = false;
    clearInterval(anim.timer);
    anim.timer = null;
    const btn = document.getElementById(`btn-play-${which}`);
    if (btn) btn.textContent = '\u25B6 Play';
}

function scrubTo(which, frameIdx) {
    stopAnim(which);
    state.animState[which].frame = parseInt(frameIdx);
    if (which === 'pop')  renderPopulation(parseInt(frameIdx));
    if (which === 'dist') renderDistribution(parseInt(frameIdx));
}

// initialize pyodide on page load
async function initPyodide() {
    const msg = document.getElementById('loading-message');
    msg.textContent = 'Loading Python environment...';
    pyodide = await loadPyodide();
    msg.textContent = 'Loading NumPy...';
    await pyodide.loadPackage('numpy');
    msg.textContent = 'Loading simulation...';
    const response = await fetch('simulation.py');
    const simCode = await response.text();
    pyodide.runPython(simCode);
    // hide loading overlay and enable UI
    document.getElementById('loading-overlay').style.display = 'none';
    document.getElementById('run-btn').disabled = false;
    // draw initial fitness landscape
    onDimChange();
    onLandscapeParamChange();
}

initPyodide();
