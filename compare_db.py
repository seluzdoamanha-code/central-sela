import urllib.request
import json
import sqlite3
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

# 2. Fetch SQLite CPFs and CNPJs
db_path = os.path.expanduser('~/Documents/AdminLuz_Dados/admin_data.sqlite')
if not os.path.exists(db_path):
    print("Banco SQLite não encontrado.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT cpf, nome_completo FROM pessoas")
pessoas_sql = cursor.fetchall()

missing = []

for row in pessoas_sql:
    raw_cpf = row[0]
    nome = row[1]
    
    if raw_cpf:
        clean_cpf = "".join(filter(str.isdigit, raw_cpf))
        if clean_cpf not in supa_dict:
            missing.append((clean_cpf, nome))

# Also check empresas
cursor.execute("SELECT cnpj, razao_social FROM empresas")
empresas_sql = cursor.fetchall()
for row in empresas_sql:
    raw_cnpj = row[0]
    nome = row[1]
    if raw_cnpj:
        clean_cnpj = "".join(filter(str.isdigit, raw_cnpj))
        if clean_cnpj not in supa_dict:
            missing.append((clean_cnpj, nome))

# 3. Write Artifact
artifact_path = os.path.expanduser('~/.gemini/antigravity/brain/a4c3ee39-9b7d-4566-8afa-533e4add5804/pessoas_faltantes.md')
with open(artifact_path, 'w', encoding='utf-8') as f:
    f.write("# Relatório de Pessoas e Empresas Faltantes\n\n")
    f.write(f"**Total no Supabase**: {len(pessoas_supabase)}\n")
    f.write(f"**Total no SQLite (Pessoas + Empresas)**: {len(pessoas_sql) + len(empresas_sql)}\n\n")
    
    if not missing:
        f.write("✅ **Nenhum cadastro faltando!** Todos os CPFs e CNPJs do banco antigo estão na nuvem.\n")
    else:
        f.write(f"⚠️ **Foram encontrados {len(missing)} cadastros no banco antigo que não subiram para a nuvem:**\n\n")
        f.write("| Documento (Limpo) | Nome Completo (Original) |\n")
        f.write("| --- | --- |\n")
        for doc, nome in missing:
            f.write(f"| {doc} | {nome} |\n")

print("Relatório gerado com sucesso!")
