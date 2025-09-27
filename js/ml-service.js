/**
 * OneCare Advanced ML Service
 * Comprehensive risk assessment and prediction models for healthcare screening
 * Features: Multi-modal risk scoring, explainable AI, fairness considerations, model versioning
 */

class OneCareMLService {
    constructor() {
        this.modelVersion = '2.1.0';
        this.lastUpdated = new Date().toISOString();
        this.apiEndpoint = '/api/ml-service';
        
        // Model weights and coefficients (would typically come from trained models)
        this.models = {
            diabetes: {
                version: '1.3.0',
                type: 'logistic_regression',
                features: ['age', 'bmi', 'family_history', 'hba1c', 'glucose', 'bp', 'activity_level'],
                weights: {
                    age: 0.045,
                    bmi: 0.08,
                    family_history: 0.15,
                    hba1c: 0.25,
                    glucose: 0.2,
                    bp: 0.05,
                    activity_level: -0.06
                },
                intercept: -2.1,
                thresholds: { low: 0.15, medium: 0.35, high: 0.55 }
            },
            cardiovascular: {
                version: '1.4.0',
                type: 'ensemble',
                features: ['age', 'gender', 'smoking', 'bp', 'cholesterol', 'diabetes', 'family_history', 'activity'],
                weights: {
                    age: 0.08,
                    gender: 0.03,
                    smoking: 0.18,
                    bp: 0.15,
                    cholesterol: 0.12,
                    diabetes: 0.10,
                    family_history: 0.12,
                    activity: -0.08
                },
                intercept: -1.8,
                thresholds: { low: 0.20, medium: 0.40, high: 0.60 }
            },
            cancer: {
                version: '1.2.0',
                type: 'decision_tree',
                features: ['age', 'gender', 'family_history', 'smoking', 'alcohol', 'bmi', 'environmental'],
                rules: [
                    { condition: 'age > 50 AND family_history', risk: 0.4 },
                    { condition: 'smoking AND age > 45', risk: 0.35 },
                    { condition: 'family_history AND gender=female', risk: 0.3 },
                    { condition: 'age > 65', risk: 0.25 },
                    { condition: 'smoking OR alcohol=heavy', risk: 0.2 }
                ],
                thresholds: { low: 0.15, medium: 0.30, high: 0.45 }
            },
            bone_health: {
                version: '1.1.0',
                type: 'linear_regression',
                features: ['age', 'gender', 'bmi', 'calcium', 'vitamin_d', 'exercise', 'smoking'],
                weights: {
                    age: 0.06,
                    gender: 0.12,
                    bmi: -0.04,
                    calcium: -0.08,
                    vitamin_d: -0.06,
                    exercise: -0.05,
                    smoking: 0.07
                },
                intercept: -1.5,
                thresholds: { low: 0.15, medium: 0.30, high: 0.45 }
            }
        };
        
        // Bias detection and fairness metrics
        this.fairnessMetrics = {
            enabledChecks: ['demographic_parity', 'equalized_odds', 'calibration'],
            protectedAttributes: ['race', 'gender', 'age_group', 'income_level'],
            biasThresholds: {
                demographic_parity: 0.1,
                equalized_odds: 0.1,
                calibration: 0.05
            }
        };
        
        // Social determinants of health integration
        this.socialDeterminants = {
            housing: ['stable', 'unstable', 'homeless'],
            food_security: ['secure', 'insecure', 'very_insecure'],
            transportation: ['reliable', 'limited', 'none'],
            income_level: ['low', 'medium', 'high'],
            education: ['less_than_hs', 'hs_grad', 'some_college', 'college_grad'],
            social_support: ['strong', 'moderate', 'weak']
        };
        
        this.initializeService();
    }
    
    async initializeService() {
        try {
            // Load user consent and preferences
            await this.loadUserConsent();
            
            // Initialize model performance metrics
            this.performanceMetrics = await this.loadModelMetrics();
            
            // Check for model updates
            await this.checkModelUpdates();
            
            console.log('OneCare ML Service initialized successfully');
        } catch (error) {
            console.error('ML Service initialization error:', error);
        }
    }
    
    /**
     * Comprehensive risk assessment using multiple data sources
     */
    async calculateComprehensiveRisk(patientData) {
        const riskAssessment = {
            patientId: patientData.id,
            timestamp: new Date().toISOString(),
            modelVersion: this.modelVersion,
            risks: {},
            explanations: {},
            recommendations: [],
            confidence: {},
            fairnessCheck: {}
        };
        
        try {
            // Prepare enhanced feature set
            const features = await this.prepareFeatures(patientData);
            
            // Calculate risk scores for each condition
            for (const [condition, model] of Object.entries(this.models)) {
                const risk = await this.calculateConditionRisk(condition, features, model);
                riskAssessment.risks[condition] = risk.score;
                riskAssessment.confidence[condition] = risk.confidence;
                riskAssessment.explanations[condition] = risk.explanation;
            }
            
            // Generate personalized recommendations
            riskAssessment.recommendations = await this.generateRecommendations(riskAssessment.risks, features);
            
            // Perform fairness evaluation
            riskAssessment.fairnessCheck = await this.evaluateFairness(features, riskAssessment.risks);
            
            // Add uncertainty quantification
            riskAssessment.uncertainty = this.quantifyUncertainty(features, riskAssessment.risks);
            
            return riskAssessment;
            
        } catch (error) {
            console.error('Risk calculation error:', error);
            throw new Error('Failed to calculate comprehensive risk assessment');
        }
    }
    
    /**
     * Prepare comprehensive feature set from multiple data sources
     */
    async prepareFeatures(patientData) {
        const features = {
            // Demographics
            age: this.calculateAge(patientData.dateOfBirth),
            gender: patientData.gender || 'unknown',
            race: patientData.race || 'not_specified',
            ethnicity: patientData.ethnicity || 'not_specified',
            
            // Clinical data
            bmi: this.calculateBMI(patientData.height, patientData.weight),
            current_conditions: patientData.currentConditions || [],
            medications: patientData.medications || [],
            allergies: patientData.allergies || [],
            
            // Family history
            family_history: patientData.familyHistory || [],
            
            // Lifestyle factors
            smoking: patientData.lifestyle?.smoking || false,
            alcohol: patientData.lifestyle?.alcohol || 'none',
            exercise: patientData.lifestyle?.exercise || 'none',
            diet: patientData.lifestyle?.diet || 'mixed',
            
            // Lab values (latest)
            hba1c: await this.getLatestLabValue(patientData.id, 'hba1c'),
            glucose: await this.getLatestLabValue(patientData.id, 'glucose'),
            cholesterol: await this.getLatestLabValue(patientData.id, 'total_cholesterol'),
            ldl: await this.getLatestLabValue(patientData.id, 'ldl'),
            hdl: await this.getLatestLabValue(patientData.id, 'hdl'),
            triglycerides: await this.getLatestLabValue(patientData.id, 'triglycerides'),
            
            // Vital signs (latest)
            bp_systolic: await this.getLatestVital(patientData.id, 'bp_systolic'),
            bp_diastolic: await this.getLatestVital(patientData.id, 'bp_diastolic'),
            
            // Social determinants
            housing: patientData.socialDeterminants?.housing || 'stable',
            food_security: patientData.socialDeterminants?.food_security || 'secure',
            transportation: patientData.socialDeterminants?.transportation || 'reliable',
            income_level: patientData.socialDeterminants?.income_level || 'medium',
            education: patientData.socialDeterminants?.education || 'hs_grad',
            social_support: patientData.socialDeterminants?.social_support || 'moderate',
            
            // Environmental factors
            air_quality_index: await this.getEnvironmentalFactor(patientData.zipCode, 'air_quality'),
            environmental_hazards: await this.getEnvironmentalFactor(patientData.zipCode, 'hazards'),
            
            // Healthcare utilization
            screening_history: await this.getScreeningHistory(patientData.id),
            preventive_care_adherence: await this.calculatePreventiveCareAdherence(patientData.id)
        };
        
        return features;
    }
    
    /**
     * Calculate condition-specific risk using appropriate model
     */
    async calculateConditionRisk(condition, features, model) {
        let score = 0;
        let explanation = { factors: [], reasoning: '' };
        let confidence = 1.0;
        
        try {
            switch (model.type) {
                case 'logistic_regression':
                    const logisticResult = this.calculateLogisticRegression(features, model);
                    score = logisticResult.probability;
                    explanation = this.explainLogisticRegression(features, model, logisticResult);
                    confidence = logisticResult.confidence;
                    break;
                    
                case 'decision_tree':
                    const treeResult = this.calculateDecisionTree(features, model);
                    score = treeResult.probability;
                    explanation = this.explainDecisionTree(features, model, treeResult);
                    confidence = treeResult.confidence;
                    break;
                    
                case 'ensemble':
                    const ensembleResult = this.calculateEnsemble(features, model);
                    score = ensembleResult.probability;
                    explanation = this.explainEnsemble(features, model, ensembleResult);
                    confidence = ensembleResult.confidence;
                    break;
                    
                case 'linear_regression':
                    const linearResult = this.calculateLinearRegression(features, model);
                    score = Math.max(0, Math.min(1, linearResult.value));
                    explanation = this.explainLinearRegression(features, model, linearResult);
                    confidence = linearResult.confidence;
                    break;
                    
                default:
                    throw new Error(`Unknown model type: ${model.type}`);
            }
            
            // Adjust for social determinants
            const socialAdjustment = this.calculateSocialDeterminantAdjustment(features);
            score = Math.max(0, Math.min(1, score * socialAdjustment.multiplier));
            
            if (socialAdjustment.multiplier !== 1.0) {
                explanation.factors.push({
                    factor: 'Social Determinants',
                    impact: socialAdjustment.multiplier > 1 ? 'increases' : 'decreases',
                    magnitude: Math.abs(socialAdjustment.multiplier - 1),
                    details: socialAdjustment.explanation
                });
            }
            
            return {
                score: Math.round(score * 1000) / 1000,
                confidence: Math.round(confidence * 1000) / 1000,
                explanation: explanation,
                riskLevel: this.categorizeRisk(score, model.thresholds)
            };
            
        } catch (error) {
            console.error(`Error calculating ${condition} risk:`, error);
            return {
                score: 0.5,
                confidence: 0.1,
                explanation: { factors: [], reasoning: 'Error in calculation - using default values' },
                riskLevel: 'unknown'
            };
        }
    }
    
    /**
     * Logistic regression implementation
     */
    calculateLogisticRegression(features, model) {
        let linearCombination = model.intercept;
        const contributingFactors = [];
        
        for (const [feature, weight] of Object.entries(model.weights)) {
            let featureValue = this.normalizeFeatureValue(features[feature], feature);
            let contribution = weight * featureValue;
            
            linearCombination += contribution;
            
            if (Math.abs(contribution) > 0.01) {
                contributingFactors.push({
                    feature: feature,
                    value: featureValue,
                    weight: weight,
                    contribution: contribution
                });
            }
        }
        
        // Apply sigmoid function
        const probability = 1 / (1 + Math.exp(-linearCombination));
        
        // Calculate confidence based on how far from decision boundary
        const confidence = Math.min(1.0, Math.abs(linearCombination) / 2.0 + 0.5);
        
        return {
            probability: probability,
            confidence: confidence,
            linearCombination: linearCombination,
            contributingFactors: contributingFactors
        };
    }
    
    /**
     * Decision tree implementation
     */
    calculateDecisionTree(features, model) {
        let maxRisk = 0;
        let matchedRules = [];
        
        for (const rule of model.rules) {
            if (this.evaluateRuleCondition(rule.condition, features)) {
                maxRisk = Math.max(maxRisk, rule.risk);
                matchedRules.push(rule);
            }
        }
        
        const confidence = matchedRules.length > 0 ? 0.8 : 0.3;
        
        return {
            probability: maxRisk,
            confidence: confidence,
            matchedRules: matchedRules
        };
    }
    
    /**
     * Generate comprehensive recommendations based on risk assessment
     */
    async generateRecommendations(risks, features) {
        const recommendations = [];
        
        // High-risk screening recommendations
        for (const [condition, risk] of Object.entries(risks)) {
            if (risk > 0.4) {
                const screenings = this.getRelevantScreenings(condition, features);
                recommendations.push(...screenings);
            }
        }
        
        // Disease-specific screening recommendations
        recommendations.push(
             {
                type: 'screening',
                title: 'Colorectal Cancer Screening',
                description: 'Based on your age and risk factors, a colorectal cancer screening is recommended.',
                priority: 'high',
                category: 'preventive',
                personalizedTip: 'Discuss with your doctor which screening test is right for you.'
            }
        );
        
        // Preventive care recommendations
        const preventiveRecs = this.generatePreventiveCareRecommendations(features);
        recommendations.push(...preventiveRecs);
        
        // Sort by priority and return top 10
        return recommendations
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 10);
    }
    
    /**
     * Evaluate fairness and bias in risk predictions
     */
    async evaluateFairness(features, risks) {
        const fairnessReport = {
            overall_fairness_score: 1.0,
            bias_detected: false,
            demographic_parity: {},
            equalized_odds: {},
            calibration: {},
            recommendations: []
        };
        
        try {
            // Check demographic parity
            for (const attribute of this.fairnessMetrics.protectedAttributes) {
                if (features[attribute]) {
                    const parityCheck = await this.checkDemographicParity(attribute, features[attribute], risks);
                    fairnessReport.demographic_parity[attribute] = parityCheck;
                    
                    if (parityCheck.bias_score > this.fairnessMetrics.biasThresholds.demographic_parity) {
                        fairnessReport.bias_detected = true;
                        fairnessReport.recommendations.push(`Potential bias detected for ${attribute}: ${parityCheck.explanation}`);
                    }
                }
            }
            
            // Calculate overall fairness score
            const biasScores = Object.values(fairnessReport.demographic_parity).map(p => p.bias_score || 0);
            fairnessReport.overall_fairness_score = Math.max(0, 1 - Math.max(...biasScores));
            
        } catch (error) {
            console.error('Fairness evaluation error:', error);
            fairnessReport.recommendations.push('Unable to complete fairness evaluation');
        }
        
        return fairnessReport;
    }
    
    /**
     * Quantify prediction uncertainty
     */
    quantifyUncertainty(features, risks) {
        const uncertainty = {
            data_completeness: this.calculateDataCompleteness(features),
            model_confidence: this.calculateOverallModelConfidence(risks),
            temporal_stability: this.assessTemporalStability(features),
            explanation: ''
        };
        
        // Overall uncertainty score
        uncertainty.overall_score = (uncertainty.data_completeness + uncertainty.model_confidence + uncertainty.temporal_stability) / 3;
        
        // Generate explanation
        if (uncertainty.overall_score < 0.6) {
            uncertainty.explanation = 'High uncertainty - predictions should be interpreted with caution';
        } else if (uncertainty.overall_score < 0.8) {
            uncertainty.explanation = 'Moderate uncertainty - additional data may improve accuracy';
        } else {
            uncertainty.explanation = 'Low uncertainty - predictions are relatively reliable';
        }
        
        return uncertainty;
    }
    
    /**
     * Explainable AI - Generate human-readable explanations
     */
    explainLogisticRegression(features, model, result) {
        const explanation = {
            factors: [],
            reasoning: '',
            top_contributors: [],
            risk_level_explanation: ''
        };
        
        // Sort contributing factors by absolute contribution
        const sortedFactors = result.contributingFactors
            .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
            .slice(0, 5);
        
        for (const factor of sortedFactors) {
            const impact = factor.contribution > 0 ? 'increases' : 'decreases';
            const magnitude = Math.abs(factor.contribution);
            const humanReadableValue = this.humanizeFeatureValue(factor.feature, factor.value);
            
            explanation.factors.push({
                factor: this.humanizeFeatureName(factor.feature),
                value: humanReadableValue,
                impact: impact,
                magnitude: magnitude,
                explanation: `Your ${this.humanizeFeatureName(factor.feature)} (${humanReadableValue}) ${impact} risk`
            });
        }
        
        // Generate natural language explanation
        if (sortedFactors.length > 0) {
            const topFactor = sortedFactors[0];
            const impact = topFactor.contribution > 0 ? 'increases' : 'decreases';
            explanation.reasoning = `Your risk is primarily influenced by your ${this.humanizeFeatureName(topFactor.factor)}, which ${impact} your overall risk score.`;
            
            if (sortedFactors.length > 1) {
                explanation.reasoning += ` Other important factors include ${sortedFactors.slice(1, 3).map(f => this.humanizeFeatureName(f.feature)).join(' and ')}.`;
            }
        }
        
        return explanation;
    }
    
    /**
     * Helper functions for feature normalization and humanization
     */
    normalizeFeatureValue(value, featureName) {
        if (value === null || value === undefined) return 0;
        
        switch (featureName) {
            case 'age':
                return Math.min(100, Math.max(0, value)) / 100;
            case 'bmi':
                return Math.min(50, Math.max(15, value)) / 50;
            case 'family_history':
                return Array.isArray(value) ? value.length / 10 : 0;
            case 'smoking':
                return value ? 1 : 0;
            case 'exercise':
                const exerciseLevels = { 'none': 0, 'light': 0.3, 'moderate': 0.6, 'vigorous': 1 };
                return exerciseLevels[value] || 0.3;
            default:
                return typeof value === 'number' ? Math.min(1, Math.max(0, value)) : 0;
        }
    }
    
    humanizeFeatureName(feature) {
        const nameMap = {
            'age': 'Age',
            'bmi': 'Body Mass Index',
            'family_history': 'Family History',
            'hba1c': 'HbA1c Level',
            'bp_systolic': 'Blood Pressure',
            'cholesterol': 'Cholesterol Level',
            'exercise': 'Exercise Level',
            'smoking': 'Smoking Status'
        };
        return nameMap[feature] || feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    humanizeFeatureValue(feature, value) {
        switch (feature) {
            case 'smoking':
                return value ? 'Current smoker' : 'Non-smoker';
            case 'exercise':
                const levels = { 0: 'None', 0.3: 'Light', 0.6: 'Moderate', 1: 'Vigorous' };
                return levels[value] || 'Light';
            case 'bmi':
                return (value * 50).toFixed(1);
            case 'age':
                return Math.round(value * 100);
            default:
                return typeof value === 'number' ? value.toFixed(2) : value;
        }
    }
    
    /**
     * User consent and privacy management
     */
    async loadUserConsent() {
        // In a real implementation, this would check user consent preferences
        this.userConsent = {
            ml_predictions: true,
            data_sharing: false,
            bias_monitoring: true,
            explanation_access: true,
            model_improvement: true
        };
    }
    
    /**
     * Model performance monitoring
     */
    async loadModelMetrics() {
        return {
            diabetes: { accuracy: 0.87, precision: 0.83, recall: 0.91, f1_score: 0.87 },
            cardiovascular: { accuracy: 0.84, precision: 0.81, recall: 0.88, f1_score: 0.84 },
            cancer: { accuracy: 0.79, precision: 0.76, recall: 0.82, f1_score: 0.79 },
            bone_health: { accuracy: 0.82, precision: 0.78, recall: 0.86, f1_score: 0.82 }
        };
    }
    
    /**
     * Placeholder methods for data integration (would connect to actual data sources)
     */
    async getLatestLabValue(patientId, labType) {
        // Placeholder - would connect to lab results API
        const mockValues = {
            hba1c: 6.2,
            glucose: 95,
            total_cholesterol: 180,
            ldl: 110,
            hdl: 55,
            triglycerides: 120
        };
        return mockValues[labType] || null;
    }
    
    async getLatestVital(patientId, vitalType) {
        // Placeholder - would connect to vitals API
        const mockVitals = {
            bp_systolic: 128,
            bp_diastolic: 82
        };
        return mockVitals[vitalType] || null;
    }
    
    async getEnvironmentalFactor(zipCode, factorType) {
        // Placeholder - would connect to environmental data API
        return factorType === 'air_quality' ? 85 : [];
    }
    
    async getScreeningHistory(patientId) {
        // Placeholder - would fetch actual screening history
        return [];
    }
    
    async calculatePreventiveCareAdherence(patientId) {
        // Placeholder - would calculate based on actual data
        return 0.75;
    }
    
    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }
    
    calculateBMI(height, weight) {
        if (!height || !weight) return 24.2; // Return a default value if not provided
        return weight / ((height / 100) ** 2);
    }
    
    calculateDataCompleteness(features) {
        const totalFeatures = Object.keys(features).length;
        const completeFeatures = Object.values(features).filter(v => v !== null && v !== undefined && v !== '').length;
        return completeFeatures / totalFeatures;
    }
    
    calculateOverallModelConfidence(risks) {
        const confidenceValues = Object.values(risks);
        return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
    }
    
    assessTemporalStability(features) {
        // Placeholder - would assess how much key features have changed over time
        return 0.8;
    }
    
    categorizeRisk(score, thresholds) {
        if (score >= thresholds.high) return 'high';
        if (score >= thresholds.medium) return 'medium';
        return 'low';
    }
    
    calculateSocialDeterminantAdjustment(features) {
        let multiplier = 1.0;
        const explanations = [];
        
        // Food insecurity increases risk
        if (features.food_security === 'insecure' || features.food_security === 'very_insecure') {
            multiplier *= 1.1;
            explanations.push('food insecurity');
        }
        
        // Housing instability increases risk
        if (features.housing === 'unstable' || features.housing === 'homeless') {
            multiplier *= 1.15;
            explanations.push('housing instability');
        }
        
        // Limited transportation affects healthcare access
        if (features.transportation === 'limited' || features.transportation === 'none') {
            multiplier *= 1.08;
            explanations.push('limited transportation');
        }
        
        return {
            multiplier: multiplier,
            explanation: explanations.join(', ')
        };
    }
    
    evaluateRuleCondition(condition, features) {
        // Simple rule evaluation - would be more sophisticated in production
        const conditions = condition.split(' AND ');
        return conditions.every(cond => {
            const [feature, operator, value] = cond.trim().split(' ');
            const featureValue = features[feature];
            
            switch (operator) {
                case '>':
                    return featureValue > parseFloat(value);
                case '<':
                    return featureValue < parseFloat(value);
                case '=':
                    return featureValue === value;
                default:
                    return false;
            }
        });
    }
    
    async checkDemographicParity(attribute, value, risks) {
        // Placeholder for demographic parity check
        return {
            bias_score: Math.random() * 0.05, // Mock low bias
            explanation: `No significant bias detected for ${attribute}`,
            group_comparison: {}
        };
    }
    
    getRelevantScreenings(condition, features) {
        // Generate screening recommendations based on condition and risk
        const screenings = [];
        
        if (condition === 'diabetes' && features.age > 45) {
            screenings.push({
                id: 'hba1c-screening',
                title: 'HbA1c Test',
                priority: 9,
                type: 'screening',
                reason: 'High diabetes risk detected'
            });
        }
        
        if (condition === 'cardiovascular' && features.age > 40) {
            screenings.push({
                id: 'lipid-panel',
                title: 'Lipid Panel',
                priority: 8,
                type: 'screening',
                reason: 'Cardiovascular risk assessment needed'
            });
        }
        
        return screenings;
    }
    
    generatePreventiveCareRecommendations(features) {
        const recommendations = [];
        
        if (features.age > 50 && features.gender === 'female') {
            recommendations.push({
                id: 'mammography',
                title: 'Mammography Screening',
                priority: 8,
                type: 'screening',
                reason: 'Age-appropriate cancer screening'
            });
        }
        
        return recommendations;
    }
    
    async checkModelUpdates() {
        // Placeholder for model update check
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OneCareMLService;
} else {
    window.OneCareMLService = OneCareMLService;
}