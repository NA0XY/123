/**
 * Health Records Dashboard JavaScript
 * Handles data visualization, analytics, and interactive dashboard features
 */

class HealthDashboard {
    constructor() {
        this.charts = {};
        this.currentFilter = '30';
        this.apiBase = 'http://localhost:3004/api';
        this.healthRecords = null;
        this.refreshInterval = null;

        // Chart color schemes
        this.colors = {
            primary: '#4A90E2',
            secondary: '#50C878',
            tertiary: '#FFD700',
            quaternary: '#FF6B6B',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8',
            light: '#f8f9fa',
            dark: '#343a40'
        };

        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        };

        // Sample health metrics data for demo
        this.sampleHealthMetrics = {
            blood_pressure: {
                label: 'Blood Pressure (mmHg)',
                data: [
                    { date: '2024-01-15', systolic: 120, diastolic: 80 },
                    { date: '2024-01-20', systolic: 118, diastolic: 78 },
                    { date: '2024-01-25', systolic: 122, diastolic: 82 },
                    { date: '2024-02-01', systolic: 119, diastolic: 79 },
                    { date: '2024-02-05', systolic: 121, diastolic: 81 },
                    { date: '2024-02-10', systolic: 117, diastolic: 77 },
                    { date: '2024-02-15', systolic: 120, diastolic: 80 }
                ]
            },
            weight: {
                label: 'Weight (kg)',
                data: [
                    { date: '2024-01-15', value: 75.2 },
                    { date: '2024-01-22', value: 74.8 },
                    { date: '2024-01-29', value: 74.5 },
                    { date: '2024-02-05', value: 74.2 },
                    { date: '2024-02-12', value: 73.9 },
                    { date: '2024-02-19', value: 73.7 }
                ]
            },
            glucose: {
                label: 'Blood Glucose (mg/dL)',
                data: [
                    { date: '2024-01-15', value: 95 },
                    { date: '2024-01-18', value: 92 },
                    { date: '2024-01-21', value: 98 },
                    { date: '2024-01-24', value: 94 },
                    { date: '2024-01-27', value: 96 },
                    { date: '2024-01-30', value: 93 },
                    { date: '2024-02-02', value: 97 }
                ]
            },
            heart_rate: {
                label: 'Heart Rate (bpm)',
                data: [
                    { date: '2024-01-15', value: 72 },
                    { date: '2024-01-18', value: 75 },
                    { date: '2024-01-21', value: 73 },
                    { date: '2024-01-24', value: 71 },
                    { date: '2024-01-27', value: 74 },
                    { date: '2024-01-30', value: 72 },
                    { date: '2024-02-02', value: 73 }
                ]
            }
        };

        this.init();
    }

    /**
     * Initialize dashboard
     */
    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.setupAutoRefresh();
        this.setupModalHandlers();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Date filter change
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.loadDashboardData();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.openExportModal();
            });
        }

        // Chart toggles
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('chart-toggle')) {
                this.handleChartToggle(e.target);
            }
        });

        // Metric selector
        const metricSelector = document.getElementById('metricSelector');
        if (metricSelector) {
            metricSelector.addEventListener('change', (e) => {
                this.updateHealthMetricsChart(e.target.value);
            });
        }

        // Export form
        const exportForm = document.getElementById('exportForm');
        if (exportForm) {
            exportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleExport();
            });
        }

        // Refresh insights
        const refreshInsights = document.getElementById('refreshInsights');
        if (refreshInsights) {
            refreshInsights.addEventListener('click', () => {
                this.refreshHealthInsights();
            });
        }

        // Export table
        const exportTableBtn = document.getElementById('exportTableBtn');
        if (exportTableBtn) {
            exportTableBtn.addEventListener('click', () => {
                this.exportTable();
            });
        }
    }

    /**
     * Setup auto-refresh
     */
    setupAutoRefresh() {
        // Refresh dashboard data every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData(false); // Silent refresh
        }, 5 * 60 * 1000);
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData(showLoading = true) {
        if (showLoading) {
            this.showLoading();
        }

        try {
            // Get health records instance
            if (typeof HealthRecordsSystem !== 'undefined' && window.healthRecordsSystem) {
                this.healthRecords = window.healthRecordsSystem;
            } else {
                // Create a temporary instance for data
                this.healthRecords = {
                    records: this.generateSampleData(),
                    categories: [
                        { id: 'lab-results', name: 'Lab Results', color: '#4A90E2' },
                        { id: 'prescriptions', name: 'Prescriptions', color: '#50C878' },
                        { id: 'imaging', name: 'Imaging', color: '#FFD700' },
                        { id: 'visits', name: 'Doctor Visits', color: '#FF6B6B' },
                        { id: 'vaccinations', name: 'Vaccinations', color: '#17a2b8' }
                    ]
                };
            }

            await Promise.all([
                this.updateMetrics(),
                this.loadCharts(),
                this.loadRecentActivity(),
                this.loadHealthInsights(),
                this.loadReminders(),
                this.loadAnalyticsTables()
            ]);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        } finally {
            if (showLoading) {
                this.hideLoading();
            }
        }
    }

    /**
     * Generate sample data for demo
     */
    generateSampleData() {
        const categories = ['lab-results', 'prescriptions', 'imaging', 'visits', 'vaccinations'];
        const fileTypes = ['.pdf', '.jpg', '.png', '.doc', '.txt'];
        const providers = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'City Hospital', 'Medical Center'];
        
        const records = [];
        const now = new Date();

        for (let i = 0; i < 50; i++) {
            const daysAgo = Math.floor(Math.random() * 365);
            const recordDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
            
            records.push({
                id: `record_${i}`,
                title: `Health Record ${i + 1}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                uploadDate: recordDate.toISOString(),
                fileType: fileTypes[Math.floor(Math.random() * fileTypes.length)],
                fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB to 5MB
                provider: providers[Math.floor(Math.random() * providers.length)],
                tags: ['health', 'medical', 'record']
            });
        }

        return records;
    }

    /**
     * Update key metrics
     */
    async updateMetrics() {
        const records = this.healthRecords.records;
        const filteredRecords = this.filterRecordsByDate(records);

        // Total records
        document.getElementById('totalRecords').textContent = records.length;

        // Recent uploads (based on filter)
        document.getElementById('recentUploads').textContent = filteredRecords.length;

        // Health score (calculated based on various factors)
        const healthScore = this.calculateHealthScore(records);
        document.getElementById('healthScore').textContent = healthScore;

        // Pending actions (sample data)
        const pendingActions = Math.floor(Math.random() * 10);
        document.getElementById('pendingActions').textContent = pendingActions;

        // Update trend indicators
        this.updateTrendIndicators(filteredRecords);
    }

    /**
     * Calculate health score
     */
    calculateHealthScore(records) {
        let score = 70; // Base score

        // Increase score based on recent uploads
        const recentRecords = this.filterRecordsByDate(records, 30);
        score += Math.min(recentRecords.length * 2, 20);

        // Increase score based on variety of categories
        const categories = [...new Set(records.map(r => r.category))];
        score += categories.length * 2;

        return Math.min(Math.round(score), 100);
    }

    /**
     * Update trend indicators
     */
    updateTrendIndicators(records) {
        // Calculate trends based on historical data
        const previousPeriod = this.filterRecordsByDate(this.healthRecords.records, this.currentFilter * 2, this.currentFilter);
        const currentPeriod = records;

        const recordsChange = ((currentPeriod.length - previousPeriod.length) / Math.max(previousPeriod.length, 1) * 100).toFixed(0);
        const uploadsChangeEl = document.getElementById('uploadsChange');
        if (uploadsChangeEl) {
            uploadsChangeEl.textContent = `${recordsChange > 0 ? '+' : ''}${recordsChange}% this period`;
            uploadsChangeEl.className = `metric-change ${recordsChange > 0 ? 'positive' : recordsChange < 0 ? 'negative' : 'neutral'}`;
        }
    }

    /**
     * Filter records by date range
     */
    filterRecordsByDate(records, days = this.currentFilter, offsetDays = 0) {
        if (days === 'all') return records;

        const now = new Date();
        const startDate = new Date(now.getTime() - ((parseInt(days) + offsetDays) * 24 * 60 * 60 * 1000));
        const endDate = offsetDays > 0 ? new Date(now.getTime() - (offsetDays * 24 * 60 * 60 * 1000)) : now;

        return records.filter(record => {
            const recordDate = new Date(record.uploadDate);
            return recordDate >= startDate && recordDate <= endDate;
        });
    }

    /**
     * Load all charts
     */
    async loadCharts() {
        await Promise.all([
            this.createTimelineChart(),
            this.createCategoryChart(),
            this.createFileTypesChart(),
            this.createHealthMetricsChart()
        ]);
    }

    /**
     * Create timeline chart
     */
    createTimelineChart() {
        const canvas = document.getElementById('timelineChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const records = this.filterRecordsByDate(this.healthRecords.records);

        // Group records by date
        const recordsByDate = {};
        records.forEach(record => {
            const date = new Date(record.uploadDate).toISOString().split('T')[0];
            recordsByDate[date] = (recordsByDate[date] || 0) + 1;
        });

        // Generate date range
        const dates = this.generateDateRange(this.currentFilter);
        const data = dates.map(date => recordsByDate[date] || 0);

        // Destroy existing chart
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(date => this.formatChartDate(date)),
                datasets: [{
                    label: 'Records Uploaded',
                    data: data,
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    /**
     * Create category distribution chart
     */
    createCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const records = this.filterRecordsByDate(this.healthRecords.records);

        // Count records by category
        const categoryCounts = {};
        records.forEach(record => {
            categoryCounts[record.category] = (categoryCounts[record.category] || 0) + 1;
        });

        const categories = this.healthRecords.categories || [];
        const labels = categories.map(cat => cat.name);
        const data = categories.map(cat => categoryCounts[cat.id] || 0);
        const colors = categories.map(cat => cat.color || this.colors.primary);

        // Destroy existing chart
        if (this.charts.category) {
            this.charts.category.destroy();
        }

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    /**
     * Create file types chart
     */
    createFileTypesChart() {
        const canvas = document.getElementById('fileTypesChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const records = this.filterRecordsByDate(this.healthRecords.records);

        // Count records by file type
        const fileTypeCounts = {};
        records.forEach(record => {
            const ext = record.fileType || '.pdf';
            fileTypeCounts[ext] = (fileTypeCounts[ext] || 0) + 1;
        });

        const labels = Object.keys(fileTypeCounts);
        const data = Object.values(fileTypeCounts);

        // Destroy existing chart
        if (this.charts.fileTypes) {
            this.charts.fileTypes.destroy();
        }

        this.charts.fileTypes = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Files by Type',
                    data: data,
                    backgroundColor: [
                        this.colors.primary,
                        this.colors.secondary,
                        this.colors.tertiary,
                        this.colors.quaternary,
                        this.colors.info
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    /**
     * Create health metrics chart
     */
    createHealthMetricsChart(metricType = 'blood_pressure') {
        const canvas = document.getElementById('healthMetricsChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const metricData = this.sampleHealthMetrics[metricType];

        if (!metricData) return;

        // Destroy existing chart
        if (this.charts.healthMetrics) {
            this.charts.healthMetrics.destroy();
        }

        const labels = metricData.data.map(item => this.formatChartDate(item.date));
        let datasets = [];

        if (metricType === 'blood_pressure') {
            datasets = [
                {
                    label: 'Systolic',
                    data: metricData.data.map(item => item.systolic),
                    borderColor: this.colors.error,
                    backgroundColor: this.colors.error + '20',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Diastolic',
                    data: metricData.data.map(item => item.diastolic),
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    borderWidth: 2,
                    tension: 0.4
                }
            ];
        } else {
            datasets = [{
                label: metricData.label,
                data: metricData.data.map(item => item.value),
                borderColor: this.colors.secondary,
                backgroundColor: this.colors.secondary + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }];
        }

        this.charts.healthMetrics = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                ...this.chartOptions,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    /**
     * Update health metrics chart
     */
    updateHealthMetricsChart(metricType) {
        this.createHealthMetricsChart(metricType);
    }

    /**
     * Handle chart toggle
     */
    handleChartToggle(button) {
        const chartType = button.dataset.chart;
        const displayType = button.dataset.type;

        // Update active state
        button.parentElement.querySelectorAll('.chart-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Update chart type
        if (chartType === 'timeline') {
            this.updateChartType('timeline', displayType);
        } else if (chartType === 'category') {
            this.updateChartType('category', displayType);
        }
    }

    /**
     * Update chart type
     */
    updateChartType(chartName, newType) {
        if (this.charts[chartName]) {
            this.charts[chartName].config.type = newType;
            this.charts[chartName].update();
        }
    }

    /**
     * Load recent activity
     */
    loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const recentRecords = this.healthRecords.records
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
            .slice(0, 10);

        const activities = recentRecords.map(record => ({
            type: 'upload',
            title: `Uploaded ${record.title}`,
            description: `Added to ${this.getCategoryName(record.category)}`,
            time: this.timeAgo(record.uploadDate),
            icon: 'fas fa-upload'
        }));

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-desc">${activity.description}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load health insights
     */
    loadHealthInsights() {
        const container = document.getElementById('healthInsights');
        if (!container) return;

        const insights = [
            {
                type: 'success',
                title: 'Complete Health Records',
                description: 'You have uploaded records from all major categories this month.'
            },
            {
                type: 'warning',
                title: 'Annual Checkup Due',
                description: 'Consider scheduling your annual physical examination.'
            },
            {
                type: 'info',
                title: 'Medication Tracking',
                description: 'Your prescription uploads show good medication adherence.'
            },
            {
                type: 'warning',
                title: 'Lab Results Pending',
                description: 'You have recent lab orders that may have results available.'
            }
        ];

        container.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-desc">${insight.description}</div>
            </div>
        `).join('');
    }

    /**
     * Refresh health insights
     */
    refreshHealthInsights() {
        this.loadHealthInsights();
        this.showNotification('Health insights updated', 'success');
    }

    /**
     * Load reminders
     */
    loadReminders() {
        const container = document.getElementById('upcomingReminders');
        if (!container) return;

        const reminders = [
            {
                priority: 'urgent',
                title: 'Blood Work Follow-up',
                time: 'Due in 2 days'
            },
            {
                priority: 'soon',
                title: 'Medication Refill',
                time: 'Due next week'
            },
            {
                priority: 'normal',
                title: 'Dental Cleaning',
                time: 'Due in 2 weeks'
            },
            {
                priority: 'normal',
                title: 'Eye Exam',
                time: 'Due in 1 month'
            }
        ];

        container.innerHTML = reminders.map(reminder => `
            <div class="reminder-item">
                <div class="reminder-status ${reminder.priority}"></div>
                <div class="reminder-content">
                    <div class="reminder-title">${reminder.title}</div>
                    <div class="reminder-time">${reminder.time}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load analytics tables
     */
    loadAnalyticsTables() {
        this.loadRecordsSummaryTable();
        this.loadProvidersTable();
    }

    /**
     * Load records summary table
     */
    loadRecordsSummaryTable() {
        const tbody = document.querySelector('#recordsSummaryTable tbody');
        if (!tbody) return;

        const categories = this.healthRecords.categories || [];
        const records = this.healthRecords.records;

        const summaryData = categories.map(category => {
            const categoryRecords = records.filter(r => r.category === category.id);
            const totalSize = categoryRecords.reduce((sum, r) => sum + (r.fileSize || 0), 0);
            const avgSize = categoryRecords.length > 0 ? totalSize / categoryRecords.length : 0;
            const latestUpload = categoryRecords.length > 0 
                ? new Date(Math.max(...categoryRecords.map(r => new Date(r.uploadDate))))
                : null;

            return {
                category: category.name,
                count: categoryRecords.length,
                latestUpload: latestUpload,
                totalSize: totalSize,
                avgSize: avgSize,
                trend: Math.random() > 0.5 ? 'up' : 'down' // Sample trend
            };
        });

        tbody.innerHTML = summaryData.map(row => `
            <tr>
                <td>${row.category}</td>
                <td>${row.count}</td>
                <td>${row.latestUpload ? this.formatDate(row.latestUpload) : 'N/A'}</td>
                <td>${this.formatFileSize(row.totalSize)}</td>
                <td>${this.formatFileSize(row.avgSize)}</td>
                <td>
                    <span class="trend-indicator ${row.trend}">
                        <i class="fas fa-arrow-${row.trend === 'up' ? 'up' : 'down'}"></i>
                        ${row.trend === 'up' ? '+' : '-'}${Math.floor(Math.random() * 20)}%
                    </span>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Load providers table
     */
    loadProvidersTable() {
        const tbody = document.querySelector('#providersTable tbody');
        if (!tbody) return;

        const providers = [
            {
                name: 'Dr. Smith (Cardiology)',
                records: 12,
                lastVisit: '2024-02-15',
                upcoming: '2024-03-20',
                phone: '(555) 123-4567'
            },
            {
                name: 'Dr. Johnson (Family Medicine)',
                records: 8,
                lastVisit: '2024-01-28',
                upcoming: 'N/A',
                phone: '(555) 234-5678'
            },
            {
                name: 'City Hospital',
                records: 15,
                lastVisit: '2024-02-10',
                upcoming: 'N/A',
                phone: '(555) 345-6789'
            },
            {
                name: 'Dr. Williams (Dermatology)',
                records: 4,
                lastVisit: '2023-12-15',
                upcoming: '2024-04-10',
                phone: '(555) 456-7890'
            }
        ];

        tbody.innerHTML = providers.map(provider => `
            <tr>
                <td>${provider.name}</td>
                <td>${provider.records}</td>
                <td>${this.formatDate(new Date(provider.lastVisit))}</td>
                <td>${provider.upcoming !== 'N/A' ? this.formatDate(new Date(provider.upcoming)) : 'N/A'}</td>
                <td>
                    <div class="provider-contact">
                        <span>${provider.name.split(' (')[0]}</span>
                        <span class="provider-phone">${provider.phone}</span>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Setup modal handlers
     */
    setupModalHandlers() {
        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.dataset.modal) {
                const modalId = e.target.dataset.modal || e.target.closest('.modal').id;
                this.closeModal(modalId);
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.active');
                openModals.forEach(modal => modal.classList.remove('active'));
            }
        });
    }

    /**
     * Open export modal
     */
    openExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Handle export
     */
    async handleExport() {
        const form = document.getElementById('exportForm');
        const formData = new FormData(form);
        
        const exportData = {
            format: formData.get('exportFormat'),
            dateRange: formData.get('exportDateRange'),
            sections: [...formData.getAll('sections')]
        };

        try {
            this.showLoading();
            
            // Simulate export process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate and download file
            this.generateExportFile(exportData);
            
            this.closeModal('exportModal');
            this.showNotification('Report exported successfully', 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Export failed', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Generate export file
     */
    generateExportFile(exportData) {
        const dashboardData = this.collectDashboardData(exportData.dateRange, exportData.sections);
        
        switch (exportData.format) {
            case 'pdf':
                this.exportToPDF(dashboardData);
                break;
            case 'csv':
                this.exportToCSV(dashboardData);
                break;
            case 'excel':
                this.exportToExcel(dashboardData);
                break;
            case 'json':
                this.exportToJSON(dashboardData);
                break;
        }
    }

    /**
     * Collect dashboard data for export
     */
    collectDashboardData(dateRange, sections) {
        const records = this.filterRecordsByDate(this.healthRecords.records, dateRange);
        
        return {
            exportDate: new Date().toISOString(),
            dateRange: dateRange,
            sections: sections,
            metrics: {
                totalRecords: this.healthRecords.records.length,
                recordsInPeriod: records.length,
                healthScore: this.calculateHealthScore(this.healthRecords.records)
            },
            records: records,
            categories: this.healthRecords.categories,
            summary: this.generateSummaryData(records)
        };
    }

    /**
     * Export to CSV
     */
    exportToCSV(data) {
        const csvContent = this.convertToCSV(data.records);
        this.downloadFile(csvContent, 'health-dashboard-data.csv', 'text/csv');
    }

    /**
     * Export to JSON
     */
    exportToJSON(data) {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, 'health-dashboard-data.json', 'application/json');
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(records) {
        const headers = ['ID', 'Title', 'Category', 'Upload Date', 'File Type', 'File Size', 'Provider'];
        const rows = records.map(record => [
            record.id,
            record.title,
            this.getCategoryName(record.category),
            this.formatDate(new Date(record.uploadDate)),
            record.fileType || 'N/A',
            this.formatFileSize(record.fileSize || 0),
            record.provider || 'N/A'
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return csvContent;
    }

    /**
     * Download file
     */
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export table data
     */
    exportTable() {
        const table = document.getElementById('recordsSummaryTable');
        const csvContent = this.tableToCSV(table);
        this.downloadFile(csvContent, 'records-summary.csv', 'text/csv');
        this.showNotification('Table exported successfully', 'success');
    }

    /**
     * Convert table to CSV
     */
    tableToCSV(table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.map(row => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            return cells.map(cell => `"${cell.textContent.trim()}"`).join(',');
        }).join('\n');
    }

    /**
     * Refresh dashboard
     */
    refreshDashboard() {
        this.loadDashboardData(true);
        this.showNotification('Dashboard refreshed', 'success');
    }

    /**
     * Generate date range for charts
     */
    generateDateRange(days) {
        if (days === 'all') {
            // Return last 30 days as default
            days = 30;
        }

        const dates = [];
        const now = new Date();
        
        for (let i = parseInt(days) - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            dates.push(date.toISOString().split('T')[0]);
        }
        
        return dates;
    }

    /**
     * Format date for charts
     */
    formatChartDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    /**
     * Get category name by ID
     */
    getCategoryName(categoryId) {
        const category = this.healthRecords.categories?.find(cat => cat.id === categoryId);
        return category ? category.name : categoryId;
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format date
     */
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Time ago helper
     */
    timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInDays > 0) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        } else if (diffInHours > 0) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else {
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        }
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Use the existing notification system from health-records-system.js
        if (window.healthRecordsSystem && window.healthRecordsSystem.showNotification) {
            window.healthRecordsSystem.showNotification(message, type);
        } else {
            // Fallback notification
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Generate summary data
     */
    generateSummaryData(records) {
        const categories = {};
        const providers = {};
        
        records.forEach(record => {
            // Count by category
            if (!categories[record.category]) {
                categories[record.category] = { count: 0, totalSize: 0 };
            }
            categories[record.category].count++;
            categories[record.category].totalSize += record.fileSize || 0;

            // Count by provider
            if (record.provider) {
                providers[record.provider] = (providers[record.provider] || 0) + 1;
            }
        });

        return {
            totalRecords: records.length,
            categoriesData: categories,
            providersData: providers,
            averageFileSize: records.reduce((sum, r) => sum + (r.fileSize || 0), 0) / records.length,
            dateRange: {
                earliest: records.length > 0 ? new Date(Math.min(...records.map(r => new Date(r.uploadDate)))) : null,
                latest: records.length > 0 ? new Date(Math.max(...records.map(r => new Date(r.uploadDate)))) : null
            }
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        this.charts = {};
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthDashboard;
}

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.healthDashboard = new HealthDashboard();
    });
} else {
    window.healthDashboard = new HealthDashboard();
}