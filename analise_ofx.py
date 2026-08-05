import re
import urllib.request
import json
import difflib
import sys

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

def parse_ofx_for_people(file_path):
    people = {}
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    matches = re.finditer(r'<MEMO>.*?(\d{11}|\d{14})\s+(.+?)\s*</MEMO>', content)
    for m in matches:
        cpf_cnpj = m.group(1)
        name = m.group(2).strip().upper()
        if cpf_cnpj not in people:
            people[cpf_cnpj] = name
            
    return people

def fetch_supabase_people():
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    url = f"{SUPABASE_URL}/pessoas?select=cpf_cnpj,nome_completo"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching supabase: {e}")
        return []

def main():
    if len(sys.argv) > 1:
        ofx_path = sys.argv[1]
    else:
        ofx_path = 'sicredi_1785505314.ofx'
        
    try:
        ofx_people = parse_ofx_for_people(ofx_path)
    except Exception as e:
        print(f"Erro ao ler arquivo OFX: {e}")
        sys.exit(1)
    
    sb_data = fetch_supabase_people()
    
    sb_people = {}
    for p in sb_data:
        cpf = p.get('cpf_cnpj')
        name = p.get('nome_completo')
        if cpf and name:
            clean_cpf = re.sub(r'\D', '', cpf)
            sb_people[clean_cpf] = name.strip().upper()
            
    novos = []
    existentes = []
    similaridades = []
    
    for ofx_cpf, ofx_name in ofx_people.items():
        if ofx_cpf in sb_people:
            existentes.append({
                'cpf': ofx_cpf,
                'ofx_name': ofx_name,
                'sb_name': sb_people[ofx_cpf]
            })
        else:
            # CPF not found in Supabase. Let's check for name similarities!
            best_match = None
            best_ratio = 0
            
            for sb_cpf, sb_name in sb_people.items():
                ratio = difflib.SequenceMatcher(None, ofx_name, sb_name).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = {'cpf': sb_cpf, 'name': sb_name}
            
            # Se a similaridade for maior que 80%, ou se o nome for idêntico mas com CPF diferente
            if best_ratio > 0.8:
                ficticio = "Sim" if best_match['cpf'].startswith("111111") else "Não"
                similaridades.append({
                    'ofx_cpf': ofx_cpf,
                    'ofx_name': ofx_name,
                    'sb_cpf': best_match['cpf'],
                    'sb_name': best_match['name'],
                    'ratio': round(best_ratio * 100, 1),
                    'ficticio': ficticio
                })
            else:
                novos.append({
                    'cpf': ofx_cpf,
                    'name': ofx_name
                })
            
    novos.sort(key=lambda x: x['name'])
    existentes.sort(key=lambda x: x['ofx_name'])
    similaridades.sort(key=lambda x: x['ratio'], reverse=True)
    
    # Generate Markdown
    md = "# Análise de Extrato OFX vs Supabase\n\n"
    
    md += f"## ⚠️ Similaridade de Nomes (CPFs diferentes) - Total: {len(similaridades)}\n"
    md += "O script encontrou nomes no OFX que são idênticos ou muito parecidos com nomes no Supabase, **mas possuem CPFs diferentes**. Isso é útil para corrigir cadastros com **CPFs Fictícios (111.111...)**.\n\n"
    md += "| Nome (OFX) | CPF (Real OFX) | Nome (Supabase) | CPF (Supabase) | CPF Fictício? | Similaridade |\n"
    md += "|---|---|---|---|---|---|\n"
    for s in similaridades:
        md += f"| {s['ofx_name']} | {s['ofx_cpf']} | {s['sb_name']} | {s['sb_cpf']} | {s['ficticio']} | {s['ratio']}% |\n"

    md += f"\n## ✨ Totalmente Novos (Não existem no Supabase) - Total: {len(novos)}\n"
    md += "| CPF/CNPJ | Nome Completo (OFX) |\n"
    md += "|---|---|\n"
    for n in novos:
        md += f"| {n['cpf']} | {n['name']} |\n"
        
    md += f"\n## ✅ Existentes (Batem o CPF no OFX e Supabase) - Total: {len(existentes)}\n"
    md += "| CPF/CNPJ | Nome no OFX | Nome no Supabase | Nomes são Iguais? |\n"
    md += "|---|---|---|---|\n"
    for e in existentes:
        status = "✅ Iguais" if e['ofx_name'] == e['sb_name'] else "⚠️ Diferentes"
        md += f"| {e['cpf']} | {e['ofx_name']} | {e['sb_name']} | {status} |\n"
        
    with open('ofx_analysis_result.md', 'w', encoding='utf-8') as f:
        f.write(md)
        
    print(f"Análise concluída.")
    print(f"- {len(similaridades)} possíveis conflitos/atualizações de CPF fictício")
    print(f"- {len(novos)} CPFs totalmente novos")
    print(f"- {len(existentes)} CPFs já existentes")
    print(f"Relatório gerado em: ofx_analysis_result.md")

if __name__ == '__main__':
    main()
