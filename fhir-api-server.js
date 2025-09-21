/**
 * FHIR R4 API Server
 * Implements FHIR R4 compliant REST API endpoints
 * Supports Patient, Observation, Condition, and other core FHIR resources
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

// A simple middleware to wrap async functions and catch errors
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

class FHIRAPIServer {
    constructor() {
        this.app = express();
        // Use environment variable for port, with a default
        this.port = process.env.FHIR_PORT || 3003; //
        // Use environment variable for JWT secret for better security
        this.jwtSecret = process.env.JWT_SECRET || 'fhir-api-secret-key-2024'; //

        // In-memory FHIR resource storage (replace with database in production)
        this.resources = {
            Patient: new Map(),
            Observation: new Map(),
            Condition: new Map(),
            Medication: new Map(),
            Procedure: new Map(),
            AllergyIntolerance: new Map(),
            FamilyMemberHistory: new Map(),
            Immunization: new Map()
        };

        this.setupMiddleware();
        this.setupRoutes();
        this.initializeSampleData();
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }));
        this.app.use(compression());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            console.log(`[FHIR] [${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        this.app.get('/fhir/metadata', this.getCapabilityStatement.bind(this));

        // Patient routes
        this.app.get('/fhir/Patient/:id', this.authenticateToken.bind(this), asyncHandler(this.getPatient.bind(this)));
        this.app.get('/fhir/Patient', this.authenticateToken.bind(this), asyncHandler(this.searchPatients.bind(this)));
        this.app.post('/fhir/Patient', this.authenticateToken.bind(this), asyncHandler(this.createPatient.bind(this)));
        this.app.put('/fhir/Patient/:id', this.authenticateToken.bind(this), asyncHandler(this.updatePatient.bind(this)));

        // Observation routes
        this.app.get('/fhir/Observation/:id', this.authenticateToken.bind(this), asyncHandler(this.getObservation.bind(this)));
        this.app.get('/fhir/Observation', this.authenticateToken.bind(this), asyncHandler(this.searchObservations.bind(this)));
        this.app.post('/fhir/Observation', this.authenticateToken.bind(this), asyncHandler(this.createObservation.bind(this)));
        // Placeholder for future implementation
        this.app.put('/fhir/Observation/:id', this.authenticateToken.bind(this), (req, res) => res.status(501).send({ message: 'Not Implemented' }));
        this.app.delete('/fhir/Observation/:id', this.authenticateToken.bind(this), (req, res) => res.status(501).send({ message: 'Not Implemented' }));


        // Condition routes
        this.app.get('/fhir/Condition/:id', this.authenticateToken.bind(this), asyncHandler(this.getCondition.bind(this)));
        this.app.get('/fhir/Condition', this.authenticateToken.bind(this), asyncHandler(this.searchConditions.bind(this)));
        this.app.post('/fhir/Condition', this.authenticateToken.bind(this), asyncHandler(this.createCondition.bind(this)));
        // Placeholder for future implementation
        this.app.put('/fhir/Condition/:id', this.authenticateToken.bind(this), (req, res) => res.status(501).send({ message: 'Not Implemented' }));
        this.app.delete('/fhir/Condition/:id', this.authenticateToken.bind(this), (req, res) => res.status(501).send({ message: 'Not Implemented' }));


        this.app.get('/fhir/Medication/:id', this.authenticateToken.bind(this), asyncHandler(this.getMedication.bind(this)));
        this.app.get('/fhir/Medication', this.authenticateToken.bind(this), asyncHandler(this.searchMedications.bind(this)));
        this.app.get('/fhir/Patient/:id/$everything', this.authenticateToken.bind(this), asyncHandler(this.patientEverything.bind(this)));

        this.app.use(this.errorHandler.bind(this));
    }

    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'login',
                    details: { text: 'Access token required' }
                }]
            });
        }

        jwt.verify(token, this.jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).json({
                    resourceType: 'OperationOutcome',
                    issue: [{
                        severity: 'error',
                        code: 'forbidden',
                        details: { text: 'Invalid or expired token' }
                    }]
                });
            }
            req.user = user;
            next();
        });
    }

    getCapabilityStatement(req, res) {
        const capabilityStatement = {
            resourceType: 'CapabilityStatement',
            status: 'active',
            date: new Date().toISOString(),
            publisher: 'OneCare Healthcare Platform',
            kind: 'instance',
            software: {
                name: 'OneCare FHIR API',
                version: '1.0.0'
            },
            implementation: {
                description: 'OneCare FHIR R4 API Server'
            },
            fhirVersion: '4.0.1',
            format: ['json'], // Explicitly state that only JSON is supported
            rest: [{
                mode: 'server',
                resource: [
                    {
                        type: 'Patient',
                        interaction: [
                            { code: 'read' },
                            { code: 'search-type' },
                            { code: 'create' },
                            { code: 'update' }
                        ],
                        searchParam: [
                            { name: '_id', type: 'token' },
                            { name: 'name', type: 'string' },
                            { name: 'birthdate', type: 'date' },
                            { name: 'gender', type: 'token' }
                        ]
                    },
                    {
                        type: 'Observation',
                        interaction: [
                            { code: 'read' },
                            { code: 'search-type' },
                            { code: 'create' }
                        ],
                        searchParam: [
                            { name: 'patient', type: 'reference' },
                            { name: 'category', type: 'token' },
                            { name: 'date', type: 'date' },
                            { name: 'code', type: 'token' }
                        ]
                    },
                    {
                        type: 'Condition',
                        interaction: [
                            { code: 'read' },
                            { code: 'search-type' },
                            { code: 'create' }
                        ],
                        searchParam: [
                            { name: 'patient', type: 'reference' },
                            { name: 'clinical-status', type: 'token' },
                            { name: 'onset-date', type: 'date' }
                        ]
                    }
                ]
            }]
        };

        res.json(capabilityStatement);
    }

    async getPatient(req, res) {
        const { id } = req.params;
        const patient = this.resources.Patient.get(id);

        if (!patient) {
            return res.status(404).json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'not-found',
                    details: { text: `Patient ${id} not found` }
                }]
            });
        }

        res.json(patient);
    }

    async searchPatients(req, res) {
        // More robust pagination and search
        const { name, birthdate, gender, _count = '20', _offset = '0' } = req.query;
        let patients = Array.from(this.resources.Patient.values());

        if (name) {
            patients = patients.filter(p =>
                p.name.some(n =>
                    (n.given || []).some(g => g.toLowerCase().includes(name.toLowerCase())) ||
                    (n.family && n.family.toLowerCase().includes(name.toLowerCase()))
                )
            );
        }

        if (birthdate) {
            patients = patients.filter(p => p.birthDate === birthdate);
        }

        if (gender) {
            patients = patients.filter(p => p.gender === gender);
        }

        const total = patients.length;
        const count = parseInt(_count, 10);
        const offset = parseInt(_offset, 10);
        const paginatedPatients = patients.slice(offset, offset + count);

        res.json({
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            entry: paginatedPatients.map(patient => ({
                resource: patient
            }))
        });
    }

    async createPatient(req, res) {
        const patientData = req.body;

        if (patientData.resourceType !== 'Patient') {
            return res.status(400).json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'invalid',
                    details: { text: 'Resource must be of type Patient' }
                }]
            });
        }
        // Using uuidv4 for consistent ID generation
        const id = patientData.id || uuidv4();
        const patient = {
            ...patientData,
            id,
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                ...patientData.meta
            }
        };

        this.resources.Patient.set(id, patient);

        res.status(201).json(patient);
    }

    async updatePatient(req, res) {
        const { id } = req.params;
        const patientData = req.body;
        const existingPatient = this.resources.Patient.get(id);


        if (!existingPatient) {
            return res.status(404).json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'not-found',
                    details: { text: `Patient ${id} not found` }
                }]
            });
        }

        const updatedPatient = {
            ...patientData,
            id,
            meta: {
                versionId: (parseInt(existingPatient.meta.versionId, 10) + 1).toString(),
                lastUpdated: new Date().toISOString(),
                ...patientData.meta
            }
        };

        this.resources.Patient.set(id, updatedPatient);
        res.json(updatedPatient);
    }

    async getObservation(req, res) {
        const { id } = req.params;
        const observation = this.resources.Observation.get(id);

        if (!observation) {
            return res.status(404).json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'not-found',
                    details: { text: `Observation ${id} not found` }
                }]
            });
        }

        res.json(observation);
    }

    async searchObservations(req, res) {
        const { patient, category, date, code, _count = '20', _offset = '0' } = req.query;
        let observations = Array.from(this.resources.Observation.values());

        if (patient) {
            observations = observations.filter(o =>
                o.subject && o.subject.reference === `Patient/${patient}`
            );
        }

        if (category) {
            observations = observations.filter(o =>
                o.category && o.category.some(cat =>
                    cat.coding.some(coding => coding.code === category)
                )
            );
        }

        if (date) {
            observations = observations.filter(o =>
                o.effectiveDateTime && o.effectiveDateTime.startsWith(date)
            );
        }

        if (code) {
            observations = observations.filter(o =>
                o.code && o.code.coding.some(coding => coding.code === code)
            );
        }

        const total = observations.length;
        const count = parseInt(_count, 10);
        const offset = parseInt(_offset, 10);
        const paginatedObservations = observations.slice(offset, offset + count);


        res.json({
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            entry: paginatedObservations.map(observation => ({
                resource: observation
            }))
        });
    }

    async createObservation(req, res) {
        const observationData = req.body;

        if (observationData.resourceType !== 'Observation') {
            return res.status(400).json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'invalid',
                    details: { text: 'Resource must be of type Observation' }
                }]
            });
        }

        const id = observationData.id || uuidv4();
        const observation = {
            ...observationData,
            id,
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                ...observationData.meta
            }
        };

        this.resources.Observation.set(id, observation);
        res.status(201).json(observation);
    }

    async getCondition(req, res) {
        const { id } = req.params;
        const condition = this.resources.Condition.get(id);

        if (!condition) {
            return res.status(404).json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'not-found',
                    details: { text: `Condition ${id} not found` }
                }]
            });
        }

        res.json(condition);
    }

    async searchConditions(req, res) {
        const { patient, 'clinical-status': clinicalStatus, 'onset-date': onsetDate, _count = '20', _offset = '0' } = req.query;
        let conditions = Array.from(this.resources.Condition.values());

        if (patient) {
            conditions = conditions.filter(c =>
                c.subject && c.subject.reference === `Patient/${patient}`
            );
        }

        if (clinicalStatus) {
            conditions = conditions.filter(c =>
                c.clinicalStatus && c.clinicalStatus.coding.some(coding => coding.code === clinicalStatus)
            );
        }

        if (onsetDate) {
            conditions = conditions.filter(c =>
                c.onsetDateTime && c.onsetDateTime.startsWith(onsetDate)
            );
        }

        const total = conditions.length;
        const count = parseInt(_count, 10);
        const offset = parseInt(_offset, 10);
        const paginatedConditions = conditions.slice(offset, offset + count);

        res.json({
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            entry: paginatedConditions.map(condition => ({
                resource: condition
            }))
        });
    }

    async createCondition(req, res) {
        const conditionData = req.body;

        if (conditionData.resourceType !== 'Condition') {
            return res.status(400).json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'invalid',
                    details: { text: 'Resource must be of type Condition' }
                }]
            });
        }

        const id = conditionData.id || uuidv4();
        const condition = {
            ...conditionData,
            id,
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                ...conditionData.meta
            }
        };

        this.resources.Condition.set(id, condition);
        res.status(201).json(condition);
    }

    async getMedication(req, res) {
        const { id } = req.params;
        const medication = this.resources.Medication.get(id);

        if (!medication) {
            return res.status(404).json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'not-found',
                    details: { text: `Medication ${id} not found` }
                }]
            });
        }

        res.json(medication);
    }

    async searchMedications(req, res) {
        const { _count = '20', _offset = '0' } = req.query;
        let medications = Array.from(this.resources.Medication.values());

        const total = medications.length;
        const count = parseInt(_count, 10);
        const offset = parseInt(_offset, 10);
        const paginatedMedications = medications.slice(offset, offset + count);

        res.json({
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            entry: paginatedMedications.map(medication => ({
                resource: medication
            }))
        });
    }

    async patientEverything(req, res) {
        const { id } = req.params;
        const patient = this.resources.Patient.get(id);

        if (!patient) {
            return res.status(404).json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'not-found',
                    details: { text: `Patient ${id} not found` }
                }]
            });
        }

        const relatedResources = [];
        relatedResources.push({ resource: patient });

        const patientObservations = Array.from(this.resources.Observation.values())
            .filter(obs => obs.subject && obs.subject.reference === `Patient/${id}`);
        relatedResources.push(...patientObservations.map(obs => ({ resource: obs })));

        const patientConditions = Array.from(this.resources.Condition.values())
            .filter(cond => cond.subject && cond.subject.reference === `Patient/${id}`);
        relatedResources.push(...patientConditions.map(cond => ({ resource: cond })));

        res.json({
            resourceType: 'Bundle',
            type: 'searchset',
            total: relatedResources.length,
            entry: relatedResources
        });
    }

    initializeSampleData() {
        const samplePatient = {
            resourceType: 'Patient',
            id: 'patient-demo-001',
            meta: {
                versionId: '1',
                lastUpdated: '2024-01-15T10:00:00Z'
            },
            identifier: [{
                system: 'http://onecare.com/patient',
                value: 'P001'
            }],
            active: true,
            name: [{
                use: 'official',
                family: 'Singhal',
                given: ['Harsh']
            }],
            gender: 'male',
            birthDate: '1979-03-15',
            address: [{
                use: 'home',
                line: ['123 Healthcare St'],
                city: 'Medical City',
                state: 'CA',
                postalCode: '90210',
                country: 'US'
            }],
            telecom: [{
                system: 'phone',
                value: '(555) 123-4567',
                use: 'home'
            }, {
                system: 'email',
                value: 'harsh.singhal@onecare.com'
            }]
        };

        this.resources.Patient.set(samplePatient.id, samplePatient);

        const sampleObservation = {
            resourceType: 'Observation',
            id: 'obs-bp-001',
            meta: {
                versionId: '1',
                lastUpdated: '2024-01-15T08:30:00Z'
            },
            status: 'final',
            category: [{
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: 'vital-signs',
                    display: 'Vital Signs'
                }]
            }],
            code: {
                coding: [{
                    system: 'http://loinc.org',
                    code: '85354-9',
                    display: 'Blood pressure panel with all children optional'
                }]
            },
            subject: {
                reference: 'Patient/patient-demo-001'
            },
            effectiveDateTime: '2024-01-15T08:30:00Z',
            component: [{
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '8480-6',
                        display: 'Systolic blood pressure'
                    }]
                },
                valueQuantity: {
                    value: 128,
                    unit: 'mmHg',
                    system: 'http://unitsofmeasure.org',
                    code: 'mm[Hg]'
                }
            }, {
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '8462-4',
                        display: 'Diastolic blood pressure'
                    }]
                },
                valueQuantity: {
                    value: 82,
                    unit: 'mmHg',
                    system: 'http://unitsofmeasure.org',
                    code: 'mm[Hg]'
                }
            }]
        };

        this.resources.Observation.set(sampleObservation.id, sampleObservation);

        const sampleCondition = {
            resourceType: 'Condition',
            id: 'cond-htn-001',
            meta: {
                versionId: '1',
                lastUpdated: '2024-01-15T09:00:00Z'
            },
            clinicalStatus: {
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    code: 'active',
                    display: 'Active'
                }]
            },
            verificationStatus: {
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                    code: 'confirmed',
                    display: 'Confirmed'
                }]
            },
            category: [{
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                    code: 'problem-list-item',
                    display: 'Problem List Item'
                }]
            }],
            severity: {
                coding: [{
                    system: 'http://snomed.info/sct',
                    code: '24484000',
                    display: 'Severe'
                }]
            },
            code: {
                coding: [{
                    system: 'http://snomed.info/sct',
                    code: '38341003',
                    display: 'Hypertension'
                }]
            },
            subject: {
                reference: 'Patient/patient-demo-001'
            },
            onsetDateTime: '2023-06-01T00:00:00Z',
            recordedDate: '2023-06-01T00:00:00Z'
        };

        this.resources.Condition.set(sampleCondition.id, sampleCondition);

        console.log('🏥 FHIR API initialized with sample data');
    }

    errorHandler(err, req, res, next) {
        console.error('Unhandled FHIR API Error:', err);
        res.status(500).json({
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'exception',
                details: { text: 'Internal server error' }
            }]
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🏥 FHIR R4 API Server running on port ${this.port}`);
            console.log(`📋 Capability Statement: http://localhost:${this.port}/fhir/metadata`);
        });
    }
}

if (require.main === module) {
    const fhirAPIServer = new FHIRAPIServer();
    fhirAPIServer.start();
}


module.exports = FHIRAPIServer;
