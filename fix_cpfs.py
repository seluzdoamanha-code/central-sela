import urllib.request
import json

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1/pessoas'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

pessoas = [
    {
        "tipo_pessoa": "Física",
        "cpf_cnpj": "03400222720",
        "nome_completo": "Rony Antonio Marques Da Costa",
        "nome_curto": "Rony Costa",
        "data_nascimento": "1972-03-17",
        "celular": "47999233090",
        "email": "ronyzito@gmail.com"
    },
    {
        "tipo_pessoa": "Física",
        "cpf_cnpj": "05928013906",
        "nome_completo": "Luana Dalla Libera Kufner",
        "nome_curto": "Luana Kufner",
        "data_nascimento": "1992-01-27",
        "celular": "47991301244",
        "email": "luanadlkufner@gmail.com"
    }
]

for p in pessoas:
    req = urllib.request.Request(SUPABASE_URL, data=json.dumps(p).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Sucesso: {p['nome_curto']}")
    except Exception as e:
        msg = e.read().decode('utf-8')
        print(f"Erro: {msg}")
