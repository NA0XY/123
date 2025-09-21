# OneCare – Preventive Screening Medical Wallet

A **SMART on FHIR** web application designed to empower preventive healthcare through intelligent screening recommendations, seamless EHR integration, and actionable clinical decision support.

---

## 🚀 Overview

OneCare helps clinicians and patients stay on top of preventive health screenings by analyzing FHIR medical data and providing timely, actionable recommendations. Built for interoperability and ease of use, it bridges the gap between patient data and evidence-based action—directly from your browser.

---

## ✨ Features

- **SMART on FHIR Integration:** Works with modern EHRs using industry standards (OAuth2/OIDC).
- **Guideline-driven Screening:** Applies USPSTF and CDC guidelines for cancer, cardiovascular, and immunization screenings.
- **Low-noise Clinical Decision Support:** Clear, actionable cards with "why now" explanations.
- **One-tap Actions:** Instantly order recommended screenings or immunizations.
- **Comprehensive Dashboard:** Visualizes patient screening status and history.
- **Synthetic Data Generator:** Easily test diverse patient scenarios.
- **Modular Architecture:** Easy to extend, ready for real EHR integration.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v14+)
- npm (v6+)
- (Optional) Python 3.x for local static server

### Quick Start

1. **Clone the Repository**
    ```bash
    git clone https://github.com/NA0XY/123.git
    cd 123
    ```

2. **Install Backend Dependencies**
    ```bash
    cd backend
    npm install
    ```

3. **Generate Synthetic FHIR Data**
    ```bash
    cd ../data-generator
    npm install
    node generate-fhir-data.js
    ```

4. **Start Backend Server**
    ```bash
    cd ../backend
    npm start
    ```
    The backend runs by default on `http://localhost:3001`

5. **Start Frontend**
    - Using Python:
      ```bash
      cd ../frontend
      python -m http.server 8080
      ```
    - Or using Node's http-server:
      ```bash
      npm install -g http-server
      cd ../frontend
      http-server -p 8080
      ```

6. **Open the App**
    - Visit [http://localhost:8080](http://localhost:8080) in your browser.

---

## ⚙️ Configuration

- **Backend:** Edit ports, JWT secrets, or data paths in `backend/server.js`.
- **Frontend:** Edit API URLs, OAuth client details, and screening intervals in `frontend/config.js`.

---

## 📚 Documentation

- **SMART on FHIR:** [docs.smarthealthit.org](https://docs.smarthealthit.org/)
- **FHIR R4:** [hl7.org/fhir](https://www.hl7.org/fhir/)
- **CDS Hooks:** [cds-hooks.org](https://cds-hooks.org/)
- **USPSTF Recommendations:** [uspreventiveservicestaskforce.org](https://www.uspreventiveservicestaskforce.org/)

---

## 🏗️ Project Structure

```
123/
├── backend/           # Node.js Express backend & rules engine
├── frontend/          # HTML, CSS, JS web client
├── data-generator/    # Synthetic FHIR data scripts
└── README.md          # Project documentation
```

---

## 👩‍⚕️ Clinical Rules Engine

Implements evidence-based screening intervals for:
- **Cancer:** Mammography, Colonoscopy, Cervical
- **Cardiovascular:** BP, Lipid Panel, Diabetes
- **Immunizations:** Influenza, Pneumococcal, Shingles
- **Other:** Osteoporosis, AAA

Easily extendable for new guidelines.

---

## 🧪 Testing & Scenarios

- Generate synthetic data with diverse ages, genders, conditions, and histories.
- Test overdue, high-risk, up-to-date, and mixed screening statuses.

---

## 📦 Deployment

- Production-ready for Docker or cloud (see `Dockerfile` for example).
- Configure environment variables in backend as needed.

---

## 🤝 Contributing

We welcome contributions! To get started:
1. Fork this repository
2. Create a feature branch
3. Commit and push your changes
4. Open a Pull Request

---

## 📄 License

This project is provided for educational and demonstration purposes. See `LICENSE` for details.

---

## 📧 Support

For help, open an issue or contact the maintainer via GitHub.

---

**OneCare – Smarter preventive care for everyone.**