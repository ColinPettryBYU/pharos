# ML Pipeline Agent — Pharos

> Reference `CLAUDE.md` for project context, database schema (actual CSV headers), and ML pipeline overview.

You are responsible for building 4 complete, end-to-end machine learning pipelines. Each pipeline must follow the full lifecycle: Problem Framing → Data Prep → Exploration → Modeling → Evaluation → Feature Selection → Deployment. Each notebook must be self-contained, executable, and include written analysis — not just code.

All notebooks go in `ml-pipelines/` directory.

---

## General Requirements

- **Notebooks**: Jupyter `.ipynb` format, fully executable top-to-bottom
- **Data paths**: Reference `../lighthouse_csv_v7/` (relative to ml-pipelines/)
- **Libraries**: pandas, numpy, scikit-learn, matplotlib, seaborn, statsmodels (for OLS), xgboost/lightgbm optional
- **Each pipeline**: BOTH a causal/explanatory model AND a predictive model
- **Written analysis**: Markdown cells explaining every decision, not just code
- **Business terms**: Interpret all results in terms the organization would understand
- **Export**: Save final predictive models for deployment (pickle, joblib, or ONNX)

---

## Pipeline 1: Donor Churn Predictor

**File**: `ml-pipelines/donor-churn-predictor.ipynb`

### Section 1: Problem Framing
> Write 2-3 paragraphs explaining:
- The organization depends on donors. Losing donors without understanding why threatens sustainability.
- **Business question**: Which donors are at risk of not giving again within the next 6 months?
- **Predictive approach** is appropriate because the goal is to identify at-risk donors BEFORE they lapse so staff can intervene with personalized outreach.
- **Explanatory approach** also needed to understand WHAT drives churn — is it donation frequency? Campaign type? Acquisition channel? These insights inform retention strategy.
- **Success metric**: AUC-ROC for prediction (we care about ranking donors by risk). For explanation, coefficient significance and direction.

### Section 2: Data Acquisition, Preparation & Exploration

**Tables needed**: `supporters.csv`, `donations.csv`, `donation_allocations.csv`, `social_media_posts.csv`

**Feature engineering** (per supporter):
```python
# From donations table
- total_donations: count of all donations
- total_monetary_amount: sum of amount where donation_type == 'Monetary'
- avg_donation_amount: mean monetary amount
- max_donation_amount: max single donation
- donation_frequency_days: avg days between donations
- days_since_last_donation: (reference_date - max(donation_date))
- recency_bucket: categorize days_since_last_donation
- num_campaigns_participated: count distinct campaign_name
- has_recurring: any is_recurring == True
- donation_type_diversity: count distinct donation_types
- pct_monetary: proportion of donations that are Monetary
- channel_diversity: count distinct channel_source
- primary_channel: mode of channel_source
- donation_trend: slope of amount over time (increasing/flat/decreasing)
- social_media_referred: count of donations with referral_post_id not null

# From supporters table
- supporter_type
- relationship_type (Local vs International)
- acquisition_channel
- tenure_days: (reference_date - first_donation_date)
- country (Philippines vs international)

# From donation_allocations
- num_safehouses_supported: count distinct safehouse_id
- primary_program_area: mode of program_area
```

**Target variable**: 
```python
# Define churn: donor has not made a donation in the last 6 months of the data
# Use a cutoff: train on donors' behavior up to month X, predict if they donate in months X to X+6
reference_date = donations['donation_date'].max()
cutoff_date = reference_date - pd.Timedelta(days=180)

# For each supporter: did they donate after cutoff_date?
# churned = 1 if NO donation after cutoff_date, 0 if they did donate
```

**Exploration**:
- Distribution of donation amounts (likely right-skewed)
- Donation frequency histogram
- Churn rate by acquisition channel (bar chart)
- Churn rate by supporter type
- Correlation matrix of numeric features
- Time series of monthly donation counts
- Recency vs churn scatter/box plot

### Section 3: Modeling & Feature Selection

**Explanatory Model** (OLS Logistic Regression):
```python
import statsmodels.api as sm

# Use statsmodels for interpretable coefficients
# logit_model = sm.Logit(y, X_with_const).fit()
# Print summary with coefficients, p-values, confidence intervals
# Interpret: "Each additional day since last donation increases churn odds by X%"
# Interpret: "Recurring donors are Y% less likely to churn"
```

**Predictive Model** (Random Forest or Gradient Boosting):
```python
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score

# 80/20 train/test split, stratified
# Hyperparameter tuning with GridSearchCV or RandomizedSearchCV
# Compare: Logistic Regression, Random Forest, GBM
# Select best by AUC-ROC on test set
```

**Feature Selection**:
- Use feature importance from tree model
- Compare with RFE (Recursive Feature Elimination)
- Show which features matter most and explain why in business terms

### Section 4: Evaluation & Interpretation

- ROC curve + AUC score
- Confusion matrix with business interpretation:
  - False Positive (predict churn, they don't): "We reach out to a happy donor — minor cost, no harm"
  - False Negative (predict no churn, they do): "We miss an at-risk donor and lose them — HIGH cost"
  - Therefore: optimize for recall (catching at-risk donors), accept some false positives
- Precision-Recall curve
- Classification report
- **Business interpretation**: "The model identifies X% of at-risk donors with Y% precision. This means staff can focus outreach on Z donors per month rather than guessing."

### Section 5: Causal and Relationship Analysis

- Discuss which features are most predictive and whether causation is defensible
- "Days since last donation is the strongest predictor — but this is tautological. More interesting: acquisition channel matters. Donors acquired via Church have 30% lower churn than SocialMedia-acquired donors. This suggests investing in church partnerships."
- "Recurring donors churn at 1/3 the rate — converting one-time donors to recurring should be a priority."
- Acknowledge limitations: observational data, no randomized experiments

### Section 6: Deployment Notes
- Export model: `joblib.dump(best_model, 'donor_churn_model.pkl')`
- Export feature list and preprocessing pipeline
- API endpoint: `GET /api/ml/donor-churn-risk` returns all supporters with risk scores
- Frontend: Risk badge on donor list, alert cards on admin dashboard for high-risk donors

---

## Pipeline 2: Social Media Optimizer

**File**: `ml-pipelines/social-media-optimizer.ipynb`

### Section 1: Problem Framing
- The org posts sporadically and doesn't know what works. They need data-driven social media strategy.
- **Two questions**:
  1. **Explanatory**: What post characteristics CAUSE higher donation referrals? (Not just engagement — donations)
  2. **Predictive**: Given a planned post's characteristics, what engagement and donation referrals can we expect?
- The distinction matters: a post might get high engagement (likes, shares) but zero donations. The org needs to know what drives DONATIONS.
- **Success metrics**: R² and RMSE for prediction. Coefficient significance for explanation.

### Section 2: Data Acquisition & Exploration

**Tables**: `social_media_posts.csv`, `donations.csv` (for referral_post_id linkage)

**Features** (from social_media_posts):
```python
# Categorical (one-hot encode)
- platform: Facebook, Instagram, Twitter, TikTok, LinkedIn, YouTube, WhatsApp
- post_type: ImpactStory, Campaign, EventPromotion, ThankYou, EducationalContent, FundraisingAppeal
- media_type: Photo, Video, Carousel, Text, Reel
- content_topic: Education, Health, Reintegration, DonorImpact, SafehouseLife, etc.
- sentiment_tone: Hopeful, Urgent, Celebratory, Informative, Grateful, Emotional
- call_to_action_type: DonateNow, LearnMore, ShareStory, SignUp (+ None)
- day_of_week

# Numeric
- post_hour (cyclical encode: sin/cos)
- caption_length
- num_hashtags
- mentions_count
- has_call_to_action (bool)
- features_resident_story (bool)
- is_boosted (bool)
- boost_budget_php (0 if not boosted)
- follower_count_at_post

# Derived
- is_weekend: day_of_week in (Saturday, Sunday)
- time_bucket: morning/afternoon/evening/night
- caption_length_bucket: short/medium/long
```

**Target variables**:
- For engagement prediction: `engagement_rate`
- For donation prediction: `donation_referrals` and `estimated_donation_value_php`

**Exploration**:
- Engagement rate distribution by platform (box plots)
- Donation referrals by post_type (this is the key insight)
- Heatmap: day_of_week × post_hour colored by avg engagement_rate
- Correlation between engagement metrics (likes, shares, comments) and donation_referrals
- Does boosted content drive more donations? (compare boosted vs organic)
- Features_resident_story impact on donations (THIS is likely a strong signal)
- Caption length vs engagement (scatter)

### Section 3: Modeling

**Explanatory Model** (OLS Linear Regression on donation_referrals):
```python
# Use statsmodels OLS for interpretable coefficients
# Focus on donation_referrals as target
# Key question: what CAUSES donations, not just engagement?
# Look for: post_type coefficients, features_resident_story, has_call_to_action, platform effects
```

**Predictive Models**:
```python
# Model 1: Predict engagement_rate (regression)
# Model 2: Predict donation_referrals (regression or classification: 0 vs >0)
# Compare: Linear Regression, Random Forest, XGBoost
# Cross-validation with 5-fold
```

### Section 4: Evaluation
- R² score for regression models
- RMSE in business terms: "The model predicts donation referrals within ±X of actual"
- Feature importance ranking
- Residual plots to check model assumptions (for OLS)
- **Business interpretation**: "ImpactStory posts with DonateNow CTA posted on Tuesday evenings generate 3.2x more donation referrals than average"

### Section 5: Causal Analysis
- OLS coefficients: "Posts featuring resident stories increase donation referrals by X on average, holding other factors constant"
- Discuss confounding: boosted posts may have both higher engagement AND higher donation referrals — is it the boost or the content?
- "Sentiment tone 'Urgent' correlates with higher donations but also with FundraisingAppeal post_type — disentangling these requires careful specification"
- Platform effects: "Instagram generates the highest engagement but Facebook drives more donations" (or whatever the data shows)

### Section 6: Deployment
- Export: model pickle + feature preprocessing pipeline
- API: `GET /api/ml/social-media-recommendations` returns:
  - Best day/time to post next
  - Recommended content type
  - Predicted engagement for a given post configuration
- Frontend: Recommendation cards in Social Media Command Center

---

## Pipeline 3: Reintegration Readiness Score

**File**: `ml-pipelines/reintegration-readiness.ipynb`

### Section 1: Problem Framing
- Staff need to know which residents are progressing toward reintegration and which are stalling.
- **Business question**: Based on a resident's trajectory (health, education, counseling, visitations), how ready are they for reintegration?
- **Predictive**: Score each active resident on a 0-100 readiness scale.
- **Explanatory**: What factors most strongly predict successful reintegration?
- **Success metric**: AUC-ROC for binary classification (ready vs not), or RMSE for continuous score.

### Section 2: Data Acquisition & Preparation

**Tables**: `residents.csv`, `process_recordings.csv`, `education_records.csv`, `health_wellbeing_records.csv`, `intervention_plans.csv`, `home_visitations.csv`, `incident_reports.csv`

**Feature engineering** (per resident, using most recent data and trends):
```python
# From residents
- case_category
- sub_categories (binary flags)
- initial_risk_level
- current_risk_level
- tenure_days: (today - date_of_admission)
- age_numeric: parsed from age fields or calculated from DOB
- referral_source
- has_special_needs, is_pwd

# From process_recordings (aggregate per resident)
- total_sessions: count
- avg_session_duration
- recent_emotional_trend: are emotional states improving? 
  (e.g., ratio of positive end-states in last 3 months vs first 3 months)
- pct_progress_noted: % of sessions where progress_noted == True
- pct_concerns_flagged: % of sessions where concerns_flagged == True
- referrals_made_count
- session_frequency: avg days between sessions
- last_session_recency: days since last session
- emotional_improvement_ratio: sessions ending in positive vs negative state

# From education_records
- latest_progress_percent
- progress_trend: slope of progress_percent over time
- latest_attendance_rate
- attendance_trend
- completion_count: how many courses completed

# From health_wellbeing_records
- latest_general_health_score
- health_trend: slope of general_health_score over time
- latest_nutrition_score, sleep_quality_score, energy_level_score
- bmi_in_healthy_range: boolean
- checkup_compliance: % of months with medical/dental/psych checkups done

# From home_visitations
- total_visits
- pct_favorable_outcomes: % of visits with Favorable outcome
- latest_cooperation_level: most recent family_cooperation_level
- safety_concerns_ever: any visit with safety_concerns_noted == True
- cooperation_trend: is family cooperation improving?

# From intervention_plans
- total_plans
- pct_achieved: % of plans with status == Achieved
- active_plans_count: plans with status In Progress or Open
- categories_covered: distinct plan categories

# From incident_reports
- total_incidents
- recent_incidents: incidents in last 3 months
- incident_trend: are incidents decreasing?
- max_severity_ever
- pct_resolved: % of incidents resolved
```

**Target variable**:
```python
# Use residents with reintegration_status == 'Completed' as positive examples
# Use residents with 'Not Started' or 'On Hold' as negative examples
# 'In Progress' can be excluded or treated carefully
# Alternatively: predict current_risk_level improvement (Critical→Low trajectory)
```

### Section 3: Modeling

**Explanatory** (OLS or Logistic Regression):
- What factors most strongly associate with successful reintegration?
- Interpret coefficients: "Each 10% increase in education progress is associated with X% higher odds of successful reintegration"

**Predictive** (Random Forest or Gradient Boosting):
- Binary: ready for reintegration or not
- Or continuous: readiness score 0-100 (use regression)
- Cross-validation, hyperparameter tuning

### Section 4: Evaluation
- Confusion matrix with CRITICAL business interpretation:
  - False Positive (predict ready, not ready): "Premature reintegration could put a girl at risk — VERY HIGH cost"
  - False Negative (predict not ready, is ready): "Girl stays longer than needed — less severe but still costly"
  - **Optimize for precision on 'ready' class** — only recommend reintegration when confident
- Feature importance: which factors matter most?

### Section 5: Causal Analysis
- "Education progress and emotional state improvement are the strongest predictors"
- "Family cooperation level in home visitations is a strong positive predictor — suggests investing in family counseling"
- "Incident frequency is negatively correlated as expected, but the TYPE of incident matters: behavioral incidents are less predictive of failure than security incidents"
- Limitations: small sample (60 residents), selection bias

### Section 6: Deployment
- Export model
- API: `GET /api/ml/reintegration-readiness/{residentId}` returns score + top contributing factors
- Frontend: Visual gauge on resident detail page, risk alert on dashboard

---

## Pipeline 4: Intervention Effectiveness

**File**: `ml-pipelines/intervention-effectiveness.ipynb`

### Section 1: Problem Framing
- Staff create intervention plans but don't know which interventions actually work.
- **Business question**: Which intervention types and services most effectively improve resident outcomes?
- **Explanatory approach** is primary — the goal is understanding causation to guide future intervention decisions.
- **Predictive component**: Given a resident's current state, which intervention would most improve their outcomes?
- **Success metric**: Coefficient significance and explanatory power (Adjusted R²) for explanation. Feature importance for prediction.

### Section 2: Data Acquisition & Preparation

**Tables**: `intervention_plans.csv`, `process_recordings.csv`, `health_wellbeing_records.csv`, `education_records.csv`, `incident_reports.csv`, `residents.csv`

**Approach**: Create a panel dataset at the resident-month level:
```python
# For each resident for each month:
# - What interventions were active?
# - What were the outcome measures?
# - Did outcomes improve compared to previous month?

# Outcome variables (month-over-month change):
- delta_health_score: change in general_health_score
- delta_education_progress: change in progress_percent
- delta_emotional_state: ratio of positive emotional end-states in sessions
- incident_count_this_month: from incident_reports
- progress_noted_ratio: from process_recordings

# Intervention features:
- has_safety_plan: active intervention plan in Safety category
- has_psychosocial_plan: active in Psychosocial
- has_education_plan: active in Education
- has_health_plan: active in Physical Health
- has_legal_plan: active in Legal
- has_reintegration_plan: active in Reintegration
- total_active_plans
- services_provided (parsed): Caring, Healing, Teaching, Legal
- session_count_this_month: process recording sessions
- visitation_count_this_month: home visits
```

### Section 3: Modeling

**Explanatory** (Panel OLS / Fixed Effects):
```python
# Use resident fixed effects to control for unobserved individual characteristics
# This is closer to causal inference than pooled OLS
# statsmodels PanelOLS or manual dummy variables

# Key output: which intervention categories improve which outcomes?
# "Psychosocial interventions improve emotional state by X points/month"
# "Education plans improve progress by Y%/month"
```

**Predictive** (Random Forest on outcome improvement):
- Given current state + active interventions, predict next month's improvement
- Feature importance reveals which combinations of interventions are most effective

### Section 4: Evaluation
- R² for each outcome variable
- Cross-validated RMSE
- Business interpretation: "Adding a psychosocial intervention plan for a resident currently without one is associated with a 0.3-point improvement in emotional state scores per month"
- Compare intervention categories head-to-head

### Section 5: Causal Analysis
- This pipeline's causal analysis is the most important section
- Discuss selection bias: residents who receive more interventions may be worse off to begin with
- Fixed effects help but don't fully solve endogeneity
- "The combination of Psychosocial + Education interventions shows stronger effects than either alone — suggests holistic approaches work best"
- "Legal interventions show no direct health improvement but correlate with reduced security incidents"
- Be honest about limitations

### Section 6: Deployment
- API: `GET /api/ml/intervention-effectiveness` returns intervention insights
- Frontend: Recommendations panel in case conference prep view
- "Based on historical outcomes, we recommend adding a Psychosocial intervention plan for this resident"

---

## Notebook Template Structure

Each notebook should follow this exact structure:

```markdown
# [Pipeline Name]
## Pharos ML Pipeline

### 1. Problem Framing
[2-3 paragraphs: business question, who cares, why it matters, predictive vs explanatory justification]

### 2. Data Acquisition & Preparation
[Load CSVs, explore, clean, engineer features, build pipeline]

### 3. Exploration
[Visualizations, distributions, correlations, key discoveries]

### 4. Explanatory Modeling
[OLS/Logistic regression with statsmodels, coefficient interpretation]

### 5. Predictive Modeling
[sklearn models, comparison, hyperparameter tuning, cross-validation]

### 6. Feature Selection
[Feature importance, selection techniques, business justification]

### 7. Evaluation & Interpretation
[Metrics, confusion matrix, business terms interpretation, error analysis]

### 8. Causal and Relationship Analysis
[Deep discussion of what relationships the data reveals, causation vs correlation, limitations]

### 9. Deployment Notes
[How model is exported, API endpoint, frontend integration, code references]
```

---

## Model Export & .NET Integration

### Option A: ONNX (Recommended)
```python
# In notebook:
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

onnx_model = convert_sklearn(best_model, initial_types=[('X', FloatTensorType([None, n_features]))])
with open('donor_churn_model.onnx', 'wb') as f:
    f.write(onnx_model.SerializeToString())
```

```csharp
// In .NET:
using Microsoft.ML.OnnxRuntime;

var session = new InferenceSession("Models/donor_churn_model.onnx");
var input = new DenseTensor<float>(features, new[] { 1, n_features });
var results = session.Run(new[] { NamedOnnxValue.CreateFromTensor("X", input) });
var prediction = results.First().AsTensor<float>().First();
```

### Option B: Python Microservice
```python
# FastAPI service in ml-pipelines/api/
from fastapi import FastAPI
import joblib

app = FastAPI()
model = joblib.load("donor_churn_model.pkl")

@app.get("/predict/churn/{supporter_id}")
def predict_churn(supporter_id: int):
    features = get_features_for_supporter(supporter_id)
    risk_score = model.predict_proba(features)[0][1]
    return {"supporter_id": supporter_id, "churn_risk": risk_score}
```

Then call from .NET via HttpClient.

### Option C: Pre-compute and Cache
- Run predictions in batch (nightly or on-demand)
- Store results in a `ml_predictions` table in the database
- .NET API reads from this table — simplest approach
- Re-run predictions when data changes significantly

**Recommendation**: Start with Option C (simplest), upgrade to Option A or B if time allows.

---

## Data Path Notes

```python
import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(os.getcwd()), 'lighthouse_csv_v7')
# Or simply:
DATA_DIR = '../lighthouse_csv_v7'

supporters = pd.read_csv(f'{DATA_DIR}/supporters.csv')
donations = pd.read_csv(f'{DATA_DIR}/donations.csv')
# etc.
```

Ensure all data loading uses relative paths from `ml-pipelines/` directory for reproducibility.
