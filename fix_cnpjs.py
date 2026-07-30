import urllib.request
import json
import urllib.parse

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

# 1. Obter todas as pessoas
url_get = SUPABASE_URL + '/pessoas?select=id,cpf_cnpj'
req_get = urllib.request.Request(url_get, headers=headers)

try:
    with urllib.request.urlopen(req_get) as response:
        pessoas = json.loads(response.read().decode('utf-8'))
        
    atualizadas = 0
    for p in pessoas:
        cpf_cnpj = p.get('cpf_cnpj')
        if cpf_cnpj and len(cpf_cnpj) > 11:
            print(f"Atualizando {cpf_cnpj} para Jurídica")
            url_patch = SUPABASE_URL + f"/pessoas?id=eq.{p['id']}"
            dados_patch = {"tipo_pessoa": "Jurídica"}
            
            req_patch = urllib.request.Request(
                url_patch, 
                data=json.dumps(dados_patch).encode('utf-8'),
                headers=headers, 
                method='PATCH'
            )
            urllib.request.urlopen(req_patch)
            atualizadas += 1
            
    print(f"Sucesso! {atualizadas} CNPJs convertidos para Jurídica.")
except Exception as e:
    print(f"Erro: {e}")
