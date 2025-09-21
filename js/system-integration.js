/**
 * OneCare System Integration Layer
 * Connects screening, care plans, medications, and messaging systems
 * Provides comprehensive patient care coordination
 */

class OneCareSystemIntegration {
    constructor() {
        this.initialized = false;
        this.eventBus = new EventBus();
        this.integrations = {
            medications: null,
            messaging: null,
            screening: null,
            carePlans: null,
            notifications: null
        };
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize all system components
            await this.initializeIntegrations();
            
            // Set up cross-system event handlers
            this.setupEventHandlers();
            
            // Configure automated workflows
            this.configureWorkflows();
            
            this.initialized = true;
            console.log('OneCare System Integration initialized successfully');
            
        } catch (error) {
            console.error('System integration initialization failed:', error);
        }
    }
    
    async initializeIntegrations() {
        // Initialize medication integration
        this.integrations.medications = new MedicationIntegration(this.eventBus);
        
        // Initialize messaging integration
        this.integrations.messaging = new MessagingIntegration(this.eventBus);
        
        // Initialize screening integration
        this.integrations.screening = new ScreeningIntegration(this.eventBus);
        
        // Initialize care plan integration
        this.integrations.carePlans = new CarePlanIntegration(this.eventBus);
        
        // Initialize notification system
        this.integrations.notifications = new NotificationIntegration(this.eventBus);
        
        // Wait for all integrations to be ready
        await Promise.all([
            this.integrations.medications.initialize(),
            this.integrations.messaging.initialize(),
            this.integrations.screening.initialize(),
            this.integrations.carePlans.initialize(),
            this.integrations.notifications.initialize()
        ]);
    }
    
    setupEventHandlers() {
        // Screening -> Medication Integration
        this.eventBus.on('screening:scheduled', (data) => {
            this.handleScreeningScheduled(data);
        });
        
        this.eventBus.on('screening:completed', (data) => {
            this.handleScreeningCompleted(data);
        });
        
        this.eventBus.on('screening:overdue', (data) => {
            this.handleScreeningOverdue(data);
        });
        
        // Medication -> Screening Integration
        this.eventBus.on('medication:added', (data) => {
            this.handleMedicationAdded(data);
        });
        
        this.eventBus.on('medication:changed', (data) => {
            this.handleMedicationChanged(data);
        });
        
        this.eventBus.on('medication:adherence_alert', (data) => {
            this.handleMedicationAdherenceAlert(data);
        });
        
        // Care Plan Integration Events
        this.eventBus.on('careplan:goal_completed', (data) => {
            this.handleCarePlanGoalCompleted(data);
        });
        
        this.eventBus.on('careplan:milestone_reached', (data) => {
            this.handleCarePlanMilestoneReached(data);
        });
        
        // Messaging Integration Events
        this.eventBus.on('message:provider_response', (data) => {
            this.handleProviderMessage(data);
        });
        
        this.eventBus.on('message:urgent_flag', (data) => {
            this.handleUrgentMessage(data);
        });
        
        // ML Recommendation Events
        this.eventBus.on('ml:risk_score_updated', (data) => {
            this.handleRiskScoreUpdate(data);
        });
        
        this.eventBus.on('ml:recommendation_generated', (data) => {
            this.handleMLRecommendation(data);
        });
    }
    
    configureWorkflows() {
        // Configure automated workflows
        this.workflows = {
            screeningReminders: new ScreeningReminderWorkflow(this.integrations),
            medicationScreeningAlerts: new MedicationScreeningWorkflow(this.integrations),
            carePlanCoordination: new CarePlanCoordinationWorkflow(this.integrations),
            providerCommunication: new ProviderCommunicationWorkflow(this.integrations),
            emergencyProtocols: new EmergencyProtocolWorkflow(this.integrations)
        };
        
        // Start workflows
        Object.values(this.workflows).forEach(workflow => workflow.start());
    }
    
    // Event Handlers
    async handleScreeningScheduled(data) {
        const { screeningId, patientId, screeningType, scheduledDate, provider } = data;
        
        try {
            // Check for relevant medications that might require lab monitoring
            const relevantMedications = await this.integrations.medications.getScreeningRelatedMedications(
                patientId, screeningType
            );
            
            if (relevantMedications.length > 0) {
                // Create care plan tasks for medication monitoring
                await this.integrations.carePlans.addMedicationMonitoringTasks(
                    patientId, relevantMedications, screeningId
                );\n                \n                // Send notification to patient about medication considerations\n                await this.integrations.notifications.sendNotification({\n                    patientId,\n                    type: 'medication_screening_alert',\n                    title: 'Medication Considerations for Upcoming Screening',\n                    message: `Your upcoming ${screeningType} may be affected by current medications. Please review with your provider.`,\n                    priority: 'medium',\n                    relatedItems: { screeningId, medications: relevantMedications }\n                });\n            }\n            \n            // Send appointment confirmation message\n            await this.integrations.messaging.sendSystemMessage({\n                patientId,\n                subject: `${screeningType} Scheduled`,\n                content: `Your ${screeningType} screening has been scheduled for ${scheduledDate} with ${provider}. Preparation instructions will be sent separately.`,\n                category: 'appointment_confirmation',\n                relatedItems: { screeningId }\n            });\n            \n            // Update care plan if screening is part of a plan\n            await this.integrations.carePlans.updateScreeningProgress(patientId, screeningId);\n            \n        } catch (error) {\n            console.error('Error handling screening scheduled event:', error);\n        }\n    }\n    \n    async handleScreeningCompleted(data) {\n        const { screeningId, patientId, screeningType, results, recommendations } = data;\n        \n        try {\n            // Update care plan progress\n            await this.integrations.carePlans.markScreeningCompleted(patientId, screeningId);\n            \n            // Check if results require medication adjustments\n            const medicationRecommendations = await this.integrations.medications.analyzeScreeningResults(\n                patientId, screeningType, results\n            );\n            \n            if (medicationRecommendations.length > 0) {\n                // Create care plan tasks for medication review\n                await this.integrations.carePlans.addMedicationReviewTasks(\n                    patientId, medicationRecommendations, screeningId\n                );\n                \n                // Send message to provider about potential medication changes\n                await this.integrations.messaging.sendProviderAlert({\n                    patientId,\n                    subject: `Screening Results May Require Medication Review`,\n                    content: `Recent ${screeningType} results suggest reviewing current medications.`,\n                    priority: 'high',\n                    relatedItems: { screeningId, results, recommendations: medicationRecommendations }\n                });\n            }\n            \n            // Schedule follow-up screenings if needed\n            if (recommendations.followUpScreenings) {\n                await this.integrations.screening.scheduleFollowUpScreenings(\n                    patientId, recommendations.followUpScreenings\n                );\n            }\n            \n            // Send results notification to patient\n            await this.integrations.messaging.sendResultsNotification({\n                patientId,\n                screeningType,\n                results,\n                screeningId\n            });\n            \n        } catch (error) {\n            console.error('Error handling screening completed event:', error);\n        }\n    }\n    \n    async handleMedicationAdded(data) {\n        const { patientId, medication } = data;\n        \n        try {\n            // Check if new medication requires monitoring screenings\n            const requiredScreenings = await this.integrations.screening.getMonitoringScreeningsForMedication(\n                medication\n            );\n            \n            if (requiredScreenings.length > 0) {\n                // Add screening reminders to care plan\n                await this.integrations.carePlans.addScreeningReminders(\n                    patientId, requiredScreenings, medication.id\n                );\n                \n                // Send educational message about required monitoring\n                await this.integrations.messaging.sendEducationalMessage({\n                    patientId,\n                    subject: 'Important Monitoring Information',\n                    content: `Your new medication ${medication.name} requires regular monitoring through specific lab tests. These have been added to your care plan.`,\n                    category: 'medication_education',\n                    relatedItems: { medicationId: medication.id, requiredScreenings }\n                });\n            }\n            \n        } catch (error) {\n            console.error('Error handling medication added event:', error);\n        }\n    }\n    \n    async handleCarePlanGoalCompleted(data) {\n        const { patientId, carePlanId, goalId, goalDescription } = data;\n        \n        try {\n            // Check if goal completion triggers screening recommendations\n            const triggerScreenings = await this.integrations.screening.getGoalTriggeredScreenings(\n                patientId, goalDescription\n            );\n            \n            if (triggerScreenings.length > 0) {\n                // Schedule recommended screenings\n                await this.integrations.screening.scheduleRecommendedScreenings(\n                    patientId, triggerScreenings\n                );\n            }\n            \n            // Send congratulations message\n            await this.integrations.messaging.sendCelebrationMessage({\n                patientId,\n                achievement: goalDescription,\n                carePlanId\n            });\n            \n            // Update medication adherence tracking if relevant\n            if (goalDescription.toLowerCase().includes('medication')) {\n                await this.integrations.medications.updateAdherenceFromGoal(\n                    patientId, goalId, true\n                );\n            }\n            \n        } catch (error) {\n            console.error('Error handling care plan goal completed event:', error);\n        }\n    }\n    \n    async handleProviderMessage(data) {\n        const { patientId, messageId, content, priority, category } = data;\n        \n        try {\n            // Parse message for actionable items\n            const actionItems = await this.parseProviderMessageForActions(content);\n            \n            for (const action of actionItems) {\n                switch (action.type) {\n                    case 'schedule_screening':\n                        await this.integrations.screening.createScreeningFromMessage(\n                            patientId, action.details, messageId\n                        );\n                        break;\n                        \n                    case 'medication_change':\n                        await this.integrations.medications.processMedicationChangeRequest(\n                            patientId, action.details, messageId\n                        );\n                        break;\n                        \n                    case 'care_plan_update':\n                        await this.integrations.carePlans.updateFromProviderMessage(\n                            patientId, action.details, messageId\n                        );\n                        break;\n                }\n            }\n            \n        } catch (error) {\n            console.error('Error handling provider message:', error);\n        }\n    }\n    \n    async handleMLRecommendation(data) {\n        const { patientId, recommendations, confidence, riskFactors } = data;\n        \n        try {\n            for (const recommendation of recommendations) {\n                switch (recommendation.type) {\n                    case 'screening':\n                        // Add screening recommendation to care plan\n                        await this.integrations.carePlans.addAIRecommendation(\n                            patientId, recommendation, 'screening'\n                        );\n                        break;\n                        \n                    case 'medication_review':\n                        // Create medication review task\n                        await this.integrations.medications.scheduleAITriggeredReview(\n                            patientId, recommendation, riskFactors\n                        );\n                        break;\n                        \n                    case 'lifestyle':\n                        // Add lifestyle goal to care plan\n                        await this.integrations.carePlans.addLifestyleGoal(\n                            patientId, recommendation\n                        );\n                        break;\n                }\n            }\n            \n            // Send AI insights message to patient\n            await this.integrations.messaging.sendAIInsightsMessage({\n                patientId,\n                recommendations,\n                confidence\n            });\n            \n        } catch (error) {\n            console.error('Error handling ML recommendation:', error);\n        }\n    }\n    \n    // Utility Methods\n    async parseProviderMessageForActions(content) {\n        // Simple NLP parsing for actionable items\n        const actions = [];\n        const lowercaseContent = content.toLowerCase();\n        \n        // Screen for screening requests\n        if (lowercaseContent.includes('schedule') && (lowercaseContent.includes('lab') || lowercaseContent.includes('test') || lowercaseContent.includes('screening'))) {\n            actions.push({\n                type: 'schedule_screening',\n                details: { type: 'provider_requested', content }\n            });\n        }\n        \n        // Screen for medication changes\n        if (lowercaseContent.includes('medication') && (lowercaseContent.includes('start') || lowercaseContent.includes('stop') || lowercaseContent.includes('change'))) {\n            actions.push({\n                type: 'medication_change',\n                details: { type: 'provider_requested', content }\n            });\n        }\n        \n        // Screen for care plan updates\n        if (lowercaseContent.includes('goal') || lowercaseContent.includes('plan') || lowercaseContent.includes('target')) {\n            actions.push({\n                type: 'care_plan_update',\n                details: { type: 'provider_requested', content }\n            });\n        }\n        \n        return actions;\n    }\n    \n    // Public API Methods\n    async synchronizePatientData(patientId) {\n        if (!this.initialized) {\n            throw new Error('System integration not initialized');\n        }\n        \n        try {\n            // Synchronize data across all systems\n            const [screenings, medications, carePlans, messages] = await Promise.allSettled([\n                this.integrations.screening.getPatientScreenings(patientId),\n                this.integrations.medications.getPatientMedications(patientId),\n                this.integrations.carePlans.getPatientCarePlans(patientId),\n                this.integrations.messaging.getPatientMessages(patientId)\n            ]);\n            \n            // Cross-reference and identify integration opportunities\n            const integrationOpportunities = await this.identifyIntegrationOpportunities({\n                patientId,\n                screenings: screenings.value || [],\n                medications: medications.value || [],\n                carePlans: carePlans.value || [],\n                messages: messages.value || []\n            });\n            \n            return {\n                synchronized: true,\n                opportunities: integrationOpportunities,\n                timestamp: new Date().toISOString()\n            };\n            \n        } catch (error) {\n            console.error('Error synchronizing patient data:', error);\n            throw error;\n        }\n    }\n    \n    async identifyIntegrationOpportunities(data) {\n        const opportunities = [];\n        \n        // Check for screenings that should be linked to medications\n        for (const screening of data.screenings) {\n            const relatedMedications = data.medications.filter(med =>\n                this.isMedicationScreeningRelated(med, screening)\n            );\n            \n            if (relatedMedications.length > 0) {\n                opportunities.push({\n                    type: 'medication_screening_link',\n                    description: `Link ${screening.name} screening to ${relatedMedications.length} related medications`,\n                    items: { screening, medications: relatedMedications }\n                });\n            }\n        }\n        \n        // Check for care plan goals that could be automated based on other systems\n        for (const carePlan of data.carePlans) {\n            const automationOpportunities = await this.identifyCarePlanAutomation(\n                carePlan, data.screenings, data.medications\n            );\n            opportunities.push(...automationOpportunities);\n        }\n        \n        return opportunities;\n    }\n    \n    isMedicationScreeningRelated(medication, screening) {\n        // Define relationships between medications and required screenings\n        const relationships = {\n            'statins': ['lipid-panel', 'liver-function'],\n            'ace-inhibitors': ['kidney-function', 'electrolytes'],\n            'metformin': ['kidney-function', 'vitamin-b12'],\n            'warfarin': ['inr', 'pt-ptt'],\n            'lithium': ['lithium-level', 'kidney-function', 'thyroid']\n        };\n        \n        const medicationClass = this.getMedicationClass(medication.name);\n        const requiredScreenings = relationships[medicationClass] || [];\n        \n        return requiredScreenings.some(required =>\n            screening.name.toLowerCase().includes(required)\n        );\n    }\n    \n    getMedicationClass(medicationName) {\n        // Simple medication classification\n        const name = medicationName.toLowerCase();\n        \n        if (name.includes('atorvastatin') || name.includes('simvastatin')) return 'statins';\n        if (name.includes('lisinopril') || name.includes('enalapril')) return 'ace-inhibitors';\n        if (name.includes('metformin')) return 'metformin';\n        if (name.includes('warfarin')) return 'warfarin';\n        if (name.includes('lithium')) return 'lithium';\n        \n        return 'other';\n    }\n    \n    async identifyCarePlanAutomation(carePlan, screenings, medications) {\n        const opportunities = [];\n        \n        // Check if screening results could automatically update care plan goals\n        for (const goal of carePlan.goals || []) {\n            const relatedScreenings = screenings.filter(screening =>\n                this.isScreeningGoalRelated(screening, goal)\n            );\n            \n            if (relatedScreenings.length > 0) {\n                opportunities.push({\n                    type: 'automated_goal_tracking',\n                    description: `Automate ${goal.text} tracking using ${relatedScreenings[0].name} results`,\n                    items: { goal, screening: relatedScreenings[0] }\n                });\n            }\n        }\n        \n        return opportunities;\n    }\n    \n    isScreeningGoalRelated(screening, goal) {\n        const goalText = goal.text.toLowerCase();\n        const screeningName = screening.name.toLowerCase();\n        \n        // Define relationships\n        const relationships = {\n            'hba1c': ['diabetes', 'blood sugar', 'glucose'],\n            'blood pressure': ['hypertension', 'bp', 'blood pressure'],\n            'cholesterol': ['cholesterol', 'lipid', 'heart'],\n            'weight': ['weight', 'bmi', 'lose']\n        };\n        \n        for (const [screeningType, keywords] of Object.entries(relationships)) {\n            if (screeningName.includes(screeningType)) {\n                return keywords.some(keyword => goalText.includes(keyword));\n            }\n        }\n        \n        return false;\n    }\n    \n    // System Health Check\n    async getSystemHealth() {\n        const healthChecks = {};\n        \n        for (const [name, integration] of Object.entries(this.integrations)) {\n            try {\n                healthChecks[name] = await integration.healthCheck();\n            } catch (error) {\n                healthChecks[name] = {\n                    status: 'error',\n                    message: error.message\n                };\n            }\n        }\n        \n        const overallHealth = Object.values(healthChecks).every(check => check.status === 'healthy');\n        \n        return {\n            overall: overallHealth ? 'healthy' : 'degraded',\n            integrations: healthChecks,\n            lastChecked: new Date().toISOString()\n        };\n    }\n}\n\n// Event Bus for inter-system communication\nclass EventBus {\n    constructor() {\n        this.events = {};\n    }\n    \n    on(eventName, handler) {\n        if (!this.events[eventName]) {\n            this.events[eventName] = [];\n        }\n        this.events[eventName].push(handler);\n    }\n    \n    emit(eventName, data) {\n        if (this.events[eventName]) {\n            this.events[eventName].forEach(handler => {\n                try {\n                    handler(data);\n                } catch (error) {\n                    console.error(`Error in event handler for ${eventName}:`, error);\n                }\n            });\n        }\n    }\n    \n    off(eventName, handler) {\n        if (this.events[eventName]) {\n            this.events[eventName] = this.events[eventName].filter(h => h !== handler);\n        }\n    }\n}\n\n// Integration Classes (simplified implementations)\nclass MedicationIntegration {\n    constructor(eventBus) {\n        this.eventBus = eventBus;\n    }\n    \n    async initialize() {\n        console.log('Medication integration initialized');\n    }\n    \n    async healthCheck() {\n        return { status: 'healthy', message: 'All systems operational' };\n    }\n    \n    async getScreeningRelatedMedications(patientId, screeningType) {\n        // Mock implementation\n        return [];\n    }\n    \n    // Additional methods...\n}\n\nclass MessagingIntegration {\n    constructor(eventBus) {\n        this.eventBus = eventBus;\n    }\n    \n    async initialize() {\n        console.log('Messaging integration initialized');\n    }\n    \n    async healthCheck() {\n        return { status: 'healthy', message: 'All systems operational' };\n    }\n    \n    // Additional methods...\n}\n\nclass ScreeningIntegration {\n    constructor(eventBus) {\n        this.eventBus = eventBus;\n    }\n    \n    async initialize() {\n        console.log('Screening integration initialized');\n    }\n    \n    async healthCheck() {\n        return { status: 'healthy', message: 'All systems operational' };\n    }\n    \n    // Additional methods...\n}\n\nclass CarePlanIntegration {\n    constructor(eventBus) {\n        this.eventBus = eventBus;\n    }\n    \n    async initialize() {\n        console.log('Care plan integration initialized');\n    }\n    \n    async healthCheck() {\n        return { status: 'healthy', message: 'All systems operational' };\n    }\n    \n    // Additional methods...\n}\n\nclass NotificationIntegration {\n    constructor(eventBus) {\n        this.eventBus = eventBus;\n    }\n    \n    async initialize() {\n        console.log('Notification integration initialized');\n    }\n    \n    async healthCheck() {\n        return { status: 'healthy', message: 'All systems operational' };\n    }\n    \n    // Additional methods...\n}\n\n// Workflow Classes\nclass ScreeningReminderWorkflow {\n    constructor(integrations) {\n        this.integrations = integrations;\n    }\n    \n    start() {\n        console.log('Screening reminder workflow started');\n    }\n}\n\nclass MedicationScreeningWorkflow {\n    constructor(integrations) {\n        this.integrations = integrations;\n    }\n    \n    start() {\n        console.log('Medication screening workflow started');\n    }\n}\n\nclass CarePlanCoordinationWorkflow {\n    constructor(integrations) {\n        this.integrations = integrations;\n    }\n    \n    start() {\n        console.log('Care plan coordination workflow started');\n    }\n}\n\nclass ProviderCommunicationWorkflow {\n    constructor(integrations) {\n        this.integrations = integrations;\n    }\n    \n    start() {\n        console.log('Provider communication workflow started');\n    }\n}\n\nclass EmergencyProtocolWorkflow {\n    constructor(integrations) {\n        this.integrations = integrations;\n    }\n    \n    start() {\n        console.log('Emergency protocol workflow started');\n    }\n}\n\n// Export for use in other modules\nif (typeof module !== 'undefined' && module.exports) {\n    module.exports = OneCareSystemIntegration;\n} else {\n    window.OneCareSystemIntegration = OneCareSystemIntegration;\n}