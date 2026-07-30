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

# Delete all vinculos from any "Diretoria"
url_est = SUPABASE_URL + '/estruturas?nome=ilike.*Diretoria*&select=id'
req_est = urllib.request.Request(url_est, headers=headers)
try:
    with urllib.request.urlopen(req_est) as response:
        estruturas = json.loads(response.read().decode('utf-8'))
        
    for est in estruturas:
        est_id = est['id']
        print(f"Deletando vinculos da estrutura: {est_id}")
        url_del = SUPABASE_URL + f'/vinculos_estrutura?estrutura_id=eq.{est_id}'
        req_del = urllib.request.Request(url_del, headers=headers, method='DELETE')
        urllib.request.urlopen(req_del)
        print("Vínculos apagados!")
except Exception as e:
    print(f"Erro: {e}")
