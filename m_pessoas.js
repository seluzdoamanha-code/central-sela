(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let allPessoas = [];

    document.addEventListener('DOMContentLoaded', async () => {
        await carregarPessoas();

        // Configurar busca
        const searchInput = document.getElementById('mSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filtrarLista(e.target.value);
            });
        }
    });

    function obterIniciais(nome) {
        if (!nome) return '?';
        const partes = nome.trim().split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    async function carregarPessoas() {
        const loading = document.getElementById('mLoadingState');
        const container = document.getElementById('mListPessoas');

        try {
            const { data, error } = await db.from('pessoas').select('id, nome_completo, tipo_pessoa, papeis, celular, cpf_cnpj, foto_url').order('nome_completo');
            
            loading.style.display = 'none';

            if (error) throw error;

            allPessoas = data || [];
            renderizarLista(allPessoas);

        } catch (e) {
            console.error(e);
            loading.innerText = 'Erro ao carregar lista.';
        }
    }

    function renderizarLista(lista) {
        const container = document.getElementById('mListPessoas');
        
        if (lista.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding: 20px;">Nenhuma pessoa encontrada.</div>`;
            return;
        }

        let html = '';
        lista.forEach(p => {
            const isEmpresa = p.tipo_pessoa === 'Jurídica';
            const iniciais = obterIniciais(p.nome_completo);
            const papelBadge = (p.papeis && p.papeis.length > 0) ? `<span class="badge" style="background: ${isEmpresa ? 'rgba(52, 211, 153, 0.2); color: #34d399' : 'rgba(99, 102, 241, 0.2); color: #818cf8'}">${p.papeis[0]}</span>` : '';
            
            const documento = p.cpf_cnpj ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${p.cpf_cnpj}</div>` : '';

            // Card HTML
            html += `
            <div class="m-card" onclick="alert('Perfil detalhado em breve no mobile!')" style="cursor: pointer; position: relative;">
                <div class="m-card-icon" style="background: ${isEmpresa ? 'var(--bg-panel)' : 'var(--bg-panel)'}; color: ${isEmpresa ? '#34d399' : 'var(--primary)'}; border: 1px solid var(--border); font-size: 16px;">
                    ${iniciais}
                </div>
                <div class="m-card-content">
                    <div class="m-card-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="display: block; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nome_completo || 'Sem Nome'}</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                        <div>
                            ${papelBadge}
                            ${documento}
                        </div>
                        <div style="color: var(--text-muted);">
                            ▶
                        </div>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;
    }

    function filtrarLista(termo) {
        termo = termo.toLowerCase().trim();
        if (!termo) {
            renderizarLista(allPessoas);
            return;
        }

        const filtrados = allPessoas.filter(p => {
            const nome = (p.nome_completo || '').toLowerCase();
            const doc = (p.cpf_cnpj || '').toLowerCase();
            return nome.includes(termo) || doc.includes(termo);
        });

        renderizarLista(filtrados);
    }
})();
