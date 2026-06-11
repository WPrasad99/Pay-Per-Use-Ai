import pandas as pd
import os
import json

files = [f for f in os.listdir('.') if f.endswith('.xlsx')]
df = pd.read_excel(files[0])

summary = {}
for col in df.columns:
    if "Name" in col or "Email" in col or "time" in col.lower() or "ID" == col or "Beta launch" in col:
        continue
    
    # Check if column is numeric or categorical
    if df[col].dtype == 'object' or df[col].nunique() < 20:
        counts = df[col].value_counts().to_dict()
        summary[col] = counts
    else:
        # Just grab all non-null text responses for analysis (like concerns)
        summary[col] = df[col].dropna().tolist()

with open('survey_summary.json', 'w') as f:
    json.dump(summary, f, indent=2)

print("Summary generated successfully.")
