function getSidebarHtml(role) {
    const patientNav = `
        <div class="logo">
            <i class="fas fa-heart-pulse"></i>
            <span>OneCare</span>
        </div>
        <div class="nav-section-title">My Portal</div>
        <ul class="nav-menu">
            <li><a href="patient-dashboard.html" class="nav-link" data-page="patient-dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a></li>
            <li><a href="appointments.html" class="nav-link" data-page="appointments"><i class="fas fa-calendar-alt"></i><span>Appointments</span></a></li>
            <li><a href="messages.html" class="nav-link" data-page="messages"><i class="fas fa-envelope"></i><span>Messages</span></a></li>
            <li><a href="patient-medications.html" class="nav-link" data-page="patient-medications"><i class="fas fa-pills"></i><span>Medications</span></a></li>
            <li><a href="patient-health-records.html" class="nav-link" data-page="patient-health-records"><i class="fas fa-file-medical-alt"></i><span>Health Records</span></a></li>
            <li><a href="patient-reports.html" class="nav-link" data-page="patient-reports"><i class="fas fa-chart-pie"></i><span>Reports</span></a></li>
            <li><a href="patient-screening.html" class="nav-link" data-page="patient-screening"><i class="fas fa-clipboard-check"></i><span>Screening</span></a></li>
        </ul>
        <div class="nav-section-title">Support</div>
        <ul class="nav-menu">
             <li><a href="patient-emergency.html" class="nav-link" data-page="patient-emergency"><i class="fas fa-first-aid"></i><span>Emergency</span></a></li>
        </ul>
    `;

    const adminNav = `
        <div class="logo">
            <i class="fas fa-shield-alt"></i>
            <span>OneCare</span>
            <span class="admin-badge">Admin</span>
        </div>
        <div class="nav-section">
            <div class="nav-section-title">Main</div>
            <ul class="nav-menu">
                <li><a href="admin-dashboard.html" class="nav-link" data-page="admin-dashboard"><i class="fas fa-tachometer-alt"></i><span>Dashboard</span></a></li>
                <li><a href="admin-analytics.html" class="nav-link" data-page="admin-analytics"><i class="fas fa-chart-line"></i><span>Analytics</span></a></li>
            </ul>
        </div>
        <div class="nav-section">
            <div class="nav-section-title">Management</div>
            <ul class="nav-menu">
                <li><a href="admin-users.html" class="nav-link" data-page="admin-users"><i class="fas fa-users-cog"></i><span>User Management</span></a></li>
                <li><a href="admin-notifications.html" class="nav-link" data-page="admin-notifications"><i class="fas fa-bell"></i><span>Notifications</span></a></li>
            </ul>
        </div>
        <div class="nav-section">
            <div class="nav-section-title">System</div>
            <ul class="nav-menu">
                <li><a href="admin-audit-logs.html" class="nav-link" data-page="admin-audit-logs"><i class="fas fa-file-alt"></i><span>Audit Logs</span></a></li>
                <li><a href="admin-monitoring.html" class="nav-link" data-page="admin-monitoring"><i class="fas fa-desktop"></i><span>System Monitoring</span></a></li>
                <li><a href="admin-settings.html" class="nav-link" data-page="admin-settings"><i class="fas fa-cog"></i><span>Settings</span></a></li>
            </ul>
        </div>
    `;
    
    const providerNav = `
        <div class="logo">
            <i class="fas fa-user-md"></i>
            <span>OneCare</span>
        </div>
        <div class="nav-section-title">Provider Portal</div>
        <ul class="nav-menu">
            <li><a href="provider-dashboard.html" class="nav-link" data-page="provider-dashboard"><i class="fas fa-th-large"></i><span>Dashboard</span></a></li>
            <li><a href="my-patient.html" class="nav-link" data-page="my-patient"><i class="fas fa-user-injured"></i><span>My Patients</span></a></li>
            <li><a href="provider-appointments.html" class="nav-link" data-page="provider-appointments"><i class="fas fa-calendar-check"></i><span>Appointments</span></a></li>
            <li><a href="provider-messages.html" class="nav-link" data-page="provider-messages"><i class="fas fa-inbox"></i><span>Messages</span></a></li>
            <li><a href="provider-settings.html" class="nav-link" data-page="provider-settings"><i class="fas fa-cog"></i><span>Settings</span></a></li>
        </ul>
    `;


    switch (role) {
        case 'patient':
            return patientNav;
        case 'admin':
            return adminNav;
        case 'provider':
            return providerNav;
        default:
            return '';
    }
}

function loadSidebar(role) {
    const sidebarContainer = document.getElementById('sidebar');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = getSidebarHtml(role);

        // Set active link based on current page
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        const activeLink = sidebarContainer.querySelector(`.nav-link[data-page="${currentPage}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

