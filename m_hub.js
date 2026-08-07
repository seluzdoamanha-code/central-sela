(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let estruturaAtual = null;
    let membrosEquipe = [];

    document.addEventListener('DOMContentLoaded', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (!id) {
            alert('ID da estrutura não fornecido.');
            window.location.href = 'm_atividades.html';
            return;
        }

        await carregarEstrutura(id);

        // Setup UI listeners
        document.getElementById('tabApps').addEventListener('click', () => switchTab('apps'));
        document.getElementById('tabEquipe').addEventListener('click', () => switchTab('equipe'));

        // Permissões
        const podeEditar = typeof window.podeEditarPessoas === 'function' && window.podeEditarPessoas();
        if (podeEditar) {
            document.getElementById('btnOpenEdit').style.display = 'block';
            document.getElementById('btnExcluir').style.display = 'block';
        }

        // Modal Listeners
        document.getElementById('btnOpenEdit').addEventListener('click', abrirModalEdicao);
        document.getElementById('btnCloseEdit').addEventListener('click', fecharModalEdicao);
        document.getElementById('btnSaveEdit').addEventListener('click', salvarEdicao);
        document.getElementById('btnExcluir').addEventListener('click', excluirEstrutura);
    });

    async function carregarEstrutura(id) {
        document.getElementById('mLoadingState').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';

        try {
            // Fetch estrutura
            const { data, error } = await db.from('estruturas').select('*').eq('id', id).single();
            if (error) throw error;
            if (!data) throw new Error("Estrutura não encontrada.");
            
            estruturaAtual = data;
            
            // Fetch team members
            const { data: vinculos, error: vError } = await db
                .from('vinculos_estrutura')
                .select(`
                    id, 
                    papel_na_estrutura,
                    pessoas ( id, nome_completo, foto_url )
                `)
                .eq('estrutura_id', id);
            
            if (!vError && vinculos) {
                membrosEquipe = vinculos;
            }

            renderizarDetalhes();
            renderizarApps();
            renderizarEquipe();

            document.getElementById('mLoadingState').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
        } catch (e) {
            console.error('Erro:', e);
            document.getElementById('mLoadingState').innerText = 'Erro ao carregar dados.';
        }
    }

    function obterIniciais(nome) {
        if (!nome) return '?';
        const partes = nome.trim().split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    function renderizarDetalhes() {
        document.getElementById('lblNome').innerText = estruturaAtual.nome;
        document.getElementById('lblTipo').innerText = estruturaAtual.tipo;
        document.getElementById('lblIcone').innerText = obterIniciais(estruturaAtual.nome);
        
        const descEl = document.getElementById('lblDescricao');
        if (estruturaAtual.descricao && estruturaAtual.descricao.trim() !== '') {
            descEl.innerText = estruturaAtual.descricao;
            descEl.style.display = 'block';
        } else {
            descEl.style.display = 'none';
        }

        // Cor do ícone baseada no tipo (mesmo do m_atividades)
        const tipo = estruturaAtual.tipo;
        let bg = 'linear-gradient(135deg, #64748b, #475569)';
        if (tipo === 'Departamento') bg = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        else if (tipo === 'Atividade') bg = 'linear-gradient(135deg, #10b981, #059669)';
        else if (tipo === 'Família') bg = 'linear-gradient(135deg, #f59e0b, #d97706)';
        else if (tipo === 'Turma') bg = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
        document.getElementById('lblIcone').style.background = bg;

        document.getElementById('lblQtdEquipe').innerText = membrosEquipe.length;
    }

    function renderizarApps() {
        const container = document.getElementById('contentApps');
        let html = '';
        const nome = (estruturaAtual.nome || '').toLowerCase();

        // Lógica de "Mini-apps" específicos para o Mobile
        if (nome.includes('assistência') || nome.includes('social')) {
            html += `
                <a href="#" class="m-app-card" onclick="alert('Indo para Famílias Assistidas...')">
                    <div class="m-app-icon">👨‍👩‍👧‍👦</div>
                    <div class="m-app-name">Famílias</div>
                </a>
                <a href="#" class="m-app-card" onclick="alert('Indo para Distribuição de Cestas...')">
                    <div class="m-app-icon">📦</div>
                    <div class="m-app-name">Entregas</div>
                </a>
            `;
        } else if (nome.includes('irradiação')) {
            html += `
                <a href="pedido-irradiacao.html" class="m-app-card">
                    <div class="m-app-icon">✨</div>
                    <div class="m-app-name">LivroLuz</div>
                </a>
                <a href="#" class="m-app-card">
                    <div class="m-app-icon">📖</div>
                    <div class="m-app-name">Mensagens</div>
                </a>
            `;
        } else if (nome.includes('tesouraria') || nome.includes('financeiro')) {
             html += `
                <a href="#" class="m-app-card">
                    <div class="m-app-icon">💸</div>
                    <div class="m-app-name">Lançamentos</div>
                </a>
                <a href="#" class="m-app-card">
                    <div class="m-app-icon">📊</div>
                    <div class="m-app-name">Relatórios</div>
                </a>
            `;
        } else {
            // Genéricos
            html += `
                <a href="#" class="m-app-card" onclick="document.getElementById('tabEquipe').click();">
                    <div class="m-app-icon">👥</div>
                    <div class="m-app-name">Participantes</div>
                </a>
                <a href="#" class="m-app-card" onclick="alert('Módulo de Agenda em breve no celular!')">
                    <div class="m-app-icon">📅</div>
                    <div class="m-app-name">Agenda</div>
                </a>
            `;
        }

        container.innerHTML = html;
    }

    function renderizarEquipe() {
        const container = document.getElementById('contentEquipe');
        if (membrosEquipe.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Ninguém vinculado ainda.</div>';
            return;
        }

        let html = '';
        membrosEquipe.forEach(v => {
            const p = v.pessoas || {};
            const nome = p.nome_completo || 'Pessoa Desconhecida';
            const iniciais = obterIniciais(nome);
            
            html += `
                <div class="m-card" style="display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer;" onclick="window.location.href='m_perfil.html?id=${p.id}'">
                    <div style="width: 40px; height: 40px; border-radius: 20px; background: var(--bg-dark); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-muted);">
                        ${p.foto_url ? `<img src="${p.foto_url}" style="width:100%;height:100%;border-radius:20px;object-fit:cover;">` : iniciais}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 500; font-size: 14px; color: var(--text-main); margin-bottom: 2px;">${nome}</div>
                        <div style="font-size: 12px; color: var(--primary);">${v.papel_na_estrutura || 'Membro'}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function switchTab(tab) {
        document.getElementById('tabApps').classList.remove('active');
        document.getElementById('tabEquipe').classList.remove('active');
        document.getElementById('contentApps').style.display = 'none';
        document.getElementById('contentEquipe').style.display = 'none';

        if (tab === 'apps') {
            document.getElementById('tabApps').classList.add('active');
            document.getElementById('contentApps').style.display = 'grid';
        } else {
            document.getElementById('tabEquipe').classList.add('active');
            document.getElementById('contentEquipe').style.display = 'flex';
        }
    }

    // Modal de Edição
    function abrirModalEdicao() {
        document.getElementById('inNome').value = estruturaAtual.nome || '';
        document.getElementById('inTipo').value = estruturaAtual.tipo || 'Departamento';
        document.getElementById('inDescricao').value = estruturaAtual.descricao || '';
        
        document.getElementById('modalEdit').classList.add('active');
    }

    function fecharModalEdicao() {
        document.getElementById('modalEdit').classList.remove('active');
    }

    async function salvarEdicao() {
        const nome = document.getElementById('inNome').value.trim();
        const tipo = document.getElementById('inTipo').value;
        const descricao = document.getElementById('inDescricao').value.trim();

        if (!nome) {
            alert('O nome é obrigatório.');
            return;
        }

        document.getElementById('btnSaveEdit').innerText = 'Salvando...';
        document.getElementById('btnSaveEdit').disabled = true;

        try {
            const { error } = await db.from('estruturas').update({
                nome: nome,
                tipo: tipo,
                descricao: descricao
            }).eq('id', estruturaAtual.id);

            if (error) throw error;

            estruturaAtual.nome = nome;
            estruturaAtual.tipo = tipo;
            estruturaAtual.descricao = descricao;

            renderizarDetalhes();
            renderizarApps(); // Recarrega atalhos baseados no novo nome
            fecharModalEdicao();
        } catch (e) {
            console.error('Erro ao salvar:', e);
            alert('Erro ao salvar as alterações.');
        } finally {
            document.getElementById('btnSaveEdit').innerText = 'Salvar';
            document.getElementById('btnSaveEdit').disabled = false;
        }
    }

    async function excluirEstrutura() {
        if (!confirm('ATENÇÃO: Deseja realmente excluir esta atividade/departamento? Esta ação não pode ser desfeita e todos os vínculos serão perdidos.')) return;
        
        try {
            // Deleta vínculos primeiro
            await db.from('vinculos_estrutura').delete().eq('estrutura_id', estruturaAtual.id);
            // Deleta estrutura
            const { error } = await db.from('estruturas').delete().eq('id', estruturaAtual.id);
            
            if (error) throw error;
            
            alert('Atividade excluída com sucesso.');
            window.location.href = 'm_atividades.html';
        } catch (e) {
            console.error('Erro ao excluir:', e);
            alert('Erro ao excluir. Tente novamente.');
        }
    }

})();
