/**
 * ORSIF Economic Impact Study
 * Main Application JavaScript
 */

const ORSIF = {
    // App state
    state: {
        currentPreset: '2025',
        charts: {}
    },

    /**
     * Initialize the application
     */
    init() {
        this.initNavigation();
        this.initTabs();

        // Page-specific initialization
        const page = document.body.dataset.page;
        if (page === 'calculator') {
            this.initCalculator();
        } else if (page === 'home') {
            this.initHomePage();
        } else if (page === 'comparison') {
            this.initComparison();
        }
    },

    /**
     * Initialize mobile navigation
     */
    initNavigation() {
        const toggle = document.querySelector('.nav-toggle');
        const links = document.querySelector('.nav-links');

        if (toggle && links) {
            toggle.addEventListener('click', () => {
                links.classList.toggle('active');
            });
        }
    },

    /**
     * Initialize tab functionality
     */
    initTabs() {
        const tabs = document.querySelectorAll('.input-tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;

                // Update active states
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                document.getElementById(target)?.classList.add('active');
            });
        });
    },

    /**
     * Initialize home page
     */
    initHomePage() {
        // Load 2025 preset for display
        EconomicCalculator.loadPreset('2025');
        const results = EconomicCalculator.calculate();
        const comparison = EconomicCalculator.compareToBaseline();

        // Update hero stat
        const heroTotal = document.getElementById('hero-total');
        if (heroTotal) {
            heroTotal.textContent = EconomicCalculator.formatCurrency(results.grandTotal);
        }

        // Update comparison badge
        const changeBadge = document.getElementById('change-badge');
        if (changeBadge) {
            changeBadge.textContent = '+' + comparison.formatted.percentChange + ' from 2018';
        }

        // Update key findings
        this.updateKeyFindings(results);

        // Update summary table
        this.updateSummaryTable();
    },

    /**
     * Update key findings cards on home page
     */
    updateKeyFindings(results) {
        const findings = {
            'vsl-value': {
                value: '$13.6M',
                comparison: '+51% from $9M'
            },
            'msd-physician': {
                value: '$94,285',
                comparison: '+109% from $45,000'
            },
            'workforce': {
                value: EconomicCalculator.formatNumber(results.workforce.total),
                comparison: '+9% from 32,838'
            },
            'msd-prevalence': {
                value: '66%',
                comparison: '+13 pts from 53%'
            }
        };

        for (const [id, data] of Object.entries(findings)) {
            const card = document.getElementById(id);
            if (card) {
                const valueEl = card.querySelector('.value');
                const compEl = card.querySelector('.comparison');
                if (valueEl) valueEl.textContent = data.value;
                if (compEl) compEl.textContent = data.comparison;
            }
        }
    },

    /**
     * Initialize calculator page
     */
    initCalculator() {
        this.initPresetSelector();
        this.initSliders();
        this.updateResults();
        this.initCharts();
        this.initExportButtons();
    },

    /**
     * Initialize preset selector
     */
    initPresetSelector() {
        const selector = document.getElementById('preset-selector');
        if (!selector) return;

        selector.addEventListener('change', (e) => {
            const preset = e.target.value;
            if (preset !== 'custom') {
                EconomicCalculator.loadPreset(preset);
                this.updateSliders();
                this.updateResults();
            }
            this.state.currentPreset = preset;
        });
    },

    /**
     * Initialize all sliders
     */
    initSliders() {
        const sliders = document.querySelectorAll('input[type="range"]');

        sliders.forEach(slider => {
            const param = slider.dataset.param;
            if (!param) return;

            // Set initial value
            slider.value = EconomicCalculator.inputs[param];
            this.updateSliderDisplay(slider);

            // Add event listener
            slider.addEventListener('input', (e) => {
                EconomicCalculator.updateInput(param, e.target.value);
                this.updateSliderDisplay(slider);
                this.updateResults();

                // Set to custom preset
                const presetSelector = document.getElementById('preset-selector');
                if (presetSelector && this.state.currentPreset !== 'custom') {
                    presetSelector.value = 'custom';
                    this.state.currentPreset = 'custom';
                }
            });
        });
    },

    /**
     * Update all slider displays to match calculator state
     */
    updateSliders() {
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            const param = slider.dataset.param;
            if (param && EconomicCalculator.inputs[param] !== undefined) {
                slider.value = EconomicCalculator.inputs[param];
                this.updateSliderDisplay(slider);
            }
        });
    },

    /**
     * Update slider value display
     */
    updateSliderDisplay(slider) {
        const param = slider.dataset.param;
        const format = slider.dataset.format || 'number';
        const displayEl = document.getElementById(`${param}-value`);

        if (!displayEl) return;

        const value = parseFloat(slider.value);

        switch (format) {
            case 'currency':
                displayEl.textContent = EconomicCalculator.formatCurrency(value);
                break;
            case 'percent':
                displayEl.textContent = (value * 100).toFixed(1) + '%';
                break;
            case 'years':
                displayEl.textContent = value + ' years';
                break;
            default:
                displayEl.textContent = EconomicCalculator.formatNumber(value);
        }
    },

    /**
     * Update all results displays
     */
    updateResults() {
        const results = EconomicCalculator.calculate();
        const comparison = EconomicCalculator.compareToBaseline();

        // Update grand total
        const totalEl = document.getElementById('grand-total');
        if (totalEl) {
            totalEl.textContent = EconomicCalculator.formatCurrency(results.grandTotal);
        }

        // Update comparison
        const comparisonEl = document.getElementById('comparison-text');
        if (comparisonEl) {
            const sign = comparison.percentChange >= 0 ? '+' : '';
            comparisonEl.textContent = `${sign}${comparison.formatted.percentChange} from 2018 baseline ($48.99M)`;
            comparisonEl.className = comparison.percentChange >= 0 ? 'big-number-comparison increase' : 'big-number-comparison decrease';
        }

        // Update results table
        this.updateResultsTable(results);

        // Update charts
        this.updateCharts();
    },

    /**
     * Update the results breakdown table
     */
    updateResultsTable(results) {
        const tableData = EconomicCalculator.generateTableData();
        const tbody = document.getElementById('results-tbody');
        if (!tbody) return;

        tbody.innerHTML = tableData.map(row => `
            <tr>
                <td>${row.category}</td>
                <td>${row.group}</td>
                <td class="number">${row.cases.toFixed(1)}</td>
                <td class="number">${EconomicCalculator.formatCurrency(row.costPerCase)}</td>
                <td class="number">${EconomicCalculator.formatCurrency(row.total)}</td>
            </tr>
        `).join('');

        // Add total row
        tbody.innerHTML += `
            <tr class="total-row">
                <td colspan="4"><strong>TOTAL</strong></td>
                <td class="number"><strong>${EconomicCalculator.formatCurrency(results.grandTotal)}</strong></td>
            </tr>
        `;
    },

    /**
     * Initialize charts
     */
    initCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        const chartData = EconomicCalculator.getChartData();

        // Cost by category bar chart
        const categoryCtx = document.getElementById('category-chart');
        if (categoryCtx) {
            this.state.charts.category = new Chart(categoryCtx, {
                type: 'bar',
                data: {
                    labels: chartData.byCategory.labels,
                    datasets: [{
                        label: 'Annual Cost',
                        data: chartData.byCategory.data,
                        backgroundColor: chartData.byCategory.colors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => EconomicCalculator.formatCurrency(ctx.raw)
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => EconomicCalculator.formatCurrency(value)
                            }
                        }
                    }
                }
            });
        }

        // Distribution pie chart
        const distributionCtx = document.getElementById('distribution-chart');
        if (distributionCtx) {
            this.state.charts.distribution = new Chart(distributionCtx, {
                type: 'doughnut',
                data: {
                    labels: chartData.byGroup.labels,
                    datasets: [{
                        data: chartData.byGroup.data,
                        backgroundColor: chartData.byGroup.colors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const value = EconomicCalculator.formatCurrency(ctx.raw);
                                    const percent = ((ctx.raw / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                    return `${ctx.label}: ${value} (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Sensitivity chart
        this.initSensitivityChart();
    },

    /**
     * Initialize sensitivity analysis chart
     */
    initSensitivityChart() {
        const ctx = document.getElementById('sensitivity-chart');
        if (!ctx || typeof Chart === 'undefined') return;

        const sensitivityData = EconomicCalculator.getVSLSensitivity();

        this.state.charts.sensitivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sensitivityData.map(d => EconomicCalculator.formatCurrency(d.value)),
                datasets: [{
                    label: 'Total Annual Cost',
                    data: sensitivityData.map(d => d.grandTotal),
                    borderColor: '#0d4d5f',
                    backgroundColor: 'rgba(13, 77, 95, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Impact of VSL on Total Economic Cost'
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `Total: ${EconomicCalculator.formatCurrency(ctx.raw)}`
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Value of Statistical Life (VSL)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Total Annual Cost'
                        },
                        ticks: {
                            callback: (value) => EconomicCalculator.formatCurrency(value)
                        }
                    }
                }
            }
        });
    },

    /**
     * Update charts with new data
     */
    updateCharts() {
        const chartData = EconomicCalculator.getChartData();

        if (this.state.charts.category) {
            this.state.charts.category.data.datasets[0].data = chartData.byCategory.data;
            this.state.charts.category.update();
        }

        if (this.state.charts.distribution) {
            this.state.charts.distribution.data.datasets[0].data = chartData.byGroup.data;
            this.state.charts.distribution.update();
        }

        if (this.state.charts.sensitivity) {
            const sensitivityData = EconomicCalculator.getVSLSensitivity();
            this.state.charts.sensitivity.data.datasets[0].data = sensitivityData.map(d => d.grandTotal);
            this.state.charts.sensitivity.update();
        }
    },

    /**
     * Initialize export buttons
     */
    initExportButtons() {
        const pdfBtn = document.getElementById('export-pdf');
        const copyBtn = document.getElementById('export-copy');
        const shareBtn = document.getElementById('export-share');

        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => this.exportPDF());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyResults());
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareResults());
        }
    },

    /**
     * Export results as PDF
     */
    exportPDF() {
        window.print();
    },

    /**
     * Copy results to clipboard
     */
    async copyResults() {
        const results = EconomicCalculator.calculate();
        const tableData = EconomicCalculator.generateTableData();

        let text = 'ORSIF Economic Impact Study Results\n';
        text += '=' .repeat(40) + '\n\n';
        text += `Total Annual Economic Cost: ${EconomicCalculator.formatCurrency(results.grandTotal)}\n\n`;
        text += 'Breakdown:\n';

        tableData.forEach(row => {
            text += `- ${row.category} (${row.group}): ${EconomicCalculator.formatCurrency(row.total)}\n`;
        });

        text += '\nGenerated by ORSIF Economic Impact Calculator\n';
        text += 'https://orsif.org';

        try {
            await navigator.clipboard.writeText(text);
            alert('Results copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy results. Please try again.');
        }
    },

    /**
     * Share results via URL
     */
    shareResults() {
        const params = new URLSearchParams();
        Object.entries(EconomicCalculator.inputs).forEach(([key, value]) => {
            params.set(key, value);
        });

        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

        if (navigator.share) {
            navigator.share({
                title: 'ORSIF Economic Impact Calculator Results',
                text: `Total Annual Cost: ${EconomicCalculator.formatCurrency(EconomicCalculator.calculate().grandTotal)}`,
                url: url
            });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    },

    /**
     * Load state from URL parameters
     */
    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('vsl')) {
            Object.keys(EconomicCalculator.inputs).forEach(key => {
                if (params.has(key)) {
                    EconomicCalculator.updateInput(key, params.get(key));
                }
            });
            this.state.currentPreset = 'custom';
            return true;
        }
        return false;
    },

    /**
     * Initialize comparison page
     */
    initComparison() {
        const comparison = EconomicCalculator.compareToBaseline();

        // Update 2018 values
        this.updateComparisonColumn('baseline', comparison.baseline);

        // Update 2025 values
        this.updateComparisonColumn('updated', comparison.current);

        // Initialize comparison chart
        this.initComparisonChart(comparison);
    },

    /**
     * Update a comparison column
     */
    updateComparisonColumn(type, results) {
        const container = document.querySelector(`.comparison-column.${type}`);
        if (!container) return;

        const totalEl = container.querySelector('.total-value');
        if (totalEl) {
            totalEl.textContent = EconomicCalculator.formatCurrency(results.grandTotal);
        }
    },

    /**
     * Initialize comparison chart
     */
    initComparisonChart(comparison) {
        const ctx = document.getElementById('comparison-chart');
        if (!ctx || typeof Chart === 'undefined') return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Fatal Cancer', 'Non-Fatal Cancer', 'MSDs'],
                datasets: [
                    {
                        label: '2018',
                        data: [
                            comparison.baseline.cancer.total.fatalCost,
                            comparison.baseline.cancer.total.nonFatalCost,
                            comparison.baseline.msd.total.cost
                        ],
                        backgroundColor: 'rgba(127, 140, 141, 0.7)'
                    },
                    {
                        label: '2025',
                        data: [
                            comparison.current.cancer.total.fatalCost,
                            comparison.current.cancer.total.nonFatalCost,
                            comparison.current.msd.total.cost
                        ],
                        backgroundColor: 'rgba(13, 77, 95, 0.7)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${EconomicCalculator.formatCurrency(ctx.raw)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => EconomicCalculator.formatCurrency(value)
                        }
                    }
                }
            }
        });
    },

    /**
     * Update summary table on home page
     */
    updateSummaryTable() {
        EconomicCalculator.loadPreset('2018');
        const baseline = EconomicCalculator.generateTableData();
        const baselineTotal = EconomicCalculator.calculate().grandTotal;

        EconomicCalculator.loadPreset('2025');
        const current = EconomicCalculator.generateTableData();
        const currentTotal = EconomicCalculator.calculate().grandTotal;

        const tbody = document.getElementById('summary-tbody');
        if (!tbody) return;

        tbody.innerHTML = current.map((row, i) => {
            const baselineRow = baseline[i];
            const change = ((row.total - baselineRow.total) / baselineRow.total * 100);
            const changeClass = change >= 0 ? 'positive' : 'negative';
            const changeSign = change >= 0 ? '+' : '';

            return `
                <tr>
                    <td>${row.category}</td>
                    <td>${row.group}</td>
                    <td class="number">${EconomicCalculator.formatCurrency(baselineRow.total)}</td>
                    <td class="number">${EconomicCalculator.formatCurrency(row.total)}</td>
                    <td class="number change ${changeClass}">${changeSign}${change.toFixed(0)}%</td>
                </tr>
            `;
        }).join('');

        // Total row
        const totalChange = ((currentTotal - baselineTotal) / baselineTotal * 100);
        tbody.innerHTML += `
            <tr class="total-row">
                <td colspan="2"><strong>TOTAL</strong></td>
                <td class="number"><strong>${EconomicCalculator.formatCurrency(baselineTotal)}</strong></td>
                <td class="number"><strong>${EconomicCalculator.formatCurrency(currentTotal)}</strong></td>
                <td class="number"><strong>+${totalChange.toFixed(0)}%</strong></td>
            </tr>
        `;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check for URL parameters first
    if (typeof EconomicCalculator !== 'undefined') {
        ORSIF.loadFromURL();
    }
    ORSIF.init();
});
