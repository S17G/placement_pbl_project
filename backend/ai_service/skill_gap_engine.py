import pandas as pd
import re
import os
import json
from collections import Counter

class SkillGapEngine:
    def __init__(self, official_df=None, kaggle_df=None):
        if official_df is not None and kaggle_df is not None:
            self.official_df = official_df
            self.kaggle_df = kaggle_df
            self.clean_data()
        else:
            # Fallback to empty context if not provided during init
            self.official_df = pd.DataFrame()
            self.kaggle_df = pd.DataFrame()

    def update_data(self, official_df, kaggle_df):
        """Used to hot-load data from MongoDB asynchronously."""
        self.official_df = official_df
        self.kaggle_df = kaggle_df
        self.clean_data()

    def _parse_ctc(self, ctc_str):
        if pd.isna(ctc_str) or ctc_str == '-':
            return 0.0
        # Extract digits and decimal point. Handle ranges like "5-8 LPA" by taking the upper bound
        matches = re.findall(r'(\d+\.?\d*)', str(ctc_str))
        if not matches:
            return 0.0
        # Return the highest value in the string (usually the top of the range or the main CTC)
        return max([float(m) for m in matches])

    def _assign_ctc_bracket(self, val):
        if val == 0: return "Unknown"
        if val < 5: return "0-5LPA"
        if val <= 10: return "5-10LPA"
        if val <= 15: return "10-15LPA"
        if val <= 20: return "15-20LPA"
        return "20>(dream)"

    def clean_data(self):
        # Clean CTC in official data
        self.official_df['ctc_value'] = self.official_df['ctc'].apply(self._parse_ctc)
        self.official_df['ctc_bracket'] = self.official_df['ctc_value'].apply(self._assign_ctc_bracket)

        # Canonical mapping (per user request: prefer full names)
        # We deduplicate by mapping abbreviations to their full descriptive names
        self.role_map = {
            'sde': 'Software Development Engineer',
            'sdet': 'Software Development Engineer in Test',
            'qa': 'Quality Analyst',
            'fsd': 'Full Stack Developer',
            'ml': 'Machine Learning Engineer',
            'ai': 'Artificial Intelligence Engineer',
            'ds': 'Data Scientist',
            'da': 'Data Analyst',
            'ba': 'Business Analyst',
            'se': 'Software Engineer'
        }

        def get_canonical_role(role):
            if pd.isna(role): return "Software Development Engineer"
            r_str = str(role).strip()
            r_lower = r_str.lower()
            
            # 1. Exact abbreviation match
            if r_lower in self.role_map:
                return self.role_map[r_lower]
            
            # 2. Heuristic: if it's already a long form that contains an abbreviation
            for abbr, full in self.role_map.items():
                if abbr.upper() in r_str and len(r_str) > len(abbr) + 2:
                    return r_str # Keep the existing descriptive full name
                    
            return r_str

        self.official_df['grouped_role'] = self.official_df['profile'].apply(get_canonical_role) if 'profile' in self.official_df.columns else self.official_df['company_name'].apply(lambda x: 'Software Development Engineer')
        self.kaggle_df['grouped_role'] = self.kaggle_df['role'].apply(get_canonical_role) if 'role' in self.kaggle_df.columns else self.kaggle_df['company_name'].apply(lambda x: 'Software Development Engineer')

    def get_extended_metadata(self):
        """Returns all deduplicated roles and all unique company names from both datasets."""
        raw_roles = list(set(
            self.official_df['grouped_role'].dropna().astype(str).tolist() + 
            self.kaggle_df['grouped_role'].dropna().astype(str).tolist()
        ))
        all_roles = sorted([r for r in raw_roles if r.strip() and r.lower() != 'nan'])
        
        raw_companies = list(set(
            self.official_df['company_name'].dropna().astype(str).tolist() + 
            self.kaggle_df['company_name'].dropna().astype(str).tolist()
        ))
        all_companies = sorted([c for c in raw_companies if c.strip() and c.lower() != 'nan'])
        
        return {
            "roles": all_roles,
            "companies": all_companies,
            "ctc_brackets": ["0-5LPA", "5-10LPA", "10-15LPA", "15-20LPA", "20>(dream)"]
        }

    def get_recommended_skills(self, role_filter, ctc_bracket):
        # Filter both datasets
        off_filtered = self.official_df[
            (self.official_df['grouped_role'] == role_filter) & 
            (self.official_df['ctc_bracket'] == ctc_bracket)
        ]
        kag_filtered = self.kaggle_df[
            (self.kaggle_df['grouped_role'] == role_filter)
        ]

        all_skills = []
        
        # From official data
        for skills in off_filtered['skills_required'].dropna():
            all_skills.extend([s.strip().lower() for s in str(skills).split(',')])
        
        # From Kaggle data
        for skills in kag_filtered['skills'].dropna():
            all_skills.extend([s.strip().lower() for s in str(skills).split(',')])

        # Remove generic stop words or short strings
        stopwords = {'and', 'to', 'for', 'the', 'with', 'in', 'product-engineering', 'strong', 'environment'}
        filtered_skills = [s for s in all_skills if s not in stopwords and len(s) > 1]
        
        # Count and return top 15
        counts = Counter(filtered_skills)
        return [skill for skill, count in counts.most_common(15)]

    def get_company_list(self, role_filter, ctc_bracket):
        filtered = self.official_df[
            (self.official_df['grouped_role'] == role_filter) & 
            (self.official_df['ctc_bracket'] == ctc_bracket)
        ]
        return filtered[['company_name', 'ctc', 'ctc_bracket', 'skills_required']].to_dict('records')

    def get_company_by_name(self, company_name):
        # Search official data first
        res = self.official_df[self.official_df['company_name'].astype(str).str.contains(company_name, case=False, na=False)] if not self.official_df.empty and 'company_name' in self.official_df.columns else pd.DataFrame()
        if not res.empty:
            record = res.iloc[0].to_dict()
            return record
        
        # Fallback: search kaggle data
        res_kag = self.kaggle_df[self.kaggle_df['company_name'].astype(str).str.contains(company_name, case=False, na=False)] if not self.kaggle_df.empty and 'company_name' in self.kaggle_df.columns else pd.DataFrame()
        if not res_kag.empty:
            record = res_kag.iloc[0].to_dict()
            # Kaggle uses 'skills' instead of 'skills_required' — normalise
            if 'skills_required' not in record and 'skills' in record:
                record['skills_required'] = record['skills']
            return record
        
        return None

    def compare_skills(self, user_skills, target_skills_str):
        """
        user_skills: list of strings
        target_skills_str: comma-separated string from JD
        """
        if pd.isna(target_skills_str) or not target_skills_str:
            return {"match_p": 100, "matched": [], "missing": [], "status": "No requirements listed"}

        target_skills = [s.strip().lower() for s in str(target_skills_str).split(',')]
        user_skills_lower = [s.strip().lower() for s in user_skills]

        matched = []
        missing = []

        for ts in target_skills:
            # Check for exact or substring match (e.g. "python" in "strong python skills")
            found = False
            for us in user_skills_lower:
                if us in ts or ts in us:
                    matched.append(ts)
                    found = True
                    break
            if not found:
                missing.append(ts)

        match_p = (len(matched) / len(target_skills)) * 100 if target_skills else 0
        return {
            "match_p": round(match_p, 2),
            "matched": matched,
            "missing": missing
        }

# Initial test code
if __name__ == "__main__":
    engine = SkillGapEngine()
    print("Available Roles:", engine.official_df['grouped_role'].unique())
    print("Available Brackets:", engine.official_df['ctc_bracket'].unique())
    
    recs = engine.get_recommended_skills("SDE", "10-15LPA")
    print("\nRecommended Skills for SDE (10-15LPA):", recs)
    
    companies = engine.get_company_list("SDE", "10-15LPA")
    print(f"\nCompanies in this range: {len(companies)}")
