(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let allPessoas = [];

    document.addEventListener('DOMContentLoaded', async () => {
        await carregarPessoas();

        // Se voltar pela navegação nativa do Safari/Chrome (BFCache), recarrega
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                carregarPessoas();
            }
        });

        // Configurar busca e filtros
        const searchInput = document.getElementById('mSearchInput');
        const filterTipo = document.getElementById('mFilterTipo');
        const sortOrder = document.getElementById('mSortOrder');
        const filterPapel = document.getElementById('mFilterPapel');
        const showOutros = document.getElementById('mShowOutros');
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

        const triggerFilter = () => filtrarLista();

        if (searchInput) searchInput.addEventListener('input', triggerFilter);
        if (filterTipo) filterTipo.addEventListener('change', triggerFilter);
        if (sortOrder) sortOrder.addEventListener('change', triggerFilter);
        if (filterPapel) filterPapel.addEventListener('change', triggerFilter);
        if (showOutros) showOutros.addEventListener('change', triggerFilter);
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
            const { data, error } = await db.from('pessoas').select('id, nome_completo, nome_curto, tipo_pessoa, papeis, celular, cpf_cnpj, foto_url, created_at').order('nome_completo');
            
            loading.style.display = 'none';

            if (error) throw error;

            allPessoas = data || [];
            renderizarLista(allPessoas);

        } catch (e) {
            console.error(e);
            loading.innerText = 'Erro ao carregar lista.';
        }
    }

    function formatarCpfCnpj(v) {
        if (!v) return '';
        v = v.replace(/\D/g,"");
        if (v.length <= 11) {
            return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g,"\$1.\$2.\$3-\$4");
        } else {
            return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g,"\$1.\$2.\$3/\$4-\$5");
        }
    }

    function renderizarLista(pessoas) {
        const container = document.getElementById('mListPessoas');
        const dash = document.getElementById('mDashboardStats');

        // Atualizar Dashboard
        if (dash) {
            const total = pessoas.length;
            const fisicas = pessoas.filter(p => p.tipo_pessoa === 'Física' || !p.tipo_pessoa).length;
            const juridicas = pessoas.filter(p => p.tipo_pessoa === 'Jurídica').length;

            dash.innerHTML = `
                <div style="flex: 1; min-width: 90px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); padding: 10px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 700; color: var(--primary);">${total}</div>
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Total</div>
                </div>
                <div style="flex: 1; min-width: 90px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 10px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 700; color: #10b981;">${fisicas}</div>
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Físicas</div>
                </div>
                <div style="flex: 1; min-width: 90px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 10px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 700; color: #f59e0b;">${juridicas}</div>
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Jurídicas</div>
                </div>
            `;
        }
        
        if (pessoas.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding: 20px;">Nenhuma pessoa encontrada.</div>`;
            return;
        }

        let html = '';
        pessoas.forEach(p => {
            const isEmpresa = p.tipo_pessoa === 'Jurídica';
            const nomeExibicao = p.nome_curto || p.nome_completo || 'Sem Nome';
            
            // Foto ou Iniciais
            let visualIcone = '';
            if (p.foto_url) {
                visualIcone = `<img src="${p.foto_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
            } else {
                const iniciais = obterIniciais(p.nome_completo);
                visualIcone = iniciais;
            }

            // Papeis (Até 3 badges)
            let papeisHtml = '';
            if (p.papeis && p.papeis.length > 0) {
                const limit = Math.min(p.papeis.length, 3);
                for(let i=0; i<limit; i++) {
                    papeisHtml += `<span class="badge" style="background: ${isEmpresa ? 'rgba(52, 211, 153, 0.2); color: #34d399' : 'rgba(99, 102, 241, 0.2); color: #818cf8'}; margin-right: 4px;">${p.papeis[i]}</span>`;
                }
            }
            
            // Documento formatado
            const docFormatado = formatarCpfCnpj(p.cpf_cnpj);
            const documento = docFormatado ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${docFormatado}</div>` : '';

            // WhatsApp link
            let whatsAppBtn = '';
            if (p.celular) {
                const numeroLimpo = p.celular.replace(/\D/g, '');
                // Ajustado para não quebrar a altura da linha: sem padding, line-height 1
                whatsAppBtn = `<a href="https://wa.me/55${numeroLimpo}" target="_blank" style="color: #22c55e; font-size: 18px; text-decoration: none; line-height: 1; margin-left: 8px;" onclick="event.stopPropagation();">💬</a>`;
            }

            // Card HTML
            html += `
            <div class="m-card" onclick="window.location.href='m_perfil.html?id=${p.id}'" style="cursor: pointer; position: relative;">
                <div class="m-card-icon" style="${p.foto_url ? 'background: transparent; border: none;' : (isEmpresa ? 'background: var(--bg-panel); color: #34d399;' : 'background: var(--bg-panel); color: var(--primary);')} border: ${p.foto_url ? 'none' : '1px solid var(--border)'}; font-size: 16px;">
                    ${visualIcone}
                </div>
                <div class="m-card-content">
                    <div class="m-card-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="display: block; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nomeExibicao}</span>
                        ${whatsAppBtn}
                    </div>
                    <div style="margin-top: 2px;">
                        ${papeisHtml}
                    </div>
                    ${documento}
                </div>
            </div>`;
        });

        container.innerHTML = html;
    }

    function filtrarLista() {
        const input = document.getElementById('mSearchInput');
        const selectTipo = document.getElementById('mFilterTipo');
        const selectSort = document.getElementById('mSortOrder');
        const selectPapel = document.getElementById('mFilterPapel');
        const chkOutros = document.getElementById('mShowOutros');
        
        const termo = (input ? input.value.toLowerCase().trim() : '');
        const tipo = selectTipo ? selectTipo.value : '';
        const sort = selectSort ? selectSort.value : 'nome_az';
        const papel = selectPapel ? selectPapel.value : '';
        const showOutros = chkOutros ? chkOutros.checked : false;

        // Filter
        let filtrados = allPessoas.filter(p => {
            const nome = (p.nome_completo || '').toLowerCase();
            const doc = (p.cpf_cnpj || '').toLowerCase();
            const matchTermo = termo === '' || nome.includes(termo) || doc.includes(termo);
            const matchTipo = tipo === '' || p.tipo_pessoa === tipo;
            
            // Lógica de "Papel"
            let matchPapel = true;
            if (papel !== '') {
                matchPapel = p.papeis && p.papeis.includes(papel);
            }

            // Lógica de "Outros" (exclui Efetivos e Proponentes se marcado)
            let matchOutros = true;
            if (showOutros) {
                const temEfetivo = p.papeis && p.papeis.includes('Associado Efetivo');
                const temProponente = p.papeis && p.papeis.includes('Associado Proponente');
                if (temEfetivo || temProponente) {
                    matchOutros = false;
                }
            }

            return matchTermo && matchTipo && matchPapel && matchOutros;
        });

        // Sort
        filtrados.sort((a, b) => {
            if (sort === 'recentes') {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA; // Descending
            } else if (sort === 'nome_za') {
                return (b.nome_completo || '').localeCompare(a.nome_completo || '');
            } else {
                return (a.nome_completo || '').localeCompare(b.nome_completo || '');
            }
        });

        renderizarLista(filtrados);
    }
})();
