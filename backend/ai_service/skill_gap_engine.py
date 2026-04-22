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
        # Extract digits and decimal point
        matches = re.findall(r'(\d+\.?\d*)', str(ctc_str))
        if not matches:
            return 0.0
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
        if 'ctc' in self.official_df.columns:
            self.official_df['ctc_value'] = self.official_df['ctc'].apply(self._parse_ctc)
            self.official_df['ctc_bracket'] = self.official_df['ctc_value'].apply(self._assign_ctc_bracket)

        # --- YOUR CUSTOM NORMALIZATION MAPS ---
        self.company_map = {
            "Arista Network": "Arista Networks",
            "Bank of New York": "BNY Mellon",
            "Bank of New York Mellon": "BNY Mellon",
            "eQ Technogic": "EQ Technologic",
            "ZS Associate": "ZS Associates",
            "Walmart Global Tech India": "Walmart",
            "Cell.do": "Sell.do",
            "Floqast": "FloQast"
        }

        self.role_map = {
            "SDE": "Software Development Engineer",
            "SDE Role": "Software Development Engineer",
            "Software Developer": "Software Development Engineer",
            "Software Development Engineer (SDE)": "Software Development Engineer",
            "SWE": "Software Engineer",
            "Softwares Engineer": "Software Engineer",
            "Product Engineer": "Software Engineer",
            "SDE-I Intern": "SDE Intern",
            "Summer Intern": "Software Engineer Intern",
            "Summer Internship": "Software Engineer Intern",
            "Technology Summer Intern": "Software Engineer Intern",
            "BTSA": "Business Technology Solutions Associate"
        }

        def get_canonical_role(role):
            if pd.isna(role): return "Software Development Engineer"
            r_str = str(role).strip()
            # 1. Exact map match
            if r_str in self.role_map:
                return self.role_map[r_str]
            # 2. Case-insensitive fallback
            for old, new in self.role_map.items():
                if old.lower() == r_str.lower():
                    return new
            return r_str.title()

        def clean_company_name(name):
            if pd.isna(name): return name
            name = str(name).strip()
            # 1. Exact map match
            if name in self.company_map:
                return self.company_map[name]
            # 2. Regex cleaning
            name = name.title()
            name = re.sub(r'(?i)\s+India\s*$', '', name)
            name = re.sub(r'(?i)\s+(Pvt\s*Ltd|Private\s*Limited|Inc|Corp|LLC)\.?$', '', name)
            return name.strip()

        if 'company_name' in self.official_df.columns:
            self.official_df['company_name'] = self.official_df['company_name'].apply(clean_company_name)
        if 'company_name' in self.kaggle_df.columns:
            self.kaggle_df['company_name'] = self.kaggle_df['company_name'].apply(clean_company_name)

        self.official_df['grouped_role'] = self.official_df['profile'].apply(get_canonical_role) if 'profile' in self.official_df.columns else self.official_df['company_name'].apply(lambda x: 'Software Development Engineer')
        self.kaggle_df['grouped_role'] = self.kaggle_df['role'].apply(get_canonical_role) if 'role' in self.kaggle_df.columns else self.kaggle_df['company_name'].apply(lambda x: 'Software Development Engineer')
        
        # Speed Cache
        self.cached_metadata = None

    def get_extended_metadata(self):
        """Returns all deduplicated roles, companies, and detailed mapping relationships."""
        if hasattr(self, 'cached_metadata') and self.cached_metadata is not None:
            return self.cached_metadata

        raw_roles = list(set(
            self.official_df['grouped_role'].dropna().astype(str).tolist() + 
            self.kaggle_df['grouped_role'].dropna().astype(str).tolist()
        )) if not self.official_df.empty else []
        all_roles = sorted([r for r in raw_roles if r.strip() and r.lower() != 'nan'])
        
        raw_companies = list(set(
            self.official_df['company_name'].dropna().astype(str).tolist() + 
            self.kaggle_df['company_name'].dropna().astype(str).tolist()
        )) if not self.official_df.empty else []
        all_companies = sorted([c for c in raw_companies if c.strip() and c.lower() != 'nan'])
        
        mappings = []
        # Add Official mappings
        if not self.official_df.empty:
            for _, row in self.official_df.iterrows():
                comp = str(row.get('company_name', '')).strip()
                role = str(row.get('grouped_role', '')).strip()
                ctc_b = str(row.get('ctc_bracket', '')).strip()
                if comp and comp.lower() != 'nan':
                    mappings.append({"company": comp, "role": role, "ctc_bracket": ctc_b})
        
        # Add Kaggle mappings (fallback)
        if not self.kaggle_df.empty:
            for _, row in self.kaggle_df.iterrows():
                comp = str(row.get('company_name', '')).strip()
                role = str(row.get('grouped_role', '')).strip()
                # Kaggle doesn't have ctc_bracket, use a default
                ctc_b = "10-15LPA" 
                if comp and comp.lower() != 'nan':
                    # Only add if mapping doesn't exist to avoid duplicates
                    if not any(m['company'] == comp and m['role'] == role for m in mappings):
                        mappings.append({"company": comp, "role": role, "ctc_bracket": ctc_b})
        
        unique_mappings = [dict(t) for t in {tuple(d.items()) for d in mappings}]
        self.cached_metadata = {
            "roles": all_roles,
            "companies": all_companies,
            "ctc_brackets": ["0-5LPA", "5-10LPA", "10-15LPA", "15-20LPA", "20>(dream)"],
            "mappings": unique_mappings
        }
        return self.cached_metadata

    def get_recommended_skills(self, role_filter, ctc_bracket):
        off_filtered = self.official_df[(self.official_df['grouped_role'] == role_filter) & (self.official_df['ctc_bracket'] == ctc_bracket)] if not self.official_df.empty else pd.DataFrame()
        kag_filtered = self.kaggle_df[(self.kaggle_df['grouped_role'] == role_filter)] if not self.kaggle_df.empty else pd.DataFrame()
        all_skills = []
        for skills in off_filtered['skills_required'].dropna() if 'skills_required' in off_filtered.columns else []:
            all_skills.extend([s.strip().lower() for s in str(skills).split(',')])
        for skills in kag_filtered['skills'].dropna() if 'skills' in kag_filtered.columns else []:
            all_skills.extend([s.strip().lower() for s in str(skills).split(',')])
        counts = Counter([s for s in all_skills if len(s) > 1])
        return [skill for skill, count in counts.most_common(15)]

    def get_company_list(self, role_filter, ctc_bracket):
        if self.official_df.empty: return []
        filtered = self.official_df[(self.official_df['grouped_role'] == role_filter) & (self.official_df['ctc_bracket'] == ctc_bracket)]
        return filtered[['company_name', 'ctc', 'ctc_bracket', 'skills_required']].to_dict('records')

    def get_company_by_name(self, company_name):
        # Search official data first
        if self.official_df.empty or 'company_name' not in self.official_df.columns:
            res = pd.DataFrame()
        else:
            res = self.official_df[self.official_df['company_name'].astype(str).str.contains(company_name, case=False, na=False)]
            
        if not res.empty:
            record = res.iloc[0].to_dict()
            return record
        
        # Fallback: search kaggle data
        if self.kaggle_df.empty or 'company_name' not in self.kaggle_df.columns:
            res_kag = pd.DataFrame()
        else:
            res_kag = self.kaggle_df[self.kaggle_df['company_name'].astype(str).str.contains(company_name, case=False, na=False)]
            
        if not res_kag.empty:
            record = res_kag.iloc[0].to_dict()
            if 'skills_required' not in record and 'skills' in record:
                record['skills_required'] = record['skills']
            return record
        
        return None

    def compare_skills(self, user_skills, target_skills_str):
        if target_skills_str is None or str(target_skills_str).strip() == "":
            return {"match_p": 100, "matched": [], "missing": []}
            
        # Handle if target_skills_str is already a list
        if isinstance(target_skills_str, list):
            target_skills = [str(s).strip().lower() for s in target_skills_str]
        else:
            target_skills = [s.strip().lower() for s in str(target_skills_str).split(',')]
            
        user_skills_lower = [str(s).strip().lower() for s in user_skills]
        matched = [ts for ts in target_skills if any(us in ts or ts in us for us in user_skills_lower)]
        missing = [ts for ts in target_skills if ts not in matched]
        return {"match_p": round((len(matched)/len(target_skills))*100, 2) if len(target_skills) > 0 else 0, "matched": matched, "missing": missing}
