**Pharos ML Pipeline — Engineering Brief**

Instructions for rebuilding functional, textbook-aligned ML pipelines  
and wiring them to the live application

📌  Scope: Fix the ML notebooks and backend ML service. Do NOT change any page layout, component design, color scheme, typography, or UI element. Every change in this brief is either in a .ipynb notebook file or in backend C\# / seeder files.

# **1\. Project Context**

Pharos is a .NET 10 / React nonprofit management application for a Philippine safe-home organization modeled on Lighthouse Sanctuary. The repo is organized into three top-level directories:

* frontend/  — React 19 \+ TypeScript (Vite), deployed to Vercel  
* backend/   — ASP.NET Core 10 / Entity Framework, deployed to Azure App Service  
* ml-pipelines/ — Four Jupyter notebooks (.ipynb) that are supposed to train and export ML models

The application already has a working /api/ml endpoint group (MLController.cs) and a fully wired MLService.cs. However, the service currently computes hand-coded heuristics instead of serving outputs from the trained notebooks. This brief fixes that disconnect and ensures the notebooks themselves comply with textbook-level ML methodology.

## **1.1 Data**

All training data lives in lighthouse\_csv\_v7/ (17 CSV files). The key tables for ML are:

| File | Size | Purpose |
| :---- | :---- | :---- |
| supporters.csv | 60 rows | Donor demographics and acquisition info |
| donations.csv | 420 rows | All donation events — the RFM source |
| donation\_allocations.csv | 521 rows | Program-area allocation per donation |
| residents.csv | 60 rows | Resident demographics, risk levels, reintegration status |
| process\_recordings.csv | 2,819 rows | Counseling sessions — emotional state, progress flags |
| health\_wellbeing\_records.csv | 534 rows | Monthly health scores (1–5 scale) |
| education\_records.csv | 534 rows | Monthly education progress and attendance |
| home\_visitations.csv | 1,337 rows | Family visits — cooperation level, outcome |
| intervention\_plans.csv | 180 rows | Six-category plans per resident |
| incident\_reports.csv | 100 rows | Behavioral/safety incidents |
| social\_media\_posts.csv | \~812 rows | Post metadata, engagement metrics, donation referrals |

## **1.2 Data Path Convention**

All notebooks are in ml-pipelines/. The CSV directory is at the same level as ml-pipelines/. The correct relative path from any notebook cell is:

DATA\_DIR \= '../lighthouse\_csv\_v7'

# **2\. Mandatory Fixes — Apply to All Four Notebooks**

The following fixes must be applied to every notebook before addressing notebook-specific issues. They address the most significant textbook violations identified in the audit.

## **2.1  Run Every Notebook Top-to-Bottom and Save with Outputs**

⚠  The reintegration-readiness.ipynb has ZERO output cells — it has never been executed. All four notebooks must be run in full and saved so that every code cell has inline output. Graders read output cells, not source cells.

Steps:

* Open each notebook in Jupyter or VS Code.  
* Use "Restart Kernel and Run All Cells" (not just Run All — restart ensures a clean state).  
* Verify every code cell produces output (printed values, charts, tables).  
* Save the notebook with outputs included (.ipynb stores them inline).  
* If any cell raises an error, fix the error before saving. The most common issue is a missing library — install with: pip install statsmodels scikit-learn pandas matplotlib seaborn joblib

## **2.2  Add a Baseline Comparison to Every Notebook**

The textbook requires that every model be compared to a naive baseline — a predictor that ignores all features. If the model cannot beat the baseline, the features add no value. Add the following code block immediately before the cross-validation section in each notebook:

For classification notebooks (donor churn, reintegration readiness):

from sklearn.dummy import DummyClassifier

dummy\_clf \= DummyClassifier(strategy='most\_frequent', random\_state=42)  
dummy\_scores \= cross\_val\_score(dummy\_clf, X\_train, y\_train,  
                               cv=cv, scoring='roc\_auc')  
print(f'Baseline (majority class) CV AUC: {dummy\_scores.mean():.3f} ± {dummy\_scores.std():.3f}')  
print(f'Churn rate in training set: {y\_train.mean():.1%}  \-- a model must beat this')  
For regression notebooks (intervention effectiveness, social media optimizer):

from sklearn.dummy import DummyRegressor

dummy\_reg \= DummyRegressor(strategy='mean')  
dummy\_scores\_r2  \= cross\_val\_score(dummy\_reg, X\_train, y\_train, cv=5, scoring='r2')  
dummy\_scores\_rmse \= cross\_val\_score(dummy\_reg, X\_train, y\_train, cv=5,  
                                    scoring='neg\_root\_mean\_squared\_error')  
print(f'Baseline (mean predictor) CV R2:   {dummy\_scores\_r2.mean():.3f}')  
print(f'Baseline (mean predictor) CV RMSE: {(-dummy\_scores\_rmse).mean():.4f}')  
print('The model must beat these figures to justify any feature engineering.')

## **2.3  Report Cross-Validation Results as mean ± std**

The textbook specifies that cross-validation results must always be reported as mean ± std across folds to communicate both performance and stability. Find every line that prints only a mean and change it. Example:

Before (incorrect):

print(f"CV AUC: {scores.mean():.3f}")  
After (correct):

print(f"CV AUC: {scores.mean():.3f} ± {scores.std():.3f}")  
\# A large std (\> 0.05) signals instability and should be noted in the narrative.  
Apply this to every model comparison table. The full results block should look like:

print('\\n── Cross-Validation Results ──')  
for name, res in results.items():  
    print(f"  {name:\<30} AUC: {res\['cv\_auc'\]:.3f} ± {res\['cv\_std'\]:.3f}")

## **2.4  Add VIF Check to All Explanatory (OLS / Logit) Models**

Chapter 16 of the textbook explicitly requires a Variance Inflation Factor (VIF) check before fitting any explanatory model. Multicollinear features inflate each other's standard errors, making coefficients unreliable and causal claims indefensible. Add the following block immediately BEFORE fitting the statsmodels OLS or Logit model in each notebook. Drop any feature with VIF \> 5 and re-fit.

from statsmodels.stats.outliers\_influence import variance\_inflation\_factor

\# VIF check — run on the scaled explanatory feature matrix  
vif\_df \= pd.DataFrame({  
    'feature': X\_exp\_scaled.columns,  
    'VIF': \[variance\_inflation\_factor(X\_exp\_scaled.values, i)  
            for i in range(X\_exp\_scaled.shape\[1\])\]  
}).sort\_values('VIF', ascending=False)

print('── Variance Inflation Factors ──')  
print(vif\_df.to\_string(index=False))  
print()

high\_vif \= vif\_df\[vif\_df\['VIF'\] \> 5\]\['feature'\].tolist()  
if high\_vif:  
    print(f'WARNING: Dropping {high\_vif} due to VIF \> 5 (multicollinearity risk)')  
    explanatory\_features\_final \= \[f for f in explanatory\_features if f not in high\_vif\]  
else:  
    print('All VIF \< 5 — no multicollinearity concern.')  
    explanatory\_features\_final \= explanatory\_features

\# Re-build X\_exp\_scaled using only explanatory\_features\_final  
X\_exp\_clean \= df\[explanatory\_features\_final\].copy()  
X\_exp\_scaled \= pd.DataFrame(  
    scaler\_exp.fit\_transform(X\_exp\_clean),  
    columns=X\_exp\_clean.columns, index=X\_exp\_clean.index  
)  
X\_exp\_const \= sm.add\_constant(X\_exp\_scaled)  
⚠  The variable name after this block must be X\_exp\_const (built from X\_exp\_scaled using explanatory\_features\_final). Update any subsequent references accordingly.

## **2.5  Add an Explicit Overfitting Analysis After Final Model Selection**

After identifying the best model and evaluating it on the test set, add a dedicated markdown cell titled 'Overfitting Analysis' and the following code block. This is a required step in Chapter 15\.

For classification notebooks:

\# ── Overfitting Analysis ───────────────────────────────────────────  
train\_auc\_scores \= cross\_val\_score(best\_model, X\_train, y\_train,  
                                   cv=cv, scoring='roc\_auc')  
train\_auc \= train\_auc\_scores.mean()  
test\_auc  \= roc\_auc\_score(y\_test, y\_proba)  
gap       \= train\_auc \- test\_auc

print(f'Train AUC (CV mean): {train\_auc:.3f}')  
print(f'Test  AUC:           {test\_auc:.3f}')  
print(f'Generalization gap:  {gap:.3f}')  
print()  
if gap \> 0.10:  
    print('⚠  Gap \> 0.10 — model is overfitting. Consider reducing max\_depth or')  
    print('   increasing min\_samples\_leaf before deploying.')  
elif gap \< 0:  
    print('Test AUC \> Train AUC — possible lucky test split; interpret with caution.')  
else:  
    print('✓  Generalization gap is acceptable.')  
For regression notebooks (replace roc\_auc\_score with RMSE):

\# ── Overfitting Analysis ───────────────────────────────────────────  
train\_rmse\_scores \= cross\_val\_score(best\_model, X\_train, y\_train,  
                                    cv=5, scoring='neg\_root\_mean\_squared\_error')  
train\_rmse \= (-train\_rmse\_scores).mean()  
test\_rmse  \= mean\_squared\_error(y\_test, best\_model.predict(X\_test), squared=False)  
gap        \= test\_rmse \- train\_rmse

print(f'Train RMSE (CV mean): {train\_rmse:.4f}')  
print(f'Test  RMSE:           {test\_rmse:.4f}')  
print(f'Generalization gap:   {gap:+.4f}')  
if gap / train\_rmse \> 0.20:  
    print('⚠  Test RMSE is \>20% worse than train — possible overfitting.')  
else:  
    print('✓  Generalization gap is acceptable.')

## **2.6  Fix Data Leakage — Move One-Hot Encoding Inside sklearn Pipeline**

⚠  CRITICAL: Every notebook currently calls pd.get\_dummies() on the full dataset before train\_test\_split. This is a textbook Chapter 7 / 11 violation — the encoder sees test-set category distributions during fitting. The fix below must be applied to the predictive modeling section of each notebook.

Replace the manual get\_dummies \+ StandardScaler pattern with a ColumnTransformer pipeline. The key principle: all preprocessing learns only from training data, then is applied identically to test data.

from sklearn.pipeline import Pipeline  
from sklearn.compose import ColumnTransformer  
from sklearn.preprocessing import StandardScaler, OneHotEncoder  
from sklearn.impute import SimpleImputer

\# 1\. Separate features by type  
numeric\_cols     \= X.select\_dtypes(include='number').columns.tolist()  
categorical\_cols \= X.select\_dtypes(include='object').columns.tolist()

\# 2\. Build sub-pipelines  
numeric\_pipe \= Pipeline(\[  
    ('imputer', SimpleImputer(strategy='median')),  
    ('scaler',  StandardScaler()),  
\])  
categorical\_pipe \= Pipeline(\[  
    ('imputer', SimpleImputer(strategy='most\_frequent')),  
    ('ohe',     OneHotEncoder(handle\_unknown='ignore', sparse\_output=False)),  
\])

\# 3\. Combine into a ColumnTransformer  
preprocessor \= ColumnTransformer(\[  
    ('num', numeric\_pipe, numeric\_cols),  
    ('cat', categorical\_pipe, categorical\_cols),  
\])

\# 4\. Wrap model inside a full Pipeline  
full\_pipeline \= Pipeline(\[  
    ('prep',  preprocessor),  
    ('model', GradientBoostingClassifier(n\_estimators=150, max\_depth=3,  
                                         learning\_rate=0.1, random\_state=42)),  
\])

\# 5\. Now split BEFORE fitting anything  
X\_train, X\_test, y\_train, y\_test \= train\_test\_split(  
    X, y, test\_size=0.2, random\_state=42, stratify=y  
)

\# 6\. Fit on training data ONLY — test data is never seen during fit  
full\_pipeline.fit(X\_train, y\_train)

\# 7\. Evaluate on held-out test set  
y\_pred  \= full\_pipeline.predict(X\_test)  
y\_proba \= full\_pipeline.predict\_proba(X\_test)\[:, 1\]  
test\_auc \= roc\_auc\_score(y\_test, y\_proba)  
print(f'Test AUC-ROC: {test\_auc:.3f}')  
print(classification\_report(y\_test, y\_pred, target\_names=\['Active', 'Churned'\]))  
For cross-validation with the pipeline, pass the pipeline directly — sklearn handles the fit/transform correctly inside each fold:

cv\_scores \= cross\_val\_score(full\_pipeline, X\_train, y\_train,  
                             cv=StratifiedKFold(5, shuffle=True, random\_state=42),  
                             scoring='roc\_auc')  
print(f'CV AUC: {cv\_scores.mean():.3f} ± {cv\_scores.std():.3f}')  
For the explanatory (statsmodels OLS/Logit) model, the Pipeline approach does not apply because statsmodels requires a plain numpy array, not a pipeline object. For those models, use the existing manual scaler approach but ensure the scaler is fit on X\_exp (the curated explanatory feature matrix, not the full feature matrix) and do NOT apply it to the test set. The explanatory model's sole purpose is coefficient interpretation, not prediction on new data — so leakage is less critical there than in the predictive pipeline. The VIF check (Section 2.4) is the more important fix for the explanatory path.

# **3\. Notebook-Specific Fixes**

## **3.1  donor-churn-predictor.ipynb**

File: ml-pipelines/donor-churn-predictor.ipynb

This is the most complete notebook. It loads supporters.csv, donations.csv, and donation\_allocations.csv; engineers 15+ RFM-style features; fits a statsmodels Logit (explanatory) and a GridSearchCV Gradient Boosting classifier (predictive); and exports donor\_churn\_predictions.csv. The specific fixes needed beyond the cross-cutting ones are:

### **Fix A — Annual Donor False-Churn Problem**

The churn label uses a 180-day cutoff. An annual donor who last gave 7 months ago gets labeled 'churned' even though they give reliably every 12 months. Add the following correction BEFORE computing the churn target:

\# Flag donors whose historical median gap between donations is \> 150 days  
\# (annual+ donors) so they are excluded from the churn label or treated separately  
donor\_gaps \= donations.sort\_values(\['supporter\_id','donation\_date'\]).groupby('supporter\_id').apply(  
    lambda g: g\['donation\_date'\].diff().dt.days.median()  
).reset\_index()  
donor\_gaps.columns \= \['supporter\_id', 'median\_gap\_days'\]

\# Add as a feature so the model can learn annual vs frequent donor behavior  
\# (do NOT exclude annual donors from the dataset; the flag is a feature, not a filter)  
donation\_features \= donation\_features.merge(donor\_gaps, on='supporter\_id', how='left')  
donation\_features\['median\_gap\_days'\] \= donation\_features\['median\_gap\_days'\].fillna(  
    donation\_features\['median\_gap\_days'\].median())  
donation\_features\['is\_likely\_annual'\] \= (donation\_features\['median\_gap\_days'\] \> 150).astype(int)  
Then add a markdown note below the churn target definition explaining this limitation and how the new feature partially addresses it.

### **Fix B — Joblib Export Must Target the ml-pipelines/ Directory**

The export block currently saves to the current working directory with no path. Change the paths so the artifacts land in a predictable location relative to the repo:

import os, joblib

ARTIFACTS\_DIR \= '.'   \# notebooks run from ml-pipelines/

joblib.dump(full\_pipeline,  os.path.join(ARTIFACTS\_DIR, 'donor\_churn\_pipeline.pkl'))  
joblib.dump(feature\_cols,   os.path.join(ARTIFACTS\_DIR, 'donor\_churn\_features.pkl'))  
risk\_df.to\_csv(os.path.join(ARTIFACTS\_DIR, 'donor\_churn\_predictions.csv'), index=False)

print('Saved: donor\_churn\_pipeline.pkl')  
print('Saved: donor\_churn\_features.pkl')  
print('Saved: donor\_churn\_predictions.csv')  
print(f'Predictions shape: {risk\_df.shape}')  
print(risk\_df\[\['supporter\_id','churn\_risk\_score','risk\_tier'\]\].head(10))

## **3.2  reintegration-readiness.ipynb**

File: ml-pipelines/reintegration-readiness.ipynb

This notebook has NEVER BEEN EXECUTED (zero output cells). It loads 7 CSV files, engineers complex per-resident features across health, education, counseling, visitations, and interventions, then fits explanatory (Logit) and predictive (RF / GB) models. Beyond the cross-cutting fixes, the following specific issues need attention:

### **Fix A — Precision Focus Must Be Enforced in Model Selection**

The notebook states the optimization goal is precision on the 'ready' class (false positives are more costly than false negatives). However, the model selection code uses roc\_auc as the scoring metric. Change the GridSearchCV scoring to reflect this:

from sklearn.metrics import make\_scorer, precision\_score

\# Score by precision on the positive ('Ready') class  
precision\_ready \= make\_scorer(precision\_score, pos\_label=1, zero\_division=0)

\# Use this as the scoring metric for model selection  
cv\_scores\_precision \= cross\_val\_score(  
    full\_pipeline, X\_train, y\_train,  
    cv=StratifiedKFold(5, shuffle=True, random\_state=42),  
    scoring=precision\_ready  
)  
print(f'CV Precision (Ready class): {cv\_scores\_precision.mean():.3f} ± {cv\_scores\_precision.std():.3f}')

\# Also report AUC-ROC as a secondary metric for context  
cv\_scores\_auc \= cross\_val\_score(  
    full\_pipeline, X\_train, y\_train,  
    cv=StratifiedKFold(5, shuffle=True, random\_state=42),  
    scoring='roc\_auc'  
)  
print(f'CV AUC-ROC (secondary):     {cv\_scores\_auc.mean():.3f} ± {cv\_scores\_auc.std():.3f}')

### **Fix B — Add Readiness Score Generation for All Residents**

The deployment block must generate a readiness score (0–100) for every active resident and export it as a CSV. Add this immediately before the joblib export:

\# Generate readiness scores for all 60 residents (not just test set)  
X\_all \= df\[feature\_cols\].copy()  
all\_proba \= full\_pipeline.predict\_proba(X\_all)\[:, 1\]

readiness\_df \= df\[\['resident\_id'\]\].copy()  
readiness\_df\['readiness\_score\_100'\] \= (all\_proba \* 100).round(1)  
readiness\_df\['readiness\_tier'\] \= pd.cut(  
    all\_proba,  
    bins=\[0, 0.30, 0.50, 0.75, 1.0\],  
    labels=\['Not Ready', 'In Progress', 'Nearly Ready', 'Ready'\]  
)  
readiness\_df.to\_csv('reintegration\_readiness\_scores.csv', index=False)

print(f'Exported readiness scores for {len(readiness\_df)} residents')  
print(readiness\_df\['readiness\_tier'\].value\_counts())  
print(readiness\_df.sort\_values('readiness\_score\_100', ascending=False).head(10))

### **Fix C — Small-N Warning Must Be Printed, Not Just Stated**

After the classification report, add a printed warning that appears in the output cell so graders see it immediately without reading markdown:

print()  
print('═' \* 60\)  
print('IMPORTANT — SAMPLE SIZE ADVISORY')  
print(f'  Total residents: {len(df)}')  
print(f'  Positive class (Completed reintegration): {y.sum()}')  
print(f'  Test set size: {len(y\_test)} rows')  
print('  With this small N, individual predictions are directional,')  
print('  not definitive. Use as a supplement to clinical judgment.')  
print('═' \* 60\)

## **3.3  intervention-effectiveness.ipynb**

File: ml-pipelines/intervention-effectiveness.ipynb

This is the most methodologically sophisticated notebook. It builds a resident-month panel, fits OLS with resident fixed effects (the correct causal approach for this data), and compares regression models on a composite outcome. The specific fixes needed are:

### **Fix A — Print OLS Coefficient Table with Business Interpretation**

The OLS model runs for three outcomes (delta\_health\_score, delta\_edu\_progress, delta\_pct\_positive\_end). The notebook visualizes these as a heatmap, which is good, but the raw summary2() output should also be printed so graders can read the coefficients, p-values, and confidence intervals inline. Ensure this code is present after each OLS fit:

for outcome in \['delta\_health\_score', 'delta\_edu\_progress', 'delta\_pct\_positive\_end'\]:  
    y\_panel \= panel\_df\[outcome\].dropna()  
    X\_panel \= panel\_df.loc\[y\_panel.index, explanatory\_cols\]  
    X\_panel\_const \= sm.add\_constant(X\_panel)

    ols \= sm.OLS(y\_panel, X\_panel\_const).fit(cov\_type='HC1')

    print(f'\\n{'='\*60}')  
    print(f'OLS Outcome: {outcome}')  
    print(f'  R-squared:     {ols.rsquared:.4f}')  
    print(f'  Adj R-squared: {ols.rsquared\_adj:.4f}')  
    print(f'  F-stat p-val:  {ols.f\_pvalue:.4f}')  
    print()  
    sig \= ols.pvalues\[ols.pvalues \< 0.10\].index.tolist()  
    print(f'  Significant features (p \< 0.10): {sig}')  
    coef\_df \= pd.DataFrame({  
        'coef': ols.params,  
        'p\_val': ols.pvalues,  
        'sig': ols.pvalues \< 0.10  
    }).drop('const', errors='ignore').sort\_values('coef', ascending=False)  
    print(coef\_df.round(4).to\_string())

### **Fix B — Export Effectiveness Matrix as CSV for API Use**

The backend API endpoint /api/ml/intervention-effectiveness currently returns completion rates computed from the database. It must instead return the OLS coefficient matrix. Export this at the end of the notebook:

\# Collect OLS coefficients for all three outcomes into a single matrix  
effectiveness\_rows \= \[\]  
intervention\_feature\_names \= \['has\_safety', 'has\_psychosocial', 'has\_education',  
                               'has\_physical\_health', 'has\_legal', 'has\_reintegration'\]

for outcome, ols\_model in ols\_models.items():   \# store models in a dict during fitting  
    for feat in intervention\_feature\_names:  
        if feat in ols\_model.params.index:  
            effectiveness\_rows.append({  
                'outcome': outcome,  
                'intervention': feat.replace('has\_', '').replace('\_', ' ').title(),  
                'coefficient': round(ols\_model.params\[feat\], 4),  
                'p\_value':     round(ols\_model.pvalues\[feat\], 4),  
                'significant': ols\_model.pvalues\[feat\] \< 0.10,  
            })

effectiveness\_matrix \= pd.DataFrame(effectiveness\_rows)  
effectiveness\_matrix.to\_csv('intervention\_effectiveness\_matrix.csv', index=False)  
print('Saved: intervention\_effectiveness\_matrix.csv')  
print(effectiveness\_matrix)

## **3.4  social-media-optimizer.ipynb**

File: ml-pipelines/social-media-optimizer.ipynb

This notebook models two separate targets (engagement\_rate and donation\_referrals) with both OLS (explanatory) and Gradient Boosting (predictive). It is the most data-rich notebook (\~812 posts). The specific fixes needed are:

### **Fix A — Separate OLS Models Must Be Fit for Engagement AND Donations**

The notebook's most important business insight is that engagement and donations are driven by different features. The OLS section must explicitly report both models side by side and highlight which features appear significant for donations but NOT for engagement (these are the hidden donor drivers). Ensure this comparison cell exists:

print('Engagement OLS — Significant features (p \< 0.10):')  
sig\_engage \= ols\_engage.pvalues\[ols\_engage.pvalues \< 0.10\].index.tolist()  
print(sig\_engage)

print('\\nDonation OLS — Significant features (p \< 0.10):')  
sig\_donate \= ols\_donate.pvalues\[ols\_donate.pvalues \< 0.10\].index.tolist()  
print(sig\_donate)

donate\_only \= set(sig\_donate) \- set(sig\_engage) \- {'const'}  
print(f'\\n★ Features that drive DONATIONS but not engagement (hidden donor drivers):')  
print(donate\_only)  
print('These should be prioritized in content strategy over engagement-optimizing tactics.')

### **Fix B — Export Actionable Recommendations as CSV**

The deployment section must export a CSV with concrete posting recommendations derived from the predictive model. This CSV feeds the backend API.

\# Find optimal posting parameters by brute-force scoring with the trained model  
platforms  \= posts\['platform'\].unique()  
post\_types \= posts\['post\_type'\].unique()  
hours      \= list(range(6, 23))  
days       \= \['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'\]

best\_donations \= 0  
best\_config    \= {}

for platform in platforms:  
    for ptype in post\_types:  
        for hour in \[8, 10, 12, 17, 19, 20\]:  
            for day in days:  
                sample \= {  
                    'platform': platform, 'post\_type': ptype, 'post\_hour': hour,  
                    'day\_of\_week': day, 'features\_resident\_story': 1,  
                    'has\_call\_to\_action': 1, 'is\_boosted': 0,  
                    'caption\_length': 200, 'num\_hashtags': 5,  
                    'mentions\_count': 0, 'boost\_budget\_php': 0,  
                    'follower\_count\_at\_post': posts\['follower\_count\_at\_post'\].median(),  
                    'media\_type': 'Photo', 'content\_topic': 'DonorImpact',  
                    'sentiment\_tone': 'Hopeful',  
                    'hour\_sin': np.sin(2\*np.pi\*hour/24),  
                    'hour\_cos': np.cos(2\*np.pi\*hour/24),  
                    'is\_weekend': int(day in \['Saturday','Sunday'\]),  
                }  
                df\_sample \= pd.DataFrame(\[sample\])  
                predicted\_donations \= donate\_pipeline.predict(df\_sample)\[0\]  
                if predicted\_donations \> best\_donations:  
                    best\_donations \= predicted\_donations  
                    best\_config \= sample.copy()  
                    best\_config\['predicted\_donations'\] \= round(predicted\_donations, 2\)

recommendations \= pd.DataFrame(\[best\_config\])  
recommendations.to\_csv('social\_media\_recommendations.csv', index=False)  
print('Saved: social\_media\_recommendations.csv')  
print('Best predicted donation referrals:', round(best\_donations, 2))  
print(pd.Series(best\_config))

# **4\. Wiring Notebook Outputs to the Backend API**

After the notebooks are run and their output CSVs are saved, the backend must serve those real predictions instead of its current heuristics. The cleanest approach for this .NET / Supabase architecture is to pre-load the prediction CSVs into the database at startup and have MLService.cs query those tables. This avoids needing a Python runtime in production.

## **4.1  New ML Prediction CSV Files**

After running all four notebooks, the following CSVs must exist in ml-pipelines/:

* donor\_churn\_predictions.csv — columns: supporter\_id, churn\_risk\_score, risk\_tier  
* reintegration\_readiness\_scores.csv — columns: resident\_id, readiness\_score\_100, readiness\_tier  
* intervention\_effectiveness\_matrix.csv — columns: outcome, intervention, coefficient, p\_value, significant  
* social\_media\_recommendations.csv — columns: platform, post\_type, post\_hour, day\_of\_week, features\_resident\_story, has\_call\_to\_action, predicted\_donations, ...

## **4.2  Add ML Prediction Tables to PharosDbContext.cs**

File: backend/Data/PharosDbContext.cs — Add the following DbSet properties and corresponding model classes:

// In PharosDbContext.cs, add inside the class:  
public DbSet\<DonorChurnScore\>             DonorChurnScores             { get; set; }  
public DbSet\<ResidentReadinessScore\>      ResidentReadinessScores      { get; set; }  
public DbSet\<InterventionEffectivenessRow\> InterventionEffectiveness   { get; set; }  
public DbSet\<SocialMediaRecommendation\>   SocialMediaRecommendations   { get; set; }  
// New model files in backend/Models/:

// DonorChurnScore.cs  
public class DonorChurnScore {  
    public int    Id             { get; set; }  
    public int    SupporterId    { get; set; }  
    public double ChurnRiskScore { get; set; }  
    public string RiskTier       { get; set; } \= string.Empty;  
    public DateTime ComputedAt   { get; set; }  
}

// ResidentReadinessScore.cs  
public class ResidentReadinessScore {  
    public int      Id               { get; set; }  
    public int      ResidentId       { get; set; }  
    public double   ReadinessScore   { get; set; }  // 0–100  
    public string   ReadinessTier    { get; set; } \= string.Empty;  
    public DateTime ComputedAt       { get; set; }  
}

// InterventionEffectivenessRow.cs  
public class InterventionEffectivenessRow {  
    public int     Id           { get; set; }  
    public string  Outcome      { get; set; } \= string.Empty;  
    public string  Intervention { get; set; } \= string.Empty;  
    public double  Coefficient  { get; set; }  
    public double  PValue       { get; set; }  
    public bool    Significant  { get; set; }  
}

// SocialMediaRecommendation.cs  
public class SocialMediaRecommendation {  
    public int     Id                   { get; set; }  
    public string  Platform             { get; set; } \= string.Empty;  
    public string  PostType             { get; set; } \= string.Empty;  
    public int     RecommendedHour      { get; set; }  
    public string  RecommendedDay       { get; set; } \= string.Empty;  
    public bool    IncludeResidentStory  { get; set; }  
    public bool    IncludeCallToAction   { get; set; }  
    public double  PredictedDonations   { get; set; }  
    public DateTime ComputedAt          { get; set; }  
}

## **4.3  Seed ML Predictions in DataSeeder.cs**

File: backend/Data/DataSeeder.cs — Add a new method SeedMLPredictionsAsync() that reads the four prediction CSVs from the ml-pipelines/ directory and inserts the rows into the database. Call this method from the existing SeedAsync() entry point after the main data tables are seeded.

public static async Task SeedMLPredictionsAsync(PharosDbContext context, string mlDir) {  
    // Only seed if tables are empty  
    if (await context.DonorChurnScores.AnyAsync()) return;

    var churnPath \= Path.Combine(mlDir, 'donor\_churn\_predictions.csv');  
    if (File.Exists(churnPath)) {  
        var rows \= File.ReadAllLines(churnPath).Skip(1)  // skip header  
            .Select(line \=\> {  
                var cols \= line.Split(',');  
                return new DonorChurnScore {  
                    SupporterId    \= int.Parse(cols\[0\].Trim()),  
                    ChurnRiskScore \= double.Parse(cols\[1\].Trim()),  
                    RiskTier       \= cols\[2\].Trim().Trim('"'),  
                    ComputedAt     \= DateTime.UtcNow  
                };  
            }).ToList();  
        await context.DonorChurnScores.AddRangeAsync(rows);  
        await context.SaveChangesAsync();  
        Console.WriteLine($'Seeded {rows.Count} donor churn scores.');  
    }

    // Repeat for reintegration\_readiness\_scores.csv,  
    // intervention\_effectiveness\_matrix.csv,  
    // social\_media\_recommendations.csv  
    // (follow the same pattern for each)  
}  
Then update Program.cs to pass the ml-pipelines path to this seeder. The ml-pipelines/ directory must be included in the backend publish output — add to backend.csproj:

\<ItemGroup\>  
  \<None Include='../ml-pipelines/\*.csv' CopyToOutputDirectory='PreserveNewest'  
        LinkBase='ml-pipelines' /\>  
\</ItemGroup\>

## **4.4  Update MLService.cs to Query DB Tables Instead of Heuristics**

File: backend/Services/MLService.cs — Replace every method body with a simple database query against the new tables. The heuristic computation blocks must be completely replaced. Here is the pattern for each method:

// GetDonorChurnRisksAsync — replace entire method body:  
public async Task\<IEnumerable\<DonorChurnRiskDto\>\> GetDonorChurnRisksAsync() {  
    var scores \= await \_db.DonorChurnScores  
        .Join(\_db.Supporters,  
              s \=\> s.SupporterId,  
              sup \=\> sup.SupporterId,  
              (s, sup) \=\> new DonorChurnRiskDto(  
                  s.SupporterId,  
                  sup.DisplayName,  
                  sup.SupporterType,  
                  s.ChurnRiskScore,  
                  s.RiskTier,  
                  0, 0m, 0,        // DaysSinceLast/TotalDonated/Count not needed from ML output  
                  new List\<string\>() // Risk factors come from OLS notebook narrative, not heuristics  
              ))  
        .OrderByDescending(d \=\> d.ChurnRiskScore)  
        .ToListAsync();  
    return scores;  
}

// GetReintegrationReadinessAsync — replace entire method body:  
public async Task\<ReintegrationReadinessDto?\> GetReintegrationReadinessAsync(int residentId) {  
    var score \= await \_db.ResidentReadinessScores  
        .FirstOrDefaultAsync(r \=\> r.ResidentId \== residentId);  
    if (score \== null) return null;

    var resident \= await \_db.Residents.FindAsync(residentId);  
    if (resident \== null) return null;

    return new ReintegrationReadinessDto(  
        resident.ResidentId,  
        resident.InternalCode,  
        score.ReadinessScore / 100.0,  
        score.ReadinessTier,  
        new List\<ReadinessFactorDto\>(),  // factors shown on detail page come from notebook analysis  
        new List\<string\>()               // recommendations derived from notebook findings  
    );  
}

// GetSocialMediaRecommendationsAsync — replace entire method body:  
public async Task\<SocialMediaRecommendationDto\> GetSocialMediaRecommendationsAsync() {  
    var rec \= await \_db.SocialMediaRecommendations  
        .OrderByDescending(r \=\> r.ComputedAt)  
        .FirstOrDefaultAsync();

    if (rec \== null)  
        return new SocialMediaRecommendationDto('Facebook','ImpactStory','DonorImpact',  
            10,'Tuesday',null,false, new List\<PostInsightDto\>());

    return new SocialMediaRecommendationDto(  
        rec.Platform, rec.PostType, 'DonorImpact',  
        rec.RecommendedHour, rec.RecommendedDay, 'Photo',  
        true,  
        new List\<PostInsightDto\> {  
            new('ResidentStory', rec.IncludeResidentStory  
                ? 'Include a resident story — highest-impact content for donations'  
                : 'Resident stories are not the top driver for this platform', 0.85),  
            new('Timing', $'Post at {rec.RecommendedHour}:00 on {rec.RecommendedDay}s', 0.82),  
            new('Platform', $'{rec.Platform} maximizes donation referrals', 0.80),  
            new('PredictedDonations',  
                $'Expected donation referrals per post: {rec.PredictedDonations:F1}', 0.75)  
        }  
    );  
}

// GetInterventionEffectivenessAsync — replace entire method body:  
public async Task\<InterventionEffectivenessDto\> GetInterventionEffectivenessAsync() {  
    var rows \= await \_db.InterventionEffectiveness.ToListAsync();

    var insights \= rows.Where(r \=\> r.Significant).Select(r \=\>  
        new InterventionInsightDto(  
            r.Intervention,  
            r.Coefficient,  
            rows.Count(x \=\> x.Intervention \== r.Intervention),  
            $'{r.Intervention} interventions show a statistically significant coefficient  
 of {r.Coefficient:+0.000;-0.000} on {r.Outcome.Replace("delta\_","").Replace("\_"," ")}  
 (p={r.PValue:0.000})'  
        )).ToList();

    var byCategory \= rows.GroupBy(r \=\> r.Intervention).Select(g \=\>  
        new CategoryEffectivenessDto(  
            g.Key,  
            g.Average(r \=\> r.Coefficient) \* 100,  
            g.Count(),  
            g.OrderByDescending(r \=\> Math.Abs(r.Coefficient)).First().Outcome  
        )).ToList();

    return new InterventionEffectivenessDto(insights, byCategory);  
}

# **5\. Frontend: Replace Mock Data With Real API Calls**

⚠  Do NOT change any component layout, styling, chart type, color, or animation. Only change the data source — swap mock data imports for API fetch calls.

Three frontend pages currently display hardcoded mock data from src/lib/mock-data.ts instead of fetching from the backend. Each fix follows the same pattern: add a useEffect that calls the relevant API endpoint, feed the response into existing state, and display a skeleton/spinner while loading.

## **5.1  AdminDashboard.tsx**

File: frontend/src/pages/admin/AdminDashboard.tsx

The Risk Alerts section currently shows hardcoded resident risk objects. Replace with a call to /api/ml/reintegration-readiness for each active resident, or better, add a single endpoint GET /api/ml/reintegration-readiness/all that returns all scores at once. The dashboard should show the top 5 residents by lowest readiness score (most in need of attention):

// Add to AdminDashboard.tsx  
const \[readinessAlerts, setReadinessAlerts\] \= useState\<ReintegrationReadinessDto\[\]\>(\[\]);

useEffect(() \=\> {  
  api.get\<ReintegrationReadinessDto\[\]\>('/ml/reintegration-readiness/all')  
    .then(data \=\> {  
      // Show 5 residents with lowest readiness score (most at-risk)  
      setReadinessAlerts(data.sort((a,b) \=\> a.readinessScore \- b.readinessScore).slice(0, 5));  
    })  
    .catch(() \=\> {}); // Silently fail — dashboard degrades gracefully  
}, \[\]);  
The Donations trend section should fetch from the real reports endpoint:

useEffect(() \=\> {  
  api.get('/reports/donation-trends').then(setDonationTrends).catch(() \=\> {});  
}, \[\]);

## **5.2  ImpactDashboard.tsx (Public Page)**

File: frontend/src/pages/public/ImpactDashboard.tsx

This page imports from mock-data.ts for impact snapshots. Replace with a call to the public endpoint GET /api/public/impact-snapshots, which is already implemented and returns real data from the public\_impact\_snapshots table:

// Replace: import { mockImpactSnapshots } from '@/lib/mock-data'  
// With a useEffect fetch:

const \[snapshots, setSnapshots\] \= useState\<PublicImpactSnapshot\[\]\>(\[\]);  
const \[loading, setLoading\]     \= useState(true);

useEffect(() \=\> {  
  fetch(\`${import.meta.env.VITE\_API\_URL}/public/impact-snapshots\`)  
    .then(r \=\> r.json())  
    .then(data \=\> { setSnapshots(data); setLoading(false); })  
    .catch(() \=\> setLoading(false));  
}, \[\]);

// The key stats (residents served, safehouses, etc.) should come from:  
// GET /api/public/impact-snapshots — returns aggregated monthly metrics  
// Feed the most recent snapshot into the hero stat cards.

## **5.3  ReportsPage.tsx — ML Insights Tab**

File: frontend/src/pages/admin/ReportsPage.tsx

The Reports page has a Social Media tab. Replace any mock social media data with a call to the ML endpoint:

useEffect(() \=\> {  
  if (activeTab \=== 'social') {  
    api.get\<SocialMediaRecommendationDto\>('/ml/social-media-recommendations')  
      .then(setSocialRec)  
      .catch(() \=\> {});  
  }  
}, \[activeTab\]);

// For the intervention effectiveness section in the Resident Outcomes tab:  
useEffect(() \=\> {  
  api.get\<InterventionEffectivenessDto\>('/ml/intervention-effectiveness')  
    .then(setInterventionData)  
    .catch(() \=\> {});  
}, \[\]);

## **5.4  Add a New Backend Endpoint — GET /api/ml/reintegration-readiness/all**

File: backend/Controllers/MLController.cs — The current endpoint only fetches one resident at a time. Add a bulk endpoint that the dashboard can call once:

\[HttpGet('reintegration-readiness/all')\]  
public async Task\<ActionResult\<IEnumerable\<ReintegrationReadinessDto\>\>\> GetAllReintegrationReadiness()  
{  
    var scores \= await \_db.ResidentReadinessScores  
        .Join(\_db.Residents,  
              s \=\> s.ResidentId,  
              r \=\> r.ResidentId,  
              (s, r) \=\> new ReintegrationReadinessDto(  
                  r.ResidentId, r.InternalCode,  
                  s.ReadinessScore / 100.0, s.ReadinessTier,  
                  new List\<ReadinessFactorDto\>(),  
                  new List\<string\>()))  
        .ToListAsync();  
    return Ok(scores);  
}

# **6\. Do Not Change**

📌  The following must remain exactly as they are. Any changes to these areas are out of scope and should be declined.

* Any component JSX/TSX layout — card grids, table columns, chart containers, sidebar structure  
* Any Tailwind CSS class, color variable, or animation parameter  
* The shadcn/ui component usage — do not swap or reconfigure UI components  
* The AuthController.cs, cookie configuration, password policy, CSP headers, RBAC setup, or any security middleware — these are already correct  
* The DataSeeder.cs seeding logic for the 17 operational tables — only the new SeedMLPredictionsAsync() method is being added, not any modification to existing seeders  
* The database schema for operational tables — only new ML score tables are being added  
* The existing .ipynb notebook structure, section headings, or narrative prose — only add new code cells and fix specific existing cells as described  
* The vercel.json, vite.config.ts, or any deployment configuration  
* The frontend routing in App.tsx — no new pages or route changes

# **7\. Verification Checklist**

Before considering this work complete, verify each item below. Every item marked ✗ represents a rubric deduction.

## **7.x  Notebooks**

* ☐  All four notebooks run top-to-bottom with zero errors  
* ☐  All four notebooks saved with inline output cells (not empty)  
* ☐  Each notebook prints CV results as 'mean ± std' format  
* ☐  Each notebook prints a baseline comparison (DummyClassifier or DummyRegressor)  
* ☐  Each notebook includes a VIF table before the explanatory model  
* ☐  Each notebook prints a train-vs-test score gap (overfitting analysis)  
* ☐  OHE / scaling uses sklearn Pipeline (not pd.get\_dummies before split)  
* ☐  Each notebook exports its prediction CSV to ml-pipelines/

## **7.x  Backend**

* ☐  Four new model files created (DonorChurnScore, ResidentReadinessScore, etc.)  
* ☐  PharosDbContext has four new DbSet properties  
* ☐  DataSeeder includes SeedMLPredictionsAsync that reads the four CSVs  
* ☐  MLService.cs methods query DB tables — no heuristic computation blocks remain  
* ☐  New GET /api/ml/reintegration-readiness/all endpoint added to MLController  
* ☐  ML CSV files included in backend.csproj publish output  
* ☐  A new EF migration was added and applied for the four new tables

## **7.x  Frontend**

* ☐  AdminDashboard risk alerts section fetches from /api/ml/reintegration-readiness/all  
* ☐  ImpactDashboard fetches from /api/public/impact-snapshots (not mock-data.ts)  
* ☐  ReportsPage social tab fetches from /api/ml/social-media-recommendations  
* ☐  No component layout, styling, or animation was changed

📌  Questions about intent: if any instruction above is ambiguous, err on the side of doing LESS — make the minimal change that satisfies the requirement rather than refactoring adjacent code. The priority order is: (1) Notebooks, (2) Backend seeding and MLService, (3) Frontend data sources.