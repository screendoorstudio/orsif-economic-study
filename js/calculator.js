/**
 * ORSIF Economic Impact Calculator
 * Core calculation engine for the economic model
 */

const EconomicCalculator = {
    // Current input values
    inputs: {
        // Workforce
        interventionalCardiologists: 5639,
        interventionalRadiologists: 3358,
        electrophysiologists: 2629,
        nurses: 13000,
        technicians: 11300,

        // Risk parameters
        physicianCancerRisk: 0.01,      // 1% lifetime at 100 mSv
        supportCancerRisk: 0.005,        // 0.5% lifetime at 50 mSv
        cancerFatalityRate: 0.5,         // 50% fatal
        msdAnnualIncidence: 0.018,       // 1.8% per year
        careerDuration: 25,              // years

        // Valuations
        vsl: 13600000,                   // Value of Statistical Life
        nonFatalCancerCost: 250000,      // Cost per non-fatal cancer
        msdPhysicianCost: 94285,         // Spine injury cost
        msdSupportCost: 47316            // General MSD cost
    },

    // Preset configurations
    presets: {
        '2018': {
            interventionalCardiologists: 3255,
            interventionalRadiologists: 3358,
            electrophysiologists: 1925,
            nurses: 13000,
            technicians: 11300,
            physicianCancerRisk: 0.01,
            supportCancerRisk: 0.005,
            cancerFatalityRate: 0.5,
            msdAnnualIncidence: 0.018,
            careerDuration: 25,
            vsl: 9000000,
            nonFatalCancerCost: 200000,
            msdPhysicianCost: 45000,
            msdSupportCost: 12000
        },
        '2025': {
            interventionalCardiologists: 5639,
            interventionalRadiologists: 3358,
            electrophysiologists: 2629,
            nurses: 13000,
            technicians: 11300,
            physicianCancerRisk: 0.01,
            supportCancerRisk: 0.005,
            cancerFatalityRate: 0.5,
            msdAnnualIncidence: 0.018,
            careerDuration: 25,
            vsl: 13600000,
            nonFatalCancerCost: 250000,
            msdPhysicianCost: 94285,
            msdSupportCost: 47316
        }
    },

    /**
     * Load a preset configuration
     */
    loadPreset(presetName) {
        if (this.presets[presetName]) {
            this.inputs = { ...this.presets[presetName] };
            return true;
        }
        return false;
    },

    /**
     * Update a single input value
     */
    updateInput(key, value) {
        if (key in this.inputs) {
            this.inputs[key] = parseFloat(value);
        }
    },

    /**
     * Get total physician count
     */
    getTotalPhysicians() {
        return this.inputs.interventionalCardiologists +
               this.inputs.interventionalRadiologists +
               this.inputs.electrophysiologists;
    },

    /**
     * Get total support staff count
     */
    getTotalSupport() {
        return this.inputs.nurses + this.inputs.technicians;
    },

    /**
     * Calculate cancer cases and costs
     */
    calculateCancer() {
        const {
            physicianCancerRisk,
            supportCancerRisk,
            cancerFatalityRate,
            careerDuration,
            vsl,
            nonFatalCancerCost
        } = this.inputs;

        const totalPhysicians = this.getTotalPhysicians();
        const totalSupport = this.getTotalSupport();

        // Lifetime cancers
        const physicianLifetimeCancers = totalPhysicians * physicianCancerRisk;
        const supportLifetimeCancers = totalSupport * supportCancerRisk;

        // Annual cancers (lifetime / career duration)
        const physicianAnnualCancers = physicianLifetimeCancers / careerDuration;
        const supportAnnualCancers = supportLifetimeCancers / careerDuration;

        // Fatal vs non-fatal split
        const physicianFatalCancers = physicianAnnualCancers * cancerFatalityRate;
        const physicianNonFatalCancers = physicianAnnualCancers * (1 - cancerFatalityRate);
        const supportFatalCancers = supportAnnualCancers * cancerFatalityRate;
        const supportNonFatalCancers = supportAnnualCancers * (1 - cancerFatalityRate);

        // Costs
        const fatalCancerCostPhysicians = physicianFatalCancers * vsl;
        const fatalCancerCostSupport = supportFatalCancers * vsl;
        const nonFatalCancerCostPhysicians = physicianNonFatalCancers * nonFatalCancerCost;
        const nonFatalCancerCostSupport = supportNonFatalCancers * nonFatalCancerCost;

        return {
            physicians: {
                fatal: {
                    cases: physicianFatalCancers,
                    cost: fatalCancerCostPhysicians
                },
                nonFatal: {
                    cases: physicianNonFatalCancers,
                    cost: nonFatalCancerCostPhysicians
                },
                totalCases: physicianAnnualCancers,
                totalCost: fatalCancerCostPhysicians + nonFatalCancerCostPhysicians
            },
            support: {
                fatal: {
                    cases: supportFatalCancers,
                    cost: fatalCancerCostSupport
                },
                nonFatal: {
                    cases: supportNonFatalCancers,
                    cost: nonFatalCancerCostSupport
                },
                totalCases: supportAnnualCancers,
                totalCost: fatalCancerCostSupport + nonFatalCancerCostSupport
            },
            total: {
                fatalCases: physicianFatalCancers + supportFatalCancers,
                fatalCost: fatalCancerCostPhysicians + fatalCancerCostSupport,
                nonFatalCases: physicianNonFatalCancers + supportNonFatalCancers,
                nonFatalCost: nonFatalCancerCostPhysicians + nonFatalCancerCostSupport,
                totalCases: physicianAnnualCancers + supportAnnualCancers,
                totalCost: fatalCancerCostPhysicians + fatalCancerCostSupport +
                           nonFatalCancerCostPhysicians + nonFatalCancerCostSupport
            }
        };
    },

    /**
     * Calculate MSD cases and costs
     */
    calculateMSD() {
        const { msdAnnualIncidence, msdPhysicianCost, msdSupportCost } = this.inputs;

        const totalPhysicians = this.getTotalPhysicians();
        const totalSupport = this.getTotalSupport();

        // Annual MSD cases
        const physicianMSDCases = totalPhysicians * msdAnnualIncidence;
        const supportMSDCases = totalSupport * msdAnnualIncidence;

        // Costs
        const physicianMSDCostTotal = physicianMSDCases * msdPhysicianCost;
        const supportMSDCostTotal = supportMSDCases * msdSupportCost;

        return {
            physicians: {
                cases: physicianMSDCases,
                costPerCase: msdPhysicianCost,
                cost: physicianMSDCostTotal
            },
            support: {
                cases: supportMSDCases,
                costPerCase: msdSupportCost,
                cost: supportMSDCostTotal
            },
            total: {
                cases: physicianMSDCases + supportMSDCases,
                cost: physicianMSDCostTotal + supportMSDCostTotal
            }
        };
    },

    /**
     * Calculate all results
     */
    calculate() {
        const cancer = this.calculateCancer();
        const msd = this.calculateMSD();
        const grandTotal = cancer.total.totalCost + msd.total.cost;

        return {
            cancer,
            msd,
            grandTotal,
            workforce: {
                physicians: this.getTotalPhysicians(),
                support: this.getTotalSupport(),
                total: this.getTotalPhysicians() + this.getTotalSupport()
            },
            breakdown: {
                fatalCancerPhysicians: cancer.physicians.fatal.cost,
                fatalCancerSupport: cancer.support.fatal.cost,
                nonFatalCancerPhysicians: cancer.physicians.nonFatal.cost,
                nonFatalCancerSupport: cancer.support.nonFatal.cost,
                msdPhysicians: msd.physicians.cost,
                msdSupport: msd.support.cost
            }
        };
    },

    /**
     * Compare current results with baseline (2018)
     */
    compareToBaseline() {
        // Calculate current
        const current = this.calculate();

        // Calculate 2018 baseline
        const savedInputs = { ...this.inputs };
        this.loadPreset('2018');
        const baseline = this.calculate();

        // Restore current inputs
        this.inputs = savedInputs;

        const change = current.grandTotal - baseline.grandTotal;
        const percentChange = ((current.grandTotal - baseline.grandTotal) / baseline.grandTotal) * 100;

        return {
            current,
            baseline,
            change,
            percentChange,
            formatted: {
                change: this.formatCurrency(change),
                percentChange: percentChange.toFixed(1) + '%'
            }
        };
    },

    /**
     * Format number as currency
     */
    formatCurrency(value) {
        if (value >= 1000000000) {
            return '$' + (value / 1000000000).toFixed(2) + 'B';
        } else if (value >= 1000000) {
            return '$' + (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return '$' + (value / 1000).toFixed(0) + 'K';
        }
        return '$' + value.toFixed(0);
    },

    /**
     * Format number with commas
     */
    formatNumber(value, decimals = 0) {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    /**
     * Generate table data for display
     */
    generateTableData() {
        const results = this.calculate();
        const cancer = results.cancer;
        const msd = results.msd;

        return [
            {
                category: 'Fatal Cancer',
                group: 'Physicians',
                cases: cancer.physicians.fatal.cases,
                costPerCase: this.inputs.vsl,
                total: cancer.physicians.fatal.cost
            },
            {
                category: 'Fatal Cancer',
                group: 'Nurses and Techs',
                cases: cancer.support.fatal.cases,
                costPerCase: this.inputs.vsl,
                total: cancer.support.fatal.cost
            },
            {
                category: 'Non-Fatal Cancer',
                group: 'Physicians',
                cases: cancer.physicians.nonFatal.cases,
                costPerCase: this.inputs.nonFatalCancerCost,
                total: cancer.physicians.nonFatal.cost
            },
            {
                category: 'Non-Fatal Cancer',
                group: 'Nurses and Techs',
                cases: cancer.support.nonFatal.cases,
                costPerCase: this.inputs.nonFatalCancerCost,
                total: cancer.support.nonFatal.cost
            },
            {
                category: 'Musculoskeletal Disorders',
                group: 'Physicians',
                cases: msd.physicians.cases,
                costPerCase: this.inputs.msdPhysicianCost,
                total: msd.physicians.cost
            },
            {
                category: 'Musculoskeletal Disorders',
                group: 'Nurses and Techs',
                cases: msd.support.cases,
                costPerCase: this.inputs.msdSupportCost,
                total: msd.support.cost
            }
        ];
    },

    /**
     * Get chart data for visualization
     */
    getChartData() {
        const results = this.calculate();

        return {
            byCategory: {
                labels: ['Fatal Cancer', 'Non-Fatal Cancer', 'MSDs'],
                data: [
                    results.cancer.total.fatalCost,
                    results.cancer.total.nonFatalCost,
                    results.msd.total.cost
                ],
                colors: ['#c0392b', '#e74c3c', '#2980b9']
            },
            byGroup: {
                labels: ['Physicians', 'Support Staff'],
                data: [
                    results.cancer.physicians.totalCost + results.msd.physicians.cost,
                    results.cancer.support.totalCost + results.msd.support.cost
                ],
                colors: ['#8e44ad', '#16a085']
            },
            breakdown: {
                labels: [
                    'Fatal Cancer (Physicians)',
                    'Fatal Cancer (Support)',
                    'Non-Fatal Cancer (Physicians)',
                    'Non-Fatal Cancer (Support)',
                    'MSDs (Physicians)',
                    'MSDs (Support)'
                ],
                data: [
                    results.cancer.physicians.fatal.cost,
                    results.cancer.support.fatal.cost,
                    results.cancer.physicians.nonFatal.cost,
                    results.cancer.support.nonFatal.cost,
                    results.msd.physicians.cost,
                    results.msd.support.cost
                ],
                colors: ['#c0392b', '#e74c3c', '#9b59b6', '#8e44ad', '#2980b9', '#3498db']
            }
        };
    },

    /**
     * Run sensitivity analysis on a parameter
     */
    sensitivityAnalysis(param, values) {
        const savedValue = this.inputs[param];
        const results = [];

        for (const value of values) {
            this.inputs[param] = value;
            const calc = this.calculate();
            results.push({
                value,
                grandTotal: calc.grandTotal
            });
        }

        this.inputs[param] = savedValue;
        return results;
    },

    /**
     * Get VSL sensitivity data
     */
    getVSLSensitivity() {
        const vslValues = [6300000, 9000000, 11000000, 13600000, 16000000, 18000000, 20700000];
        return this.sensitivityAnalysis('vsl', vslValues);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EconomicCalculator;
}
