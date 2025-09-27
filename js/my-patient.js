document.addEventListener('DOMContentLoaded', function() {
    loadSidebar('provider');
    
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

    // --- PATIENT LIST LOGIC ---
    const tableBody = document.getElementById('patientsTableBody');
    
    async function fetchAndRenderPatients() {
        try {
            const response = await fetch('/api/provider/patients');
            const patients = await response.json();
            
            tableBody.innerHTML = ''; // Clear existing rows
            
            patients.forEach(patient => {
                let statusClass = 'status-active';
                if (patient.status === 'At Risk') {
                    statusClass = 'status-at-risk';
                } else if (patient.status === 'Discharged') {
                    statusClass = 'status-discharged';
                }
                
                const avatarClass = `avatar-${(parseInt(patient.id.slice(-1)) % 5) + 1}`;
                
                const row = `
                    <tr>
                        <td>
                            <div class="patient-info">
                                <div class="patient-avatar ${avatarClass}">${patient.name.charAt(0)}</div>
                                <span class="patient-name">${patient.name}</span>
                            </div>
                        </td>
                        <td>${new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td><span class="status-badge ${statusClass}">${patient.status}</span></td>
                        <td><button class="action-btn">View Chart</button></td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
            
        } catch (error) {
            console.error('Error fetching patients:', error);
            tableBody.innerHTML = '<tr><td colspan="4">Could not load patient data.</td></tr>';
        }
    }

    // Patient Search Logic
    const searchInput = document.getElementById('patientSearch');
    searchInput.addEventListener('keyup', function() {
        const filter = searchInput.value.toUpperCase();
        const rows = tableBody.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            let nameCell = rows[i].getElementsByTagName('td')[0];
            if (nameCell) {
                let txtValue = nameCell.textContent || nameCell.innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    rows[i].style.display = "";
                } else {
                    rows[i].style.display = "none";
                }
            }
        }
    });
    
    // Initial render
    fetchAndRenderPatients();
});