const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDepartamentos();
    await carregarSociais();
    
    document.getElementById('btnSalvarSociais').addEventListener('click', salvarSociais);
});

function showAviso(msg) {
    const alertBox = document.getElementById('alertMessage');
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
}

// ==========================================
// MÓDULO: DEPARTAMENTOS NO MENU
// ==========================================
async function carregarDepartamentos() {
    const container = document.getElementById('listaDepartamentos');
    const loading = document.getElementById('loadingDepartamentos');
    
    try {
        const { data, error } = await db.from('estruturas').select('id, nome, tipo, exibir_no_menu').order('tipo').order('nome');
        loading.style.display = 'none';
        
        if (error) {
            // Se der erro, provavelmente a coluna 'exibir_no_menu' não existe ainda.
            container.innerHTML = `<div style="color: #ef4444; padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                ⚠️ A coluna <b>exibir_no_menu</b> (tipo Boolean) ainda não foi criada na tabela <i>estruturas</i> do Supabase. Crie-a lá pelo painel do Supabase para ativar este recurso.
            </div>`;
            return;
        }
        
        let html = '';
        data.forEach(d => {
            html += `
            <div class="toggle-row">
                <div>
                    <div style="color: white; font-weight: 500;">${d.nome}</div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-top: 2px;">Tipo: ${d.tipo}</div>
                </div>
                <label class="switch">
                    <input type="checkbox" onchange="toggleMenu('${d.id}', this.checked)" ${d.exibir_no_menu ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error("Erro ao carregar estruturas:", err);
    }
}

window.toggleMenu = async (id, checked) => {
    try {
        const { error } = await db.from('estruturas').update({ exibir_no_menu: checked }).eq('id', id);
        if (error) throw error;
        
        showAviso(checked ? 'Departamento adicionado ao Menu!' : 'Departamento removido do Menu.');
        // Recarrega o menu lateral sem precisar atualizar a pagina inteira!
        if(window.carregarAtalhosDinamicos) {
            window.carregarAtalhosDinamicos();
        }
    } catch (err) {
        console.error("Erro ao atualizar menu:", err);
        alert("Erro ao atualizar. Veja o console.");
    }
};

// ==========================================
// MÓDULO: REDES SOCIAIS
// ==========================================
async function carregarSociais() {
    try {
        const { data, error } = await db.from('configuracoes').select('*');
        
        if (error) {
            document.getElementById('formSociais').innerHTML = `<div style="color: #ef4444; padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                ⚠️ A tabela <b>configuracoes</b> ainda não foi criada no Supabase. <br>
                Crie uma tabela chamada <i>configuracoes</i> com duas colunas de texto: <b>chave</b> (Primary Key) e <b>valor</b>.
            </div>`;
            return;
        }
        
        const map = {};
        data.forEach(c => map[c.chave] = c.valor);
        
        document.getElementById('inYoutube').value = map['link_youtube'] || '';
        document.getElementById('chkYoutube').checked = map['social_youtube'] === 'true';
        
        document.getElementById('inInstagram').value = map['link_instagram'] || '';
        document.getElementById('chkInstagram').checked = map['social_instagram'] === 'true';
        
        document.getElementById('inFacebook').value = map['link_facebook'] || '';
        document.getElementById('chkFacebook').checked = map['social_facebook'] === 'true';
        
        document.getElementById('inTiktok').value = map['link_tiktok'] || '';
        document.getElementById('chkTiktok').checked = map['social_tiktok'] === 'true';
        
    } catch (err) {
        console.error("Erro ao carregar configuracoes:", err);
    }
}

async function salvarSociais() {
    const btn = document.getElementById('btnSalvarSociais');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    
    const configs = [
        { chave: 'link_youtube', valor: document.getElementById('inYoutube').value },
        { chave: 'social_youtube', valor: document.getElementById('chkYoutube').checked ? 'true' : 'false' },
        
        { chave: 'link_instagram', valor: document.getElementById('inInstagram').value },
        { chave: 'social_instagram', valor: document.getElementById('chkInstagram').checked ? 'true' : 'false' },
        
        { chave: 'link_facebook', valor: document.getElementById('inFacebook').value },
        { chave: 'social_facebook', valor: document.getElementById('chkFacebook').checked ? 'true' : 'false' },
        
        { chave: 'link_tiktok', valor: document.getElementById('inTiktok').value },
        { chave: 'social_tiktok', valor: document.getElementById('chkTiktok').checked ? 'true' : 'false' },
    ];
    
    try {
        // Upsert para inserir ou atualizar as configurações baseadas na chave
        const { error } = await db.from('configuracoes').upsert(configs, { onConflict: 'chave' });
        if (error) throw error;
        
        showAviso('Redes Sociais salvas com sucesso!');
        
        // Atualiza a sidebar imediatamente
        if(window.carregarRedesSociais) {
            window.carregarRedesSociais();
        }
        
    } catch (err) {
        console.error("Erro ao salvar sociais:", err);
        alert("Erro ao salvar. A tabela configuracoes existe?");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Redes Sociais';
    }
}
