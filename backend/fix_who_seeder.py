import requests
import pandas as pd
import io

urls = {
    'haz_boys_2_5': ('haz', 'L', 'https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/length-height-for-age/lhfa_boys_2-to-5-years_zscores.xlsx?sfvrsn=17e5ad91_9'),
    'haz_girls_2_5': ('haz', 'P', 'https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/length-height-for-age/lhfa_girls_2-to-5-years_zscores.xlsx?sfvrsn=2ec187b9_11')
}

headers = {'User-Agent': 'Mozilla/5.0'}
records = []

for key, (indeks, jk, url) in urls.items():
    print(f"Downloading {key}...")
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        df = pd.read_excel(io.BytesIO(res.content))
        # Rename columns to strip whitespace
        df.columns = df.columns.str.strip()
        
        df = df.dropna(subset=['Month', 'L', 'M', 'S'])
        
        for index, row in df.iterrows():
            month = int(row['Month'])
            
            # Skip month 24 as it's already in the seeder
            if month == 24:
                continue
                
            records.append({
                'indeks': indeks,
                'jenis_kelamin': jk,
                'usia_bulan': month,
                'L': round(row['L'], 4),
                'M': round(row['M'], 4),
                'S': round(row['S'], 5)
            })

print(f"Fetched {len(records)} records")

with open('database/seeders/WhoLmsSeeder.php', 'r') as f:
    content = f.read()

# Insert the records just before the closing bracket of $data = [ ... ];
# The array ends with \n        ];
insert_idx = content.find("\n        ];")

if insert_idx != -1:
    new_lines = ""
    for r in records:
        new_lines += f"            ['indeks' => '{r['indeks']}', 'jenis_kelamin' => '{r['jenis_kelamin']}', 'usia_bulan' => {r['usia_bulan']}, 'L' => {r['L']}, 'M' => {r['M']}, 'S' => {r['S']}],\n"
    
    new_content = content[:insert_idx] + "\n" + new_lines.rstrip() + content[insert_idx:]
    with open('database/seeders/WhoLmsSeeder.php', 'w') as f:
        f.write(new_content)
    print("Successfully updated WhoLmsSeeder.php")
else:
    print("Could not find insertion point in WhoLmsSeeder.php")
