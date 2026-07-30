import urllib.request
import json
import csv
import os

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

# 1. Fetch Supabase CPFs
url_get = SUPABASE_URL + '/pessoas?select=cpf_cnpj,nome_completo'
req_get = urllib.request.Request(url_get, headers=headers)
try:
    with urllib.request.urlopen(req_get) as response:
        pessoas_supabase = json.loads(response.read().decode('utf-8'))
except Exception as e:
    print(f"Erro Supabase: {e}")
    exit(1)

supa_dict = {}
for p in pessoas_supabase:
    doc = p.get('cpf_cnpj')
    if doc:
        supa_dict[doc] = p.get('nome_completo')

# 2. Read CSV
csv_path = os.path.expanduser('~/Documents/antigravity/AdminLuz/pessoas_dados.csv')
if not os.path.exists(csv_path):
    print("CSV não encontrado.")
    exit(1)

missing = []
total_csv = 0

with open(csv_path, 'r', encoding='latin1') as f:
    reader = csv.reader(f, delimiter=';')
    next(reader, None) # header
    for row in reader:
        if not row or not row[0].strip():
            continue
        total_csv += 1
        raw_doc = row[0].strip()
        nome = row[1].strip() if len(row) > 1 else "Sem Nome"
        
        clean_doc = "".join(filter(str.isdigit, raw_doc))
        if clean_doc not in supa_dict:
            missing.append((clean_doc, nome))

# 3. Write Artifact
artifact_path = os.path.expanduser('~/.gemini/antigravity/brain/a4c3ee39-9b7d-4566-8afa-533e4add5804/pessoas_faltantes.md')
with open(artifact_path, 'w', encoding='utf-8') as f:
    f.write("# Relatório de Auditoria: CSV Original x Supabase\n\n")
    f.write(f"**Total na Nuvem (Supabase)**: {len(pessoas_supabase)}\n")
    f.write(f"**Total na Planilha CSV Original**: {total_csv}\n\n")
    
    if not missing:
        f.write("✅ **Nenhum cadastro faltando!** Todos os CPFs e CNPJs da planilha estão na nuvem.\n")
    else:
        f.write(f"⚠️ **Foram encontrados {len(missing)} cadastros na planilha que não estão na nuvem:**\n\n")
        f.write("| Documento (Planilha) | Nome Completo (Planilha) |\n")
        f.write("| --- | --- |\n")
        for doc, nome in missing:
            f.write(f"| {doc} | {nome} |\n")

print("Auditoria do CSV concluída!")
