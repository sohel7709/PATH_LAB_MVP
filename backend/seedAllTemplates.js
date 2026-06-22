/**
 * seedAllTemplates.js
 * Run: node backend/seedAllTemplates.js
 * Adds 60+ pathology templates WITHOUT deleting existing lab data.
 * Safe to run multiple times — skips templates that already exist by templateName.
 */
require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const TestTemplate = require('./src/models/TestTemplate');

mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 5 })
  .then(() => { console.log('Connected to MongoDB'); seed(); })
  .catch(err => { console.error('Connection error:', err); process.exit(1); });

// ─── Helpers ────────────────────────────────────────────────────────────────
const t = (name, short, category, sampleType, params) => ({
  templateName: name, shortName: short, category, sampleType,
  sections: [{ sectionTitle: '', parameters: params, displayFormat: 'table' }],
  isDefault: true, templateType: 'global', lab: null,
});
const p  = (name, unit='', ref='', isHeader=false, isSub=false, inputType='text', options=[]) =>
  ({ name, unit, referenceRange: ref, isHeader, isSubparameter: isSub, notes: '', inputType, options: options||[] });
const calc = (name, unit, ref, formula) =>
  ({ name, unit, referenceRange: ref, isHeader: false, isSubparameter: false, notes: formula, inputType: 'calculated', options: [] });
const hdr  = name => p(name,'','',true,false,'text',[]);
const sel  = (name, unit, ref, opts) => p(name, unit, ref, false, false, 'select', opts);
const sub  = (name, unit, ref, inputType='text', opts=[]) => p(name, unit, ref, false, true, inputType, opts);
const selSub = (name, unit, ref, opts) => p(name, unit, ref, false, true, 'select', opts);

// ─── Templates ───────────────────────────────────────────────────────────────
const NEW_TEMPLATES = [

  // ══════════════════════ HEMATOLOGY ══════════════════════════════════════
  t('Erythrocyte Sedimentation Rate','ESR','Hematology','Blood',[
    p('ESR (Westergren Method)','mm/hr','Male: 0-15 | Female: 0-20'),
  ]),

  t('Peripheral Blood Smear','PBS','Hematology','Blood',[
    hdr('RED BLOOD CELLS'),
    sub('Morphology','','','text'),
    sub('Size','','','select',['Normocytic','Microcytic','Macrocytic','Anisocytic']),
    sub('Colour','','','select',['Normochromic','Hypochromic','Polychromasia']),
    hdr('WHITE BLOOD CELLS'),
    sub('WBC Count','','','select',['Normal in number','Increased','Decreased']),
    sub('Differential Count','','Normal differential','text'),
    hdr('PLATELETS'),
    sub('Platelets','','','select',['Adequate','Increased','Decreased','Giant platelets seen']),
    p('Parasites','','Not seen',false,false,'select',['Not seen','Malarial parasite seen','Microfilaria seen']),
    p('Impression','','',false,false,'text'),
  ]),

  t('Reticulocyte Count','Retic','Hematology','Blood',[
    p('Reticulocyte Count','%','0.5 - 2.5'),
    calc('Absolute Reticulocyte Count','cells/µL','25,000 - 100,000','RBC × Reticulocyte% / 100'),
  ]),

  t('Absolute Eosinophil Count','AEC','Hematology','Blood',[
    p('Absolute Eosinophil Count (AEC)','cells/µL','40 - 440'),
    sel('Interpretation','','Normal',['Normal (40-440)','Mild Eosinophilia (441-1500)','Moderate (1501-5000)','Severe Eosinophilia (>5000)']),
  ]),

  t('HbA1c (Glycated Haemoglobin)','HbA1c','Biochemistry','Blood',[
    p('HbA1c','%','Normal: <5.7 | Pre-Diabetes: 5.7-6.4 | Diabetes: ≥6.5'),
    calc('Estimated Average Glucose (eAG)','mg/dL','','(HbA1c × 28.7) - 46.7'),
    sel('Interpretation','','',['Normal (<5.7%)','Pre-Diabetes (5.7-6.4%)','Diabetes (≥6.5%)','Well Controlled DM (<7%)','Poorly Controlled DM (>7%)']),
  ]),

  t('G6PD Screening Test','G6PD','Hematology','Blood',[
    sel('G6PD Screening (Fluorescent Spot)','','Normal (Fluorescent)',['Normal (Fluorescent)','Deficient (Non-Fluorescent)','Intermediate']),
    p('G6PD Enzyme Activity','U/gHb','Male: 5.5-20.5 | Female: 4.6-13.5'),
  ]),

  t('Sickling Test','Sickling','Hematology','Blood',[
    sel('Sickling Test (Sodium Metabisulphite)','','Negative',['Positive','Negative']),
    p('Remarks','','',false,false,'text'),
  ]),

  t('Haemoglobin Electrophoresis','Hb Electrophoresis','Hematology','Blood',[
    p('HbA','%','95 - 98'),
    p('HbA2','%','2.0 - 3.5'),
    p('HbF (Foetal Haemoglobin)','%','< 1'),
    p('HbS','%','Absent'),
    p('HbC','%','Absent'),
    p('Total Haemoglobin','g/dL','Male: 13.5-18.0 | Female: 11.5-16.4'),
    p('Interpretation','','',false,false,'text'),
  ]),

  t('Malarial Parasite Smear (Thick & Thin)','MP Smear','Hematology','Blood',[
    sel('Thick Film','','Negative',['Negative','P. falciparum - Ring forms','P. vivax','P. malariae','P. ovale','Mixed infection']),
    sel('Thin Film','','Negative',['Negative','P. falciparum - Ring forms','P. vivax','P. malariae','P. ovale']),
    sel('Parasite Density','','Negative',['+1 (1-10/100 WBCs)','+2 (11-100/100 WBCs)','+3 (1-10/WBC)','+4 (>10/WBC)','Negative']),
    p('Stage Identified','','',false,false,'text'),
  ]),

  // ══════════════════════ COAGULATION ═════════════════════════════════════
  t('Prothrombin Time (PT/INR)','PT/INR','Coagulation','Blood',[
    p('Prothrombin Time (Patient)','seconds','11 - 13'),
    p('Prothrombin Time (Control)','seconds','11 - 13'),
    calc('INR','','Therapeutic: 2.0-3.0','PT Patient / PT Control ^ ISI'),
    p('% Activity','%','70 - 140'),
    sel('Interpretation','','Normal',['Normal','Mildly prolonged (INR 1.5-2.0)','Therapeutic anticoagulation (2.0-3.0)','Supratherapeutic (>3.0)']),
  ]),

  t('APTT (Activated Partial Thromboplastin Time)','APTT','Coagulation','Blood',[
    p('APTT (Patient)','seconds','26 - 40'),
    p('APTT (Control)','seconds','26 - 40'),
    calc('Ratio (Patient/Control)','','< 1.2','APTT Patient / APTT Control'),
    sel('Interpretation','','Normal',['Normal','Prolonged (intrinsic pathway)','Heparin therapy','Factor deficiency']),
  ]),

  t('D-Dimer Test','D-Dimer','Coagulation','Blood',[
    p('D-Dimer','µg/mL FEU','Normal: <0.50'),
    sel('Interpretation','','',['Normal (<0.50 µg/mL FEU)','Elevated (≥0.50) - DVT/PE possible','Markedly elevated - high clot burden']),
  ]),

  t('Fibrinogen Level','Fibrinogen','Coagulation','Blood',[
    p('Fibrinogen (Clauss Method)','mg/dL','200 - 400'),
    sel('Interpretation','','Normal',['Normal (200-400)','Low (<200) - Hypofibrinogenaemia','High (>400) - Acute phase reaction']),
  ]),

  // ══════════════════════ BIOCHEMISTRY ════════════════════════════════════
  t('Fasting Blood Sugar','FBS','Biochemistry','Blood',[
    p('Fasting Blood Glucose','mg/dL','Normal: 70-100 | Pre-Diabetes: 100-125 | Diabetes: ≥126'),
    sel('Interpretation','','Normal',['Normal (70-100)','Impaired Fasting (100-125)','Diabetes (≥126)','Hypoglycaemia (<70)']),
  ]),

  t('Post Prandial Blood Sugar (PPBS)','PPBS','Biochemistry','Blood',[
    p('2-Hour Post Prandial Blood Glucose','mg/dL','Normal: <140 | Pre-Diabetes: 140-199 | Diabetes: ≥200'),
    sel('Interpretation','','Normal',['Normal (<140)','Impaired Glucose Tolerance (140-199)','Diabetes (≥200)']),
  ]),

  t('Fasting & Post Prandial Sugar','FBS+PPBS','Biochemistry','Blood',[
    p('Fasting Blood Glucose','mg/dL','Normal: 70-100 | Pre-Diabetes: 100-125 | Diabetes: ≥126'),
    p('2-Hr Post Prandial Blood Glucose','mg/dL','Normal: <140 | Pre-Diabetes: 140-199 | Diabetes: ≥200'),
    sel('Overall Interpretation','','Normal',['Normal','Impaired Fasting Glucose','Impaired Glucose Tolerance','Diabetes Mellitus']),
  ]),

  t('Thyroid Function Test (TFT)','TFT','Hormones','Serum',[
    p('TSH (Thyroid Stimulating Hormone)','µIU/mL','0.4 - 4.0'),
    p('T3 (Total Triiodothyronine)','ng/dL','80 - 200'),
    p('T4 (Total Thyroxine)','µg/dL','5.0 - 12.0'),
    p('Free T3 (FT3)','pg/mL','2.3 - 4.2'),
    p('Free T4 (FT4)','ng/dL','0.9 - 1.7'),
    sel('Interpretation','','Euthyroid',['Euthyroid (Normal)','Primary Hypothyroidism','Subclinical Hypothyroidism','Hyperthyroidism','Subclinical Hyperthyroidism','Secondary Hypothyroidism']),
  ]),

  t('TSH Only','TSH','Hormones','Serum',[
    p('TSH (Thyroid Stimulating Hormone)','µIU/mL','0.4 - 4.0'),
    sel('Interpretation','','Normal',['Normal (0.4-4.0)','Hypothyroid (>4.0)','Hyperthyroid (<0.4)','Subclinical Hypothyroid (4.0-10.0)']),
  ]),

  t('Iron Studies Panel','Iron Studies','Biochemistry','Serum',[
    p('Serum Iron','µg/dL','Male: 65-175 | Female: 50-170'),
    p('TIBC (Total Iron Binding Capacity)','µg/dL','240 - 450'),
    calc('Transferrin Saturation','%','Male: 20-50 | Female: 15-50','(Serum Iron / TIBC) × 100'),
    p('Serum Ferritin','ng/mL','Male: 12-300 | Female: 10-150'),
    p('UIBC','µg/dL','111 - 343'),
    sel('Interpretation','','Normal',['Normal','Iron Deficiency Anaemia','Anaemia of Chronic Disease','Iron Overload / Haemochromatosis']),
  ]),

  t('Vitamin B12','Vit B12','Biochemistry','Serum',[
    p('Vitamin B12 (Cyanocobalamin)','pg/mL','Deficient: <200 | Borderline: 200-300 | Normal: >300'),
    sel('Interpretation','','Normal',['Deficient (<200 pg/mL)','Borderline (200-300 pg/mL)','Normal (>300 pg/mL)']),
  ]),

  t('Vitamin D (25-OH)','Vit D','Biochemistry','Serum',[
    p('25-OH Vitamin D (Total)','ng/mL','Deficient: <20 | Insufficient: 20-30 | Sufficient: 30-100'),
    sel('Interpretation','','',['Severe Deficiency (<10 ng/mL)','Deficiency (10-20)','Insufficiency (20-30)','Sufficiency (30-100)','Toxicity (>100)']),
  ]),

  t('Serum Folate (Vitamin B9)','Folate','Biochemistry','Serum',[
    p('Serum Folate','ng/mL','Deficient: <3.4 | Borderline: 3.4-5.4 | Normal: >5.4'),
    sel('Interpretation','','Normal',['Deficient (<3.4)','Borderline (3.4-5.4)','Normal (>5.4)']),
  ]),

  t('Serum Magnesium','Mg','Biochemistry','Serum',[
    p('Serum Magnesium','mEq/L','1.7 - 2.5'),
  ]),

  t('Serum Phosphorus','Phosphorus','Biochemistry','Serum',[
    p('Serum Phosphorus (Inorganic)','mg/dL','Adult: 2.5-4.5 | Children: 4.0-7.0'),
  ]),

  t('LDH (Lactate Dehydrogenase)','LDH','Biochemistry','Serum',[
    p('LDH (Lactate Dehydrogenase)','U/L','140 - 280'),
  ]),

  t('Liver Function Test - Full Panel','LFT Full','Biochemistry','Serum',[
    hdr('BILIRUBIN'),
    sub('Total Bilirubin','mg/dL','0.2 - 1.2'),
    sub('Direct Bilirubin','mg/dL','0.0 - 0.3'),
    sub('Indirect Bilirubin','mg/dL','0.1 - 0.8','calculated'),
    hdr('LIVER ENZYMES'),
    sub('SGOT / AST','U/L','Male: 10-40 | Female: 9-32'),
    sub('SGPT / ALT','U/L','Male: 7-56 | Female: 7-40'),
    sub('Alkaline Phosphatase (ALP)','U/L','Adult: 40-150'),
    sub('GGT (Gamma GT)','U/L','Male: 10-71 | Female: 6-42'),
    hdr('PROTEINS'),
    sub('Total Protein','g/dL','6.4 - 8.3'),
    sub('Serum Albumin','g/dL','3.5 - 5.0'),
    sub('Serum Globulin','g/dL','2.3 - 3.5','calculated'),
    sub('A/G Ratio','','1.2 - 2.2','calculated'),
  ]),

  t('SGOT & SGPT','SGOT/SGPT','Biochemistry','Serum',[
    p('SGOT / AST (Aspartate Aminotransferase)','U/L','Male: 10-40 | Female: 9-32'),
    p('SGPT / ALT (Alanine Aminotransferase)','U/L','Male: 7-56 | Female: 7-40'),
    calc('AST/ALT Ratio','','<1 liver disease | >2 alcoholic','AST / ALT'),
  ]),

  t('Alkaline Phosphatase','ALP','Biochemistry','Serum',[
    p('Serum Alkaline Phosphatase (ALP)','U/L','Adult: 40-150 | Children: 60-300'),
  ]),

  t('GGT (Gamma-Glutamyl Transferase)','GGT','Biochemistry','Serum',[
    p('GGT (Gamma-Glutamyl Transferase)','U/L','Male: 10-71 | Female: 6-42'),
  ]),

  t('Total Protein, Albumin & Globulin','Total Protein','Biochemistry','Serum',[
    p('Total Protein','g/dL','6.4 - 8.3'),
    p('Serum Albumin','g/dL','3.5 - 5.0'),
    calc('Serum Globulin','g/dL','2.3 - 3.5','Total Protein - Albumin'),
    calc('A/G Ratio','','1.2 - 2.2','Albumin / Globulin'),
  ]),

  t('Complete Lipid Profile','Lipid Profile Full','Biochemistry','Serum',[
    p('Total Cholesterol','mg/dL','Desirable: <200 | Borderline: 200-239 | High: ≥240'),
    p('Triglycerides','mg/dL','Normal: <150 | Borderline: 150-199 | High: 200-499'),
    p('HDL Cholesterol','mg/dL','Male: >40 | Female: >50 | Optimal: >60'),
    calc('LDL Cholesterol (Friedewald)','mg/dL','Optimal: <100 | Near Optimal: 100-129 | Borderline: 130-159','Total Cholesterol - HDL - (Triglycerides/5)'),
    calc('VLDL Cholesterol','mg/dL','< 30','Triglycerides / 5'),
    calc('Non-HDL Cholesterol','mg/dL','< 130','Total Cholesterol - HDL'),
    calc('TC/HDL Ratio','','Desirable: <4.5','Total Cholesterol / HDL'),
    calc('LDL/HDL Ratio','','Desirable: <3.0','LDL / HDL'),
  ]),

  t('Blood Urea Nitrogen (BUN)','BUN','Biochemistry','Blood',[
    p('Blood Urea Nitrogen (BUN)','mg/dL','7 - 20'),
    p('Serum Creatinine','mg/dL','Male: 0.7-1.2 | Female: 0.5-1.0'),
    calc('BUN/Creatinine Ratio','','10-20 (pre-renal: >20)','BUN / Creatinine'),
  ]),

  t('Renal Function Test (RFT)','RFT','Biochemistry','Serum',[
    p('Serum Creatinine','mg/dL','Male: 0.7-1.2 | Female: 0.5-1.0'),
    p('Blood Urea','mg/dL','13 - 45'),
    calc('BUN (Blood Urea Nitrogen)','mg/dL','7-20','Blood Urea × 0.467'),
    p('Serum Uric Acid','mg/dL','Male: 3.4-7.0 | Female: 2.4-5.7'),
    p('Serum Sodium','mEq/L','136 - 145'),
    p('Serum Potassium','mEq/L','3.5 - 5.0'),
    p('Serum Chloride','mEq/L','98 - 107'),
    calc('eGFR (CKD-EPI)','mL/min/1.73m²','Normal: ≥90','186 × (Creatinine^-1.154) × (Age^-0.203) [×0.742 if Female]'),
  ]),

  t('eGFR','eGFR','Biochemistry','Serum',[
    p('Serum Creatinine','mg/dL','Male: 0.7-1.2 | Female: 0.5-1.0'),
    p('Patient Age','years',''),
    calc('eGFR (CKD-EPI)','mL/min/1.73m²','Normal: ≥90 | Stage 1: 60-89 | Stage 2: 45-59 | Stage 3a: 30-44 | Stage 3b: 15-29','186 × (Creatinine^-1.154) × (Age^-0.203)'),
    sel('CKD Stage','','',['Normal (≥90)','Stage 1 CKD (60-89)','Stage 2 CKD (45-59)','Stage 3a CKD (30-44)','Stage 3b CKD (15-29)','Stage 4 CKD (<15)','ESRD (<15 on dialysis)']),
  ]),

  t('Serum Electrolytes (Na/K/Cl)','Electrolytes','Biochemistry','Serum',[
    p('Serum Sodium (Na⁺)','mEq/L','136 - 145'),
    p('Serum Potassium (K⁺)','mEq/L','3.5 - 5.0'),
    p('Serum Chloride (Cl⁻)','mEq/L','98 - 107'),
    calc('Anion Gap','mEq/L','8-12','Na - (Cl + HCO3)'),
  ]),

  t('PSA (Prostate Specific Antigen)','PSA','Biochemistry','Serum',[
    p('PSA (Total)','ng/mL','Age 40-49: <2.5 | Age 50-59: <3.5 | Age 60-69: <4.5 | Age 70+: <6.5'),
    p('PSA (Free)','ng/mL',''),
    calc('Free/Total PSA Ratio','%','>25% low risk | 10-25% intermediate | <10% high risk','(Free PSA / Total PSA) × 100'),
    sel('Interpretation','','',['Normal (low risk)','Borderline - clinical correlation','Elevated - urology referral advised']),
  ]),

  t('Beta HCG (Quantitative)','Beta HCG','Biochemistry','Serum',[
    p('Beta hCG (Quantitative)','mIU/mL','Non-pregnant: <5 | 4 wks: 5-426 | 5 wks: 18-7340 | 6 wks: 1080-56500'),
    sel('Interpretation','','',['Non-Pregnant (<5 mIU/mL)','Possibly Pregnant (5-25) - Repeat in 48 hrs','Pregnant (>25 mIU/mL)']),
  ]),

  t('AFP (Alpha-Fetoprotein)','AFP','Biochemistry','Serum',[
    p('AFP (Alpha-Fetoprotein)','ng/mL','Adult (non-pregnant): <8.0'),
    sel('Interpretation','','Normal',['Normal (<8.0)','Mildly elevated (8-20)','Moderately elevated (20-400)','Markedly elevated (>400) - HCC/germ cell tumour']),
  ]),

  t('CEA (Carcinoembryonic Antigen)','CEA','Biochemistry','Serum',[
    p('CEA','ng/mL','Non-smoker: <2.5 | Smoker: <5.0'),
    sel('Interpretation','','Normal',['Normal','Mildly elevated (may be benign)','Elevated (>10) - malignancy monitoring']),
  ]),

  t('CA-125 (Ovarian Cancer Marker)','CA-125','Biochemistry','Serum',[
    p('CA-125','U/mL','Pre-menopausal: <46 | Post-menopausal: <35'),
    sel('Interpretation','','Normal',['Normal','Mildly elevated (endometriosis/PID)','Significantly elevated - gynaecological evaluation']),
  ]),

  t('CA 19-9 (Pancreatic Marker)','CA 19-9','Biochemistry','Serum',[
    p('CA 19-9','U/mL','< 37'),
    sel('Interpretation','','Normal',['Normal (<37)','Elevated (>37) - clinical correlation','Markedly elevated (>200) - pancreatic/GI malignancy']),
  ]),

  t('CA 15-3 (Breast Cancer Marker)','CA 15-3','Biochemistry','Serum',[
    p('CA 15-3','U/mL','< 25'),
    sel('Interpretation','','Normal',['Normal (<25)','Mildly elevated (25-100)','Significantly elevated (>100) - further evaluation']),
  ]),

  t('hs-CRP (High Sensitivity CRP)','hs-CRP','Biochemistry','Serum',[
    p('hs-CRP','mg/L','Low CV Risk: <1.0 | Average: 1.0-3.0 | High: >3.0'),
    sel('Cardiovascular Risk','','',['Low Risk (<1.0 mg/L)','Average Risk (1.0-3.0)','High Risk (>3.0)']),
  ]),

  t('Homocysteine','Homocysteine','Biochemistry','Serum',[
    p('Serum Homocysteine','µmol/L','Normal: 5-15 | Mild: 15-30 | Moderate: 30-100 | Severe: >100'),
    sel('Interpretation','','Normal',['Normal (5-15)','Mild Hyperhomocysteinaemia (15-30)','Moderate (30-100)','Severe (>100)']),
  ]),

  t('Lipoprotein(a)','Lp(a)','Biochemistry','Serum',[
    p('Lipoprotein (a) [Lp(a)]','mg/dL','Desirable: <30 | Borderline: 30-50 | High Risk: >50'),
  ]),

  t('Procalcitonin (PCT)','PCT','Biochemistry','Serum',[
    p('Procalcitonin (PCT)','ng/mL','Normal: <0.05 | Possible Sepsis: 0.05-0.5 | Likely Sepsis: 0.5-2.0 | Severe: >2.0'),
    sel('Interpretation','','Normal',['Normal (<0.05)','Low sepsis risk (0.05-0.5)','Moderate sepsis (0.5-2.0)','Severe sepsis/shock (>2.0)']),
  ]),

  t('NT-proBNP (Heart Failure)','NT-proBNP','Biochemistry','Serum',[
    p('NT-proBNP','pg/mL','Age <50: <450 | Age 50-75: <900 | Age >75: <1800 | Rule out HF: <300'),
    sel('Interpretation','','',['HF Excluded (<300)','Low probability','Moderate probability - Echo advised','High probability - specialist referral']),
  ]),

  t('Fasting Insulin & HOMA-IR','Insulin/HOMA','Biochemistry','Serum',[
    p('Fasting Serum Insulin','µIU/mL','2.6 - 24.9'),
    p('Fasting Blood Glucose','mg/dL','70 - 100'),
    calc('HOMA-IR','','Normal: <2.0 | Insulin Resistant: >2.0','(Fasting Insulin × Fasting Glucose) / 405'),
    sel('Interpretation','','Normal',['Normal (<2.0)','Borderline Insulin Resistance (2.0-2.5)','Insulin Resistance (>2.5)','Severe Insulin Resistance (>5.0)']),
  ]),

  // ══════════════════════ HORMONES ════════════════════════════════════════
  t('Female Hormone Panel','Female Hormones','Hormones','Serum',[
    p('FSH (Follicle Stimulating Hormone)','mIU/mL','Follicular: 3.5-12.5 | Ovulatory: 4.7-21.5 | Luteal: 1.7-7.7 | Post-Menopausal: 25-135'),
    p('LH (Luteinising Hormone)','mIU/mL','Follicular: 2.4-12.6 | Ovulatory: 14.0-95.6 | Luteal: 1.0-11.4 | Post-Menopausal: 7.7-58.5'),
    p('Prolactin','ng/mL','Female: 3.8-23.2 | Male: 3.0-14.7'),
    p('Estradiol (E2)','pg/mL','Follicular: 27-122 | Ovulatory: 95-433 | Luteal: 49-291 | Post-Menopausal: <20'),
    p('Progesterone','ng/mL','Follicular: 0.2-1.5 | Luteal: 1.7-27.0 | Post-Menopausal: <0.5'),
  ]),

  t('Testosterone','Testosterone','Hormones','Serum',[
    p('Total Testosterone','ng/dL','Male: 240-870 | Female: 8-60'),
    p('Free Testosterone','pg/mL','Male: 9-30 | Female: 0.3-1.9'),
    p('SHBG (Sex Hormone Binding Globulin)','nmol/L','Male: 10-57 | Female: 18-144'),
    sel('Interpretation','','Normal',['Normal','Low (Hypogonadism)','High (PCOS/Adrenal cause)','Borderline']),
  ]),

  t('DHEA-S','DHEA-S','Hormones','Serum',[
    p('DHEA-S','µg/dL','Male 20-29: 280-640 | Male 30-39: 120-520 | Female 20-29: 65-380 | Female 30-39: 45-270 | Post-Menopausal: 18-90'),
  ]),

  t('Anti-Mullerian Hormone (AMH)','AMH','Hormones','Serum',[
    p('AMH','ng/mL','Age 20-29: 1.5-9.1 | Age 30-34: 1.2-7.8 | Age 35-39: 0.7-6.8 | Age 40-44: 0.3-3.5 | Age >45: 0.1-1.5'),
    sel('Ovarian Reserve','','',['Optimal (>1.5)','Satisfactory (1.0-1.5)','Low Reserve (0.5-1.0)','Very Low (<0.5)','Undetectable - Poor prognosis']),
  ]),

  t('Cortisol (Morning)','Cortisol','Hormones','Serum',[
    p('Cortisol (8 AM Sample)','µg/dL','Morning: 6-25 | Afternoon: 3-16'),
    sel('Interpretation','','Normal',['Normal','Low (Adrenal insufficiency suspected)','High (Cushing syndrome suspected)']),
  ]),

  t('Parathyroid Hormone (PTH)','PTH','Hormones','Serum',[
    p('Intact PTH (iPTH)','pg/mL','15 - 65'),
    p('Serum Calcium','mg/dL','8.5 - 10.5'),
    p('Serum Phosphorus','mg/dL','2.5 - 4.5'),
    sel('Interpretation','','Normal',['Normal','Primary Hyperparathyroidism (High PTH + High Ca)','Secondary Hyperparathyroidism (High PTH + Low Ca)','Hypoparathyroidism (Low PTH + Low Ca)']),
  ]),

  // ══════════════════════ SEROLOGY ════════════════════════════════════════
  t('Anti-HCV (Hepatitis C Antibody)','Anti-HCV','Serology','Serum',[
    sel('Anti-HCV','','Non-Reactive',['Reactive','Non-Reactive','Borderline - Repeat advised']),
    p('Interpretation','','Reactive result requires confirmatory PCR HCV RNA test'),
  ]),

  t('Hepatitis B Panel','HBV Panel','Serology','Serum',[
    sel('HBsAg (Hepatitis B Surface Antigen)','','Non-Reactive',['Reactive','Non-Reactive']),
    sel('Anti-HBs (Surface Antibody)','','Non-Reactive',['Reactive (Immune)','Non-Reactive']),
    sel('HBeAg (e Antigen)','','Non-Reactive',['Reactive','Non-Reactive']),
    sel('Anti-HBc IgM (Core Ab IgM)','','Non-Reactive',['Reactive','Non-Reactive']),
    sel('Anti-HBc Total (Core Ab Total)','','Non-Reactive',['Reactive','Non-Reactive']),
    p('Interpretation','','',false,false,'text'),
  ]),

  t('HIV 1 & 2 ELISA','HIV ELISA','Serology','Serum',[
    sel('HIV 1 & 2 (ELISA)','','Non-Reactive',['Reactive','Non-Reactive']),
    p('Interpretation','','Reactive results require confirmatory Western Blot test'),
  ]),

  t('ASO Titre','ASO','Serology','Serum',[
    p('ASO Titre','IU/mL','Normal: <200'),
    sel('Interpretation','','Normal',['Normal (<200)','Borderline (200-400)','Elevated (>400) - Streptococcal infection']),
  ]),

  t('TORCH Panel','TORCH','Serology','Serum',[
    hdr('TOXOPLASMA'),
    sub('Toxoplasma IgG','IU/mL','Negative: <3','select',['Negative (<3)','Equivocal (3-8)','Positive (>8)']),
    sub('Toxoplasma IgM','Index','Negative: <0.9','select',['Negative (<0.9)','Equivocal (0.9-1.1)','Positive (>1.1)']),
    hdr('RUBELLA'),
    sub('Rubella IgG','IU/mL','Immune: ≥10','select',['Non-immune (<10)','Equivocal (10-15)','Immune (≥15)']),
    sub('Rubella IgM','Index','Negative: <0.9','select',['Negative (<0.9)','Equivocal (0.9-1.1)','Positive (>1.1)']),
    hdr('CMV (Cytomegalovirus)'),
    sub('CMV IgG','IU/mL','Negative: <0.5','select',['Negative (<0.5)','Positive (≥0.5)']),
    sub('CMV IgM','Index','Negative: <0.9','select',['Negative (<0.9)','Equivocal (0.9-1.1)','Positive (>1.1)']),
    hdr('HERPES SIMPLEX (HSV)'),
    sub('HSV 1/2 IgG','Index','Negative: <0.9','select',['Negative (<0.9)','Equivocal (0.9-1.1)','Positive (>1.1)']),
    sub('HSV 1/2 IgM','Index','Negative: <0.9','select',['Negative (<0.9)','Equivocal (0.9-1.1)','Positive (>1.1)']),
  ]),

  t('H. Pylori Antibody','H. Pylori Ab','Serology','Serum',[
    sel('H. Pylori IgG','','Negative',['Positive','Negative']),
    p('Titre','U/mL','Negative: <12 | Equivocal: 12-24 | Positive: >24'),
  ]),

  t('Leptospira Antibody','Leptospira','Serology','Serum',[
    sel('Leptospira IgM','','Non-Reactive',['Reactive','Non-Reactive']),
    sel('Leptospira IgG','','Non-Reactive',['Reactive','Non-Reactive']),
    p('MAT Titre (if done)','','Significant: ≥1:200'),
  ]),

  t('Brucella Antibody','Brucella','Serology','Serum',[
    sel('Brucella IgG','','Negative',['Positive','Negative']),
    sel('Brucella IgM','','Negative',['Positive','Negative']),
    p('SAT Titre','','Significant: ≥1:160'),
  ]),

  t('Chikungunya IgM/IgG','Chikungunya','Serology','Serum',[
    sel('Chikungunya IgM','','Non-Reactive',['Reactive','Non-Reactive']),
    sel('Chikungunya IgG','','Non-Reactive',['Reactive','Non-Reactive']),
    sel('Interpretation','','',['Acute Chikungunya (IgM+/IgG-)','Past/Secondary Infection (IgG+)','No Evidence of Chikungunya']),
  ]),

  t('Scrub Typhus IgM','Scrub Typhus','Serology','Serum',[
    sel('Scrub Typhus IgM (Orientia tsutsugamushi)','','Non-Reactive',['Reactive','Non-Reactive']),
    p('Titre','','Significant: ≥1:80'),
  ]),

  t('Covid-19 Antibody (IgM/IgG)','COVID-19 Ab','Serology','Serum',[
    sel('SARS-CoV-2 IgM','','Non-Reactive',['Reactive','Non-Reactive']),
    p('SARS-CoV-2 IgG (Anti-Spike)','AU/mL','Reactive: ≥50 AU/mL'),
    sel('Interpretation','','',['Acute Infection (IgM+/IgG-)','Past Infection (IgM-/IgG+)','Immune post-vaccination (IgG+)','No Evidence of Infection']),
  ]),

  // ══════════════════════ IMMUNOLOGY ══════════════════════════════════════
  t('ANA (Antinuclear Antibody)','ANA','Immunology','Serum',[
    sel('ANA (ELISA/IFA)','','Negative',['Positive','Negative']),
    p('ANA Titre','','Significant: ≥1:80'),
    sel('Staining Pattern','','',['Homogeneous','Speckled','Nucleolar','Centromere','Cytoplasmic','Not Applicable']),
    p('Interpretation','','',false,false,'text'),
  ]),

  t('Anti-dsDNA Antibody','Anti-dsDNA','Immunology','Serum',[
    p('Anti-dsDNA Level','IU/mL','Negative: <10 | Borderline: 10-15 | Positive: >15'),
    sel('Interpretation','','Negative',['Negative','Borderline - repeat in 3 months','Positive - SLE activity monitoring']),
  ]),

  t('Anti-CCP (Cyclic Citrullinated Peptide)','Anti-CCP','Immunology','Serum',[
    p('Anti-CCP IgG','U/mL','Negative: <7 | Weak Positive: 7-10 | Positive: >10'),
    sel('Interpretation','','Negative',['Negative (<7)','Weak Positive (7-10)','Positive (>10) - RA correlation']),
  ]),

  t('Complement C3 & C4','C3/C4','Immunology','Serum',[
    p('Complement C3','mg/dL','90 - 180'),
    p('Complement C4','mg/dL','16 - 47'),
    sel('Interpretation','','Normal',['Normal','Low C3 (SLE nephritis, post-strept GN)','Low C3 & C4 (SLE)','Low C4 only (Hereditary angioedema)']),
  ]),

  t('Immunoglobulin Profile (IgG/IgA/IgM/IgE)','Ig Profile','Immunology','Serum',[
    p('IgG','mg/dL','700 - 1600'),
    p('IgA','mg/dL','70 - 400'),
    p('IgM','mg/dL','40 - 230'),
    p('Total IgE','IU/mL','< 100'),
  ]),

  t('Antiphospholipid Antibody Panel','APLA Panel','Immunology','Serum',[
    p('Anticardiolipin IgG','GPL U/mL','Negative: <20'),
    p('Anticardiolipin IgM','MPL U/mL','Negative: <20'),
    p('Anti-β2 Glycoprotein I IgG','U/mL','Negative: <20'),
    p('Anti-β2 Glycoprotein I IgM','U/mL','Negative: <20'),
    sel('Lupus Anticoagulant (LA)','','Not Detected',['Detected','Not Detected']),
    p('Interpretation','','',false,false,'text'),
  ]),

  // ══════════════════════ MICROBIOLOGY ════════════════════════════════════
  t('Blood Culture & Sensitivity','Blood C&S','Microbiology','Blood',[
    sel('Culture Result','','No Growth',['No Growth (after 5 days)','Growth Detected']),
    p('Organism Isolated','','Nil',false,false,'text'),
    p('Colony Count','CFU/mL','',false,false,'text'),
    hdr('ANTIBIOTIC SENSITIVITY'),
    selSub('Ampicillin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Amoxicillin-Clavulanate','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Piperacillin-Tazobactam','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Ceftriaxone','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Ciprofloxacin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Levofloxacin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Gentamicin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Amikacin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Meropenem','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Imipenem','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Vancomycin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Colistin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
  ]),

  t('Urine Culture & Sensitivity','Urine C&S','Microbiology','Urine (Midstream)',[
    sel('Culture Result','','No Significant Growth',['No Growth','No Significant Growth (<10⁴ CFU/mL)','Significant Growth (≥10⁵ CFU/mL)']),
    p('Organism Isolated','','Nil',false,false,'text'),
    p('Colony Count','CFU/mL','Significant: ≥10⁵'),
    hdr('ANTIBIOTIC SENSITIVITY'),
    selSub('Nitrofurantoin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Cotrimoxazole','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Norfloxacin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Ciprofloxacin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Ceftriaxone','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Amoxicillin-Clavulanate','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Amikacin','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
    selSub('Meropenem','','',['Sensitive (S)','Intermediate (I)','Resistant (R)','Not Tested']),
  ]),

  t('AFB Smear (Sputum/TB)','AFB Smear','Microbiology','Sputum',[
    sel('AFB Smear (Ziehl-Neelsen Stain)','','Negative',['Negative (No AFB seen)','Scanty (1-9 per 100 fields)','+1 (10-99 per 100 fields)','+2 (1-10 per field)','+3 (>10 per field)']),
    sel('Sample Quality','','Adequate',['Adequate (mucopurulent)','Inadequate (saliva)','Blood-stained']),
  ]),

  t('Mantoux Test (TST)','Mantoux','Microbiology','Intradermal (Reading)',[
    p('Induration Diameter (at 48-72 hrs)','mm','Negative: <5mm'),
    sel('Interpretation','','Negative',['Negative (<5 mm)','Positive ≥5mm (HIV/immunocompromised)','Positive ≥10mm (High-risk groups)','Positive ≥15mm (Low-risk individuals)']),
    p('Date of Reading','','',false,false,'text'),
  ]),

  // ══════════════════════ PATHOLOGY / SPECIAL ═════════════════════════════
  t('Stool Examination','Stool Exam','Pathology','Stool',[
    hdr('MACROSCOPIC'),
    sub('Colour','','Brown','select',['Brown','Yellow','Green','Black (tarry)','Red (blood-stained)','Pale/Clay-coloured']),
    sub('Consistency','','Formed','select',['Formed','Semi-formed','Loose','Watery','Hard/Pellet-like']),
    sub('Mucus','','Absent','select',['Absent','Present']),
    sub('Blood','','Absent','select',['Absent','Present']),
    hdr('MICROSCOPIC'),
    sub('Pus Cells (WBC)','/HPF','0 - 2'),
    sub('RBCs','/HPF','Nil','select',['Nil','Few','Moderate','Many']),
    sub('Epithelial Cells','','Few','select',['Few','Moderate','Many','Nil']),
    sub('Ova / Cysts / Parasites','','Not seen','select',['Not seen','E. histolytica cysts seen','Giardia cysts seen','Ascaris ova seen','Hookworm ova seen','Trichuris ova seen','Taenia ova seen']),
    sub('Fat Globules','','Nil','select',['Nil','Few','Moderate (steatorrhoea)']),
    p('Remarks','','',false,false,'text'),
  ]),

  t('Stool Occult Blood Test','Stool OBT','Pathology','Stool',[
    sel('Faecal Occult Blood (Guaiac/Immunochemical)','','Negative',['Positive','Negative']),
    p('Interpretation','','Positive result requires colonoscopy evaluation'),
  ]),

  t('Urine Pregnancy Test (Qualitative)','UPT','Pathology','Urine',[
    sel('Urine hCG (Pregnancy Test)','','Negative',['Positive','Negative']),
    p('Interpretation','','Positive indicates hCG presence (pregnancy or hCG-secreting tumour)'),
  ]),

  t('Urine Microalbumin','Urine Microalbumin','Biochemistry','Urine (Spot)',[
    p('Urine Microalbumin','µg/mg Cr','Normal: <30 | Microalbuminuria: 30-300 | Macroalbuminuria: >300'),
    p('Urine Creatinine','mg/dL','20 - 370'),
    calc('Albumin to Creatinine Ratio (ACR)','µg/mg','Normal: <30','Urine Albumin (µg/dL) / Urine Creatinine (mg/dL) × 10'),
    sel('CKD Stage by ACR','','',['Normal/Low Risk (<30)','Moderately Increased (30-300)','Severely Increased (>300)']),
  ]),

  t('24-Hour Urine Protein','24Hr Urine Protein','Biochemistry','Urine (24hr)',[
    p('Total Volume (24 hrs)','mL','1000 - 2000'),
    p('Urine Protein Concentration','mg/dL',''),
    calc('Total 24-Hr Protein Excretion','mg/24hr','Normal: <150 | Nephrotic range: >3500','Protein (mg/dL) × Volume (mL) / 100'),
    sel('Interpretation','','Normal',['Normal (<150 mg/24hr)','Mild proteinuria (150-500)','Moderate (500-3500)','Nephrotic range (>3500)']),
  ]),

  t('Urine Spot Protein & Creatinine Ratio','Urine P:C Ratio','Biochemistry','Urine (Spot)',[
    p('Urine Protein','mg/dL',''),
    p('Urine Creatinine','mg/dL','20 - 370'),
    calc('Protein to Creatinine Ratio (PCR)','mg/g','Normal: <200 | Nephrotic: >3500','(Urine Protein × 1000) / Urine Creatinine'),
    sel('Interpretation','','Normal',['Normal (<200)','Mild (200-500)','Moderate (500-3500)','Nephrotic range (>3500)']),
  ]),

  t('CSF Analysis','CSF','Pathology','CSF',[
    hdr('MACROSCOPIC'),
    sub('Colour','','Colourless','select',['Colourless','Xanthochromic (yellow)','Bloody','Turbid','Purulent']),
    sub('Appearance','','Clear','select',['Clear','Slightly Turbid','Turbid','Purulent','Bloody']),
    sub('Opening Pressure','mmH2O','70 - 180'),
    hdr('BIOCHEMISTRY'),
    sub('CSF Glucose','mg/dL','45-80 (60-70% of blood glucose)'),
    sub('CSF Protein','mg/dL','15 - 45'),
    sub('CSF Chloride','mEq/L','120 - 130'),
    hdr('CELL COUNT'),
    sub('Total Cell Count','cells/µL','0 - 5'),
    sub('Lymphocytes','%','60 - 80'),
    sub('Neutrophils','%','0 - 6'),
    sub('RBCs','cells/µL','0'),
    hdr('MICROBIOLOGY'),
    sub('Gram Stain','','No organisms seen','text'),
    sub('India Ink Preparation','','Negative','select',['Negative','Positive (Cryptococcus)']),
    p('Impression','','',false,false,'text'),
  ]),

  t('Serum Protein Electrophoresis','SPEP','Biochemistry','Serum',[
    p('Total Protein','g/dL','6.4 - 8.3'),
    p('Albumin','%','55.8 - 66.1'),
    p('Alpha-1 Globulin','%','2.9 - 4.9'),
    p('Alpha-2 Globulin','%','7.1 - 11.8'),
    p('Beta Globulin','%','8.4 - 13.1'),
    p('Gamma Globulin','%','11.1 - 18.8'),
    sel('M-Band','','Absent',['Absent','Present (suspect monoclonal gammopathy)']),
    p('Interpretation','','',false,false,'text'),
  ]),

  t('Bone Marrow Aspiration Report','BMA','Hematology','Bone Marrow',[
    p('Site of Aspiration','','',false,false,'text'),
    sel('Cellularity','','Normocellular',['Hypercellular','Normocellular','Hypocellular','Aplastic']),
    p('M:E Ratio','','2:1 to 4:1',false,false,'text'),
    p('Erythropoiesis','','Normoblastic',false,false,'text'),
    p('Granulopoiesis','','Normal maturation',false,false,'text'),
    sel('Megakaryocytes','','Adequate',['Adequate','Increased','Decreased','Absent']),
    p('Plasma Cells','%','< 5'),
    p('Blast Cells','%','< 5'),
    sel('Iron Stores (Perls Stain)','','Grade 2-3 (Normal)',['Grade 0 (Absent)','Grade 1 (Reduced)','Grade 2-3 (Normal)','Grade 4 (Markedly Increased)','Ringed Sideroblasts Present']),
    p('Cytological Impression','','',false,false,'text'),
  ]),

  t('FNAC Report','FNAC','Pathology','Fine Needle Aspirate',[
    p('Site of Aspiration','','',false,false,'text'),
    p('Macroscopic Description','','',false,false,'text'),
    p('Microscopic Description','','',false,false,'text'),
    p('Cytological Diagnosis','','',false,false,'text'),
    sel('Bethesda Category (Thyroid)','','Not Applicable',['Not Applicable','I - Non-Diagnostic','II - Benign','III - AUS/FLUS','IV - Follicular Neoplasm','V - Suspicious for Malignancy','VI - Malignant']),
  ]),
];

// ─── Seed Function ───────────────────────────────────────────────────────────
const seed = async () => {
  const User = require('./src/models/User');
  const admin = await User.findOne({ role: 'super-admin' });
  if (!admin) {
    console.error('ERROR: No super-admin user found. Create a super-admin account first.');
    process.exit(1);
  }

  let added = 0, skipped = 0, errors = 0;
  console.log(`\nSeeding ${NEW_TEMPLATES.length} templates...\n`);

  for (const tmpl of NEW_TEMPLATES) {
    try {
      const exists = await TestTemplate.findOne({ templateName: tmpl.templateName });
      if (exists) {
        process.stdout.write('  SKIP  ' + tmpl.templateName + '\n');
        skipped++;
        continue;
      }
      tmpl.createdBy = admin._id;
      await TestTemplate.create(tmpl);
      process.stdout.write('  ADD   ' + tmpl.templateName + '  [' + tmpl.category + ']\n');
      added++;
    } catch (err) {
      process.stdout.write('  ERR   ' + tmpl.templateName + ' — ' + err.message + '\n');
      errors++;
    }
  }

  const total = await TestTemplate.countDocuments();
  console.log('\n════════════════════════════════════════════════');
  console.log('  Templates added   : ' + added);
  console.log('  Skipped (exist)   : ' + skipped);
  console.log('  Errors            : ' + errors);
  console.log('  Total in DB now   : ' + total);
  console.log('════════════════════════════════════════════════\n');
  mongoose.connection.close();
};
