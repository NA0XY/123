document.addEventListener('DOMContentLoaded', function() {
    loadSidebar('patient');

    const name = localStorage.getItem('userName') || 'Jane Doe';
    document.getElementById('patientName').textContent = name;
    document.querySelector('.user-avatar').textContent = name.charAt(0).toUpperCase();

    // Profile Dropdown Logic
    const userInfoToggle = document.getElementById('userInfoToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    userInfoToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    window.addEventListener('click', () => dropdownMenu.classList.remove('show'));
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/index.html';
    });

    // --- SCREENING RECOMMENDATION LOGIC ---
    const personalizedList = document.getElementById('personalizedScreeningList');
    const generalList = document.getElementById('generalRemindersList');

    // Mock patient data for demonstration
    const patientData = {
        id: 'patient01',
        name: 'Jane Doe',
        dateOfBirth: '1988-05-20',
        gender: 'female',
        lifestyle: {
            smoking: false
        },
        familyHistory: ['diabetes', 'heart disease'],
        currentConditions: ['hypertension']
    };

    const mlService = new OneCareMLService();

    async function generateScreeningRecommendations() {
        personalizedList.innerHTML = '<p>Analyzing your health records...</p>';
        
        try {
            const riskAssessment = await mlService.calculateComprehensiveRisk(patientData);
            
            personalizedList.innerHTML = ''; 

            if (riskAssessment.recommendations && riskAssessment.recommendations.length > 0) {
                riskAssessment.recommendations.forEach(rec => {
                    const riskClass = getRiskClass(rec.priority);
                    const iconClass = getIconForRecommendation(rec.type);

                    const listItem = `
                        <div class="screening-list-item ${riskClass}">
                            <div class="screening-icon"><i class="fas ${iconClass}"></i></div>
                            <div class="screening-details">
                                <h4>${rec.title}</h4>
                                <p>${rec.reason}</p>
                            </div>
                            <div class="screening-actions">
                                <button class="schedule-btn">Learn More</button>
                            </div>
                        </div>
                    `;
                    personalizedList.innerHTML += listItem;
                });
            } else {
                personalizedList.innerHTML = '<p>No specific screening recommendations at this time. Keep up the great work!</p>';
            }

        } catch (error) {
            console.error('Error generating recommendations:', error);
            personalizedList.innerHTML = '<p>Could not load screening recommendations at this time.</p>';
        }
    }
    
    function renderGeneralReminders() {
        generalList.innerHTML = '';
        const reminders = [
            { title: 'Annual Physical Exam', reason: 'Recommended annually for preventive care.', priority: 5, type: 'preventive_care' },
            { title: 'Dental Check-up', reason: 'Recommended every 6 months.', priority: 3, type: 'preventive_care' },
            { title: 'Vision Screening', reason: 'Recommended every 2 years.', priority: 2, type: 'screening' }
        ];

        reminders.forEach(rec => {
             const riskClass = 'risk-low'; // General reminders are low risk
             const iconClass = getIconForRecommendation(rec.type);
             const listItem = `
                <div class="screening-list-item ${riskClass}">
                    <div class="screening-icon"><i class="fas ${iconClass}"></i></div>
                    <div class="screening-details">
                        <h4>${rec.title}</h4>
                        <p>${rec.reason}</p>
                    </div>
                    <div class="screening-actions">
                        <button class="schedule-btn">Schedule</button>
                    </div>
                </div>
            `;
            generalList.innerHTML += listItem;
        });
    }

    function getRiskClass(priority) {
        if (priority >= 8) return 'risk-high';
        if (priority >= 5) return 'risk-medium';
        return 'risk-low';
    }

    function getIconForRecommendation(type) {
        switch(type) {
            case 'screening': return 'fa-vial';
            case 'lifestyle': return 'fa-walking';
            case 'preventive_care': return 'fa-calendar-check';
            default: return 'fa-notes-medical';
        }
    }

    // Initial load
    generateScreeningRecommendations();
    renderGeneralReminders();
});