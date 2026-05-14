document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
        if (tab.dataset.tab === 'model') loadStats();
    });
});

document.getElementById('btn-predict').addEventListener('click', async () => {
    const f1 = parseFloat(document.getElementById('p-f1').value);
    const f2 = parseFloat(document.getElementById('p-f2').value);
    const f3 = parseFloat(document.getElementById('p-f3').value);

    if (isNaN(f1) || isNaN(f2) || isNaN(f3)) return;

    const res = await fetch('/predict', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({feeder1: f1, feeder2: f2, feeder3: f3})
    });

    const data = await res.json();
    document.getElementById('result-value').textContent = data.predicted_weight;
    document.getElementById('predict-result').style.display = 'block';
});

document.getElementById('btn-add').addEventListener('click', async () => {
    const f1 = parseFloat(document.getElementById('a-f1').value);
    const f2 = parseFloat(document.getElementById('a-f2').value);
    const f3 = parseFloat(document.getElementById('a-f3').value);
    const w = parseFloat(document.getElementById('a-w').value);

    if (isNaN(f1) || isNaN(f2) || isNaN(f3) || isNaN(w)) return;

    const res = await fetch('/add', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({feeder1: f1, feeder2: f2, feeder3: f3, weight: w})
    });

    const data = await res.json();
    const box = document.getElementById('add-result');
    const text = document.getElementById('add-result-text');

    text.textContent = data.retrained
        ? `Сохранено и модель дообучена. Всего записей: ${data.total_rows}`
        : `Сохранено. Записей: ${data.total_rows} (нужно минимум 5 для дообучения)`;

    box.style.display = 'block';
});

async function loadStats() {
    const res = await fetch('/stats');
    const data = await res.json();

    const grid = document.getElementById('stats-grid');
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Питатель 1</div>
            <div class="stat-value">${data.coef_feeder1}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Питатель 2</div>
            <div class="stat-value">${data.coef_feeder2}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Питатель 3</div>
            <div class="stat-value">${data.coef_feeder3}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Новых записей</div>
            <div class="stat-value">${data.new_data_rows}</div>
        </div>
    `;

    document.getElementById('formula').innerHTML = `
        <span>y</span> = ${data.intercept}<br>
        &nbsp;&nbsp;+ <span>${data.coef_feeder1}</span> × Питатель1<br>
        &nbsp;&nbsp;+ <span>${data.coef_feeder2}</span> × Питатель2<br>
        &nbsp;&nbsp;+ <span>${data.coef_feeder3}</span> × Питатель3
    `;
}
