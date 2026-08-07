(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let allEstruturas = [];
    let vinculosCount = {};

    document.addEventListener('DOMContentLoaded', async () => {
        await carregarDados();

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                carregarDados();
            }
        });

        const searchInput = document.getElementById('mSearchInput');
        const filterTag = document.getElementById('mFilterTag');
        const btnToggleFilter = document.getElementById('btnToggleFilter');
        const filterPanel = document.getElementById('mFilterPanel');

        if (btnToggleFilter && filterPanel) {
            btnToggleFilter.addEventListener('click', () => {
                const isHidden = filterPanel.style.display === 'none';
                filterPanel.style.display = isHidden ? 'flex' : 'none';
                btnToggleFilter.style.color = isHidden ? 'var(--primary)' : 'var(--text-muted)';
                btnToggleFilter.style.borderColor = isHidden ? 'var(--primary)' : 'var(--border)';
            });
        }

        if (searchInput) searchInput.addEventListener('input', filtrarLista);
        if (filterTag) filterTag.addEventListener('change', filtrarLista);

        // Hide add button if no permission
        if (typeof window.podeEditarPessoas === 'function' && !window.podeEditarPessoas()) {
            const fab = document.getElementById('btnAdicionar');
            if (fab) fab.style.display = 'none';
        }
    });

    function obterIniciais(nome) {
        if (!nome) return '?';
        const partes = nome.trim().split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    async function carregarDados() {
        const loading = document.getElementById('mLoadingState');
        if (loading) loading.innerText = 'Buscando do banco...';

        try {
            const { data, error } = await db.from('estruturas').select('*').order('nome');
            const { data: vinculosData } = await db.from('vinculos_estrutura').select('estrutura_id');
            
            if (loading) loading.style.display = 'none';
            if (error) throw error;

            allEstruturas = data || [];
            
            // Contar vínculos
            vinculosCount = {};
            if (vinculosData) {
                vinculosData.forEach(v => {
                    vinculosCount[v.estrutura_id] = (vinculosCount[v.estrutura_id] || 0) + 1;
                });
            }

            filtrarLista();
        } catch (e) {
            console.error('Erro geral:', e);
            document.getElementById('mLoadingState').innerText = 'Erro ao carregar dados.';
        }
    }

    function filtrarLista() {
        const query = (document.getElementById('mSearchInput')?.value || '').toLowerCase();
        const tag = document.getElementById('mFilterTag')?.value || '';

        const filtrados = allEstruturas.filter(est => {
            const nomeStr = (est.nome || '').toLowerCase();
            const matchNome = nomeStr.includes(query);
            const matchTag = !tag || est.tipo === tag;
            return matchNome && matchTag;
        });

        renderizar(filtrados);
    }

    function getCorPorTipo(tipo) {
        switch(tipo) {
            case 'Departamento': return 'linear-gradient(135deg, #3b82f6, #2563eb)';
            case 'Atividade': return 'linear-gradient(135deg, #10b981, #059669)';
            case 'Família': return 'linear-gradient(135deg, #f59e0b, #d97706)';
            case 'Turma': return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
            default: return 'linear-gradient(135deg, #64748b, #475569)';
        }
    }

    function renderizar(dados) {
        const container = document.getElementById('mListContainer');
        if (!container) return;
        
        container.innerHTML = '';
        const qtySpan = document.getElementById('mResultsCount');
        if (qtySpan) qtySpan.innerText = `${dados.length} Encontrado(s)`;

        dados.forEach(est => {
            const numVinculos = vinculosCount[est.id] || 0;
            const card = document.createElement('div');
            card.className = 'm-card m-person-card';
            card.style.position = 'relative';

            card.innerHTML = `
                <div style="width: 48px; height: 48px; border-radius: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; background: ${getCorPorTipo(est.tipo)}; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    ${obterIniciais(est.nome)}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 15px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">
                        ${est.nome || 'Sem Nome'}
                    </div>
                    <div style="font-size: 13px; color: var(--text-muted);">
                        ${est.tipo || 'Desconhecido'}
                    </div>
                    <div style="font-size: 12px; margin-top: 4px; display: inline-block; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; color: var(--text-muted);">
                        ${numVinculos} pessoa(s) vinculada(s)
                    </div>
                </div>
                <div style="color: var(--text-muted);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
            `;
            
            card.addEventListener('click', () => {
                alert('Edição de atividades no celular em breve!');
            });
            
            container.appendChild(card);
        });
    }

})();
