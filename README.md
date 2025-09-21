# OneCare - Preventive Screening Medical Wallet

A **SMART on FHIR** web application that implements a "record-to-action" philosophy for preventive health screenings. OneCare analyzes patient FHIR data to identify overdue screenings and presents actionable Clinical Decision Support (CDS) cards with one-tap ordering capabilities.

## 🎯 Features

- **SMART on FHIR Integration**: Seamless EHR integration with OAuth2/OIDC authentication
- **FHIR R4 Support**: Handles Patient, Observation, Condition, FamilyMemberHistory, and Immunization resources
- **Intelligent Rules Engine**: Analyzes patient data against evidence-based screening guidelines
- **Low-Noise CDS Cards**: "Due Today" cards that explain "why now" with clear recommendations
- **One-Tap Actions**: Create ServiceRequests and ImmunizationRecommendations directly from cards
- **Real-time Updates**: Automatic refresh of screening recommendations
- **Comprehensive Dashboard**: Visual overview of screening status and timeline

## 📋 Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Modern web browser (Chrome, Firefox, Edge, Safari)

## 🚀 Quick Start

### Step 1: Clone or Download the Project

```bash
# If using git
git clone <repository-url> OneCare
cd OneCare

# Or simply navigate to the OneCare directory
cd C:\Users\Harsh Singhal\OneCare
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Generate Synthetic FHIR Data

```bash
cd ../data-generator
npm install
node generate-fhir-data.js
```

This will create synthetic patient data in `data-generator/output/synthetic-fhir-data.json`

### Step 4: Start the Backend Server

```bash
cd ../backend
npm start
```

The backend server will start on `http://localhost:3001`

### Step 5: Start the Frontend

The frontend uses vanilla JavaScript and doesn't require a build process. You have several options:

**Option A: Using Python's built-in server (if Python is installed)**
```bash
cd ../frontend
python -m http.server 8080
```

**Option B: Using Node.js http-server**
```bash
npm install -g http-server
cd ../frontend
http-server -p 8080
```

**Option C: Using Live Server in VS Code**
- Install the Live Server extension in VS Code
- Right-click on `frontend/index.html`
- Select "Open with Live Server"

**Option D: Direct file access (limited functionality)**
- Open `frontend/index.html` directly in your browser
- Note: OAuth flow may not work with file:// protocol

### Step 6: Access the Application

Open your browser and navigate to:
```
http://localhost:8080
```

## 🔧 Configuration

### Backend Configuration

The backend server configuration can be modified in `backend/server.js`:

- **Port**: Default is 3001 (change via `PORT` environment variable)
- **JWT Secret**: Update the `demo-secret-key` for production use
- **Data Path**: Synthetic data is loaded from `data-generator/output/`

### Frontend Configuration

Edit `frontend/config.js` to customize:

```javascript
const config = {
    apiUrl: 'http://localhost:3001',  // Backend API URL
    oauth: {
        clientId: 'onecare-app',      // OAuth client ID
        scope: 'patient/*.read ...'   // FHIR scopes
    },
    screeningIntervals: {
        mammography: 24,               // Screening intervals in months
        colonoscopy: 120,
        // ...
    }
}
```

## 📱 Using the Application

### 1. Authentication

Click "Connect to EHR" to initiate the SMART on FHIR authentication flow. The demo uses a simplified OAuth2 flow for testing.

### 2. Dashboard View

Once authenticated, you'll see:
- **Due Today Cards**: Actionable screening recommendations
- **Statistics**: Overview of completed, due, and up-to-date screenings
- **Timeline**: Upcoming screening schedule

### 3. CDS Cards

Each card displays:
- **Title**: The screening that's due
- **Indicator**: Priority level (critical/warning/info)
- **Recommendation**: Evidence-based guideline
- **Why Now**: Explanation of timing
- **Action Button**: One-tap ordering

### 4. Taking Action

1. Click the action button on a CDS card
2. Review the order details in the confirmation modal
3. Confirm to create the FHIR resource (ServiceRequest or ImmunizationRecommendation)
4. The system will log the created resource and update the display

### 5. Navigation

- **Dashboard**: Main screening overview
- **Patient Info**: Demographics and identifiers
- **Health Records**: View observations, conditions, immunizations, and family history
- **Screenings**: Detailed screening history and recommendations

## 🏗️ Architecture

### Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express.js
- **Data Format**: FHIR R4 resources
- **Authentication**: OAuth2/OIDC (SMART on FHIR)
- **Storage**: In-memory for demo (ready for database integration)

### Project Structure

```
OneCare/
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Application styles
│   ├── config.js           # Frontend configuration
│   ├── fhir-client.js      # FHIR client library
│   └── app.js             # Main application logic
├── backend/
│   ├── server.js          # Express server
│   ├── rulesEngine.js     # Screening rules logic
│   └── package.json       # Backend dependencies
├── data-generator/
│   ├── generate-fhir-data.js  # Synthetic data generator
│   └── output/            # Generated FHIR data
└── README.md              # This file
```

### Screening Rules

The rules engine (`backend/rulesEngine.js`) implements USPSTF guidelines for:

**Cancer Screenings:**
- Mammography (women 40-74, biennial)
- Colonoscopy (adults 45-75, every 10 years)
- Cervical cancer (women 21-65, every 3 years)

**Cardiovascular:**
- Blood pressure (annual)
- Lipid panel (risk-based, every 5 years)
- Diabetes screening (adults 35-70 with BMI >25)

**Immunizations:**
- Influenza (annual)
- Pneumococcal (adults ≥65)
- Shingles (adults ≥50)

**Other:**
- Osteoporosis (women ≥65)
- AAA screening (men 65-75)

## 🧪 Testing

### Generate Test Data

The data generator creates diverse patient scenarios:

```bash
cd data-generator
node generate-fhir-data.js
```

This generates 10 patients with varying:
- Ages (25-78 years)
- Genders
- Medical conditions
- Family histories
- Immunization records

### Test Scenarios

1. **Overdue Screenings**: Patients with screenings past due date
2. **High Risk**: Patients with family history triggering earlier screening
3. **Up-to-date**: Patients with all screenings current
4. **Mixed Status**: Combination of due and completed screenings

## 🚢 Production Deployment

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3001
JWT_SECRET=your-secure-secret-key
NODE_ENV=production
```

### Database Integration

Replace in-memory storage with a database:

1. Install database driver (e.g., `npm install mongoose` for MongoDB)
2. Update `backend/server.js` to use database for:
   - Patient data storage
   - Authentication tokens
   - Created resources

### Security Enhancements

1. **HTTPS**: Use SSL certificates for production
2. **CORS**: Configure specific origins in `backend/server.js`
3. **Rate Limiting**: Add rate limiting middleware
4. **Input Validation**: Implement comprehensive input validation
5. **Audit Logging**: Add audit trails for all actions

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
# Backend
FROM node:14-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 3001
CMD ["node", "server.js"]
```

## 📝 API Documentation

### Authentication Endpoints

- `GET /auth/authorize` - Initiate OAuth2 flow
- `POST /auth/token` - Exchange code for access token

### FHIR Endpoints

- `GET /fhir/Patient/{id}` - Get patient resource
- `GET /fhir/Patient/{id}/$everything` - Get all patient resources
- `GET /fhir/Observation?patient={id}` - Get observations
- `GET /fhir/Condition?patient={id}` - Get conditions
- `GET /fhir/Immunization?patient={id}` - Get immunizations
- `GET /fhir/FamilyMemberHistory?patient={id}` - Get family history
- `POST /fhir/ServiceRequest` - Create service request
- `POST /fhir/ImmunizationRecommendation` - Create immunization recommendation

### CDS Services

- `POST /cds-services/patient-view` - Get CDS cards for patient
- `POST /api/rules/evaluate` - Evaluate screening rules

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot connect to backend"**
   - Ensure backend is running on port 3001
   - Check CORS settings if frontend is on different port

2. **"No patient data found"**
   - Run the data generator script
   - Check that `data-generator/output/` contains JSON files

3. **"Authentication failed"**
   - Clear browser localStorage
   - Restart both frontend and backend

4. **"CDS cards not showing"**
   - Verify patient data has appropriate age/gender for screenings
   - Check browser console for errors

### Debug Mode

Enable debug mode in `frontend/config.js`:

```javascript
app: {
    debugMode: true  // Enables console logging
}
```

## 📚 Resources

- [SMART on FHIR Documentation](https://docs.smarthealthit.org/)
- [HL7 FHIR R4 Specification](https://www.hl7.org/fhir/)
- [CDS Hooks Specification](https://cds-hooks.org/)
- [USPSTF Recommendations](https://www.uspreventiveservicestaskforce.org/)

## 📄 License

This project is provided as a demonstration and educational tool. 

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 💡 Future Enhancements

- [ ] Real EHR integration with production SMART on FHIR
- [ ] Machine learning for risk stratification
- [ ] Patient portal with reminders
- [ ] Integration with scheduling systems
- [ ] Multi-language support
- [ ] Mobile responsive design improvements
- [ ] Offline capability with service workers
- [ ] Advanced analytics dashboard

## 📧 Support

For questions or issues, please:
- Check the troubleshooting section
- Review the API documentation
- Open an issue in the repository

---

**OneCare** - Transforming preventive care through intelligent, actionable insights.