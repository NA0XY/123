class FakedRiskModel {
    constructor() {
        // Pre-determined risk scores for various conditions and family histories
        this.riskFactors = {
            '38341003': { score: 15, disease: 'Hypertension' }, // Hypertension
            '195967001': { score: 5, disease: 'Asthma' },        // Asthma
            '44054006': { score: 20, disease: 'Type 2 Diabetes' }, // Diabetes
            '254837009': { score: 25, disease: 'Breast Cancer' },  // Breast Cancer
            '56265001': { score: 10, disease: 'Heart Disease' },  // Heart Disease (Family History)
            '363358000': { score: 12, disease: 'Lung Cancer' },    // Lung Cancer (Family History)
            '363443007': { score: 18, disease: 'Ovarian Cancer' }  // Ovarian Cancer (Family History)
        };
    }

    /**
     * Calculates a risk index score based on FHIR data.
     * @param {object} patient - A FHIR Patient resource.
     * @param {Array<object>} conditions - An array of FHIR Condition resources for the patient.
     * @param {Array<object>} familyHistory - An array of FHIR FamilyMemberHistory resources for the patient.
     * @returns {object} An object containing the risk assessment.
     */
    assessRisk(patient, conditions = [], familyHistory = []) {
        let riskIndex = 0;
        const flaggedDiseases = new Set();

        // 1. Age-based risk (simple assumption)
        const birthDate = new Date(patient.birthDate);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        if (age > 50) riskIndex += 10;
        if (age > 65) riskIndex += 15;

        // 2. Risk from personal medical history (Conditions)
        conditions.forEach(condition => {
            const code = condition.code?.coding?.[0]?.code;
            if (code && this.riskFactors[code]) {
                riskIndex += this.riskFactors[code].score;
                flaggedDiseases.add(this.riskFactors[code].disease);
            }
        });

        // 3. Risk from family medical history
        familyHistory.forEach(history => {
            history.condition?.forEach(cond => {
                const code = cond.code?.coding?.[0]?.code;
                if (code && this.riskFactors[code]) {
                    riskIndex += this.riskFactors[code].score;
                    flaggedDiseases.add(`Family History: ${this.riskFactors[code].disease}`);
                }
            });
        });

        return {
            patientId: patient.id,
            riskIndexScore: riskIndex,
            flaggedConditions: Array.from(flaggedDiseases),
            assessmentDate: new Date().toISOString()
        };
    }
}

// --- Example Usage ---

// Load the faked model
const riskAssessor = new FakedRiskModel();

// Example for Patient 1 (John Smith)
const patient1 = {
  "resourceType": "Patient",
  "id": "patient-001",
  "name": [{ "use": "official", "family": "Smith", "given": ["John"] }],
  "gender": "male",
  "birthDate": "1975-05-20"
};
const conditions1 = [{
  "resourceType": "Condition",
  "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "38341003" }] },
  "subject": { "reference": "Patient/patient-001" }
}];
const history1 = [{
  "resourceType": "FamilyMemberHistory",
  "condition": [{ "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "56265001" }] } }]
}];

const johnsRisk = riskAssessor.assessRisk(patient1, conditions1, history1);
console.log('John Smith\'s Risk Assessment:', johnsRisk);
/* Expected Output:
{
  patientId: 'patient-001',
  riskIndexScore: 25, // 15 (Hypertension) + 10 (Family History of Heart Disease)
  flaggedConditions: [ 'Hypertension', 'Family History: Heart Disease' ],
  assessmentDate: '...'
}
*/

// Example for Patient 4 (Emily White)
const patient4 = {
    "resourceType": "Patient",
    "id": "patient-004",
    "name": [{ "use": "official", "family": "White", "given": ["Emily"] }],
    "gender": "female",
    "birthDate": "1980-08-12"
};
const conditions4 = [{
    "resourceType": "Condition",
    "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "254837009" }] }
}];
const history4 = [{
    "resourceType": "FamilyMemberHistory",
    "condition": [{ "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "363443007" }] } }]
}];

const emilysRisk = riskAssessor.assessRisk(patient4, conditions4, history4);
console.log('Emily White\'s Risk Assessment:', emilysRisk);
/* Expected Output:
{
  patientId: 'patient-004',
  riskIndexScore: 43, // 25 (Breast Cancer) + 18 (Family History of Ovarian Cancer)
  flaggedConditions: [ 'Breast Cancer', 'Family History: Ovarian Cancer' ],
  assessmentDate: '...'
}
*/