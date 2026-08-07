(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let allFamilias = [];
    let currentFilter = 'Todas';
    let hubId = null;
    let selectedFamilia = null;

    document.addEventListener('DOMContentLoaded', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        hubId = urlParams.get('id');

        document.getElementById('btnVoltarHub').addEventListener('click', () => {
            if (hubId) window.location.href = 'm_hub.html?id=' + hubId;
            else window.location.href = 'm_atividades.html';
        });

        document.getElementById('mSearchInput').addEventListener('input', filtrarLista);
        
        // Setup Pills
        document.querySelectorAll('.m-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.m-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentFilter = pill.getAttribute('data-filter');
                filtrarLista();
            });
        });
        
        // Permissões
        if (typeof window.podeEditarAssistidas === 'function' && window.podeEditarAssistidas()) {
            document.getElementById('btnNovaFamilia').style.display = 'flex';
            document.getElementById('btnEditFamilia').style.display = 'block';
            
            document.getElementById('btnNovaFamilia').addEventListener('click', abrirFormularioNova);
            document.getElementById('btnEditFamilia').addEventListener('click', () => abrirFormularioEdicao(selectedFamilia));
            document.getElementById('btnSalvarFamilia').addEventListener('click', salvarFamilia);
        }

        document.getElementById('btnVerHistorico').addEventListener('click', abrirHistorico);
        
        document.getElementById('btnIrParaEntrega').addEventListener('click', () => {
            if (selectedFamilia && selectedFamilia.id) {
                let url = 'm_ass_entregas.html?familia_id=' + selectedFamilia.id;
                if (hubId) url += '&id=' + hubId;
                window.location.href = url;
            }
        });

        await carregarFamilias();
    });

    async function carregarFamilias() {
        document.getElementById('mLoadingState').style.display = 'block';

        try {
            const { data, error } = await db.from('ass_familias').select('*').order('nome_familia');
            if (error) throw error;
            
            allFamilias = data || [];
            filtrarLista();

            document.getElementById('mLoadingState').style.display = 'none';
        } catch (e) {
            console.error('Erro:', e);
            document.getElementById('mLoadingState').innerText = 'Erro ao carregar famílias.';
        }
    }

    function filtrarLista() {
        const query = (document.getElementById('mSearchInput').value || '').toLowerCase();
        
        const filtrados = allFamilias.filter(f => {
            // Busca por texto
            const nomeStr = (f.nome_familia || '').toLowerCase();
            const codStr = (f.codigo || '').toLowerCase();
            const matchTexto = nomeStr.includes(query) || codStr.includes(query);
            
            // Filtro Pill
            let matchPill = true;
            if (currentFilter !== 'Todas') {
                matchPill = (f.status === currentFilter);
            }
            
            return matchTexto && matchPill;
        });

        renderizar(filtrados);
    }

    function renderizar(dados) {
        const container = document.getElementById('mFamList');
        container.innerHTML = '';
        
        if (dados.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma família encontrada.</div>';
            return;
        }

        dados.forEach(f => {
            const card = document.createElement('div');
            card.className = 'm-fam-card';
            
            const bairroStr = f.endereco_bairro ? f.endereco_bairro : 'Bairro ñ info';

            card.innerHTML = `
                <div class="m-fam-header">
                    <div class="m-fam-name">${f.nome_familia || 'Sem Nome'}</div>
                    <div class="m-fam-status status-${f.status || 'Ativa'}">${f.status || 'Ativa'}</div>
                </div>
                <div class="m-fam-info">
                    <span class="m-fam-code">${f.codigo || 'S/C'}</span>
                    <span>${bairroStr}</span>
                </div>
            `;
            
            card.addEventListener('click', () => abrirDetalhes(f));
            container.appendChild(card);
        });
    }

    function formatarWhatsApp(numero) {
        if (!numero) return '';
        let n = numero.replace(/\D/g, '');
        if (n.length === 10 || n.length === 11) {
            return '55' + n;
        }
        return n;
    }

    async function abrirDetalhes(f) {
        selectedFamilia = f;
        document.getElementById('mdNome').innerText = 'Família ' + (f.codigo || '');
        document.getElementById('mdResp').innerText = f.nome_familia || '-';
        document.getElementById('mdCodigo').innerText = f.codigo || '-';
        document.getElementById('mdStatus').innerText = f.status || 'Ativa';
        
        // Contato
        const btnZap = document.getElementById('btnWhatsApp');
        if (f.telefone) {
            btnZap.style.display = 'flex';
            btnZap.href = 'https://wa.me/' + formatarWhatsApp(f.telefone);
        } else {
            btnZap.style.display = 'none';
        }

        // Endereço
        let endCompleto = '';
        if (f.endereco_logradouro) endCompleto += f.endereco_logradouro;
        if (f.endereco_numero) endCompleto += ', ' + f.endereco_numero;
        if (f.endereco_bairro) endCompleto += ' - ' + f.endereco_bairro;
        
        document.getElementById('mdEndereco').innerText = endCompleto || 'Não informado';
        
        const btnMaps = document.getElementById('btnGoogleMaps');
        if (endCompleto) {
            btnMaps.style.display = 'flex';
            const endBusca = encodeURIComponent(endCompleto + ' Ponta Grossa PR');
            btnMaps.href = 'https://www.google.com/maps/search/?api=1&query=' + endBusca;
        } else {
            btnMaps.style.display = 'none';
        }

        document.getElementById('mDetModal').classList.add('active');
        
        // Buscar Membros (Assíncrono)
        const ml = document.getElementById('mdMembrosList');
        ml.innerHTML = 'Buscando membros...';
        try {
            const { data: membros, error } = await db.from('ass_membros_familia')
                .select('nome, parentesco, data_nascimento')
                .eq('familia_id', f.id)
                .order('nome');
                
            if (error) throw error;
            if (!membros || membros.length === 0) {
                ml.innerHTML = 'Nenhum membro cadastrado.';
            } else {
                ml.innerHTML = membros.map(m => {
                    let idadeStr = '';
                    if (m.data_nascimento) {
                        const age = new Date().getFullYear() - new Date(m.data_nascimento).getFullYear();
                        idadeStr = `(${age} anos)`;
                    }
                    return `
                        <div class="m-member-row">
                            <span style="color:var(--text-main); font-weight:500;">${m.nome}</span>
                            <span>${m.parentesco || ''} ${idadeStr}</span>
                        </div>
                    `;
                }).join('');
            }
        } catch (e) {
            ml.innerHTML = 'Erro ao buscar membros.';
        }
    }
    
    async function abrirHistorico() {
        if (!selectedFamilia) return;
        document.getElementById('mHistoryModal').classList.add('active');
        const hc = document.getElementById('mHistoryContent');
        hc.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Buscando histórico...</div>';
        
        try {
            const { data, error } = await db.from('ass_ocorrencias')
                .select('*')
                .eq('familia_id', selectedFamilia.id)
                .order('data_ocorrencia', { ascending: false });
                
            if (error) throw error;
            
            if (!data || data.length === 0) {
                hc.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Nenhuma ocorrência registrada.</div>';
                return;
            }
            
            hc.innerHTML = data.map(o => {
                const dateParts = o.data_ocorrencia.split('-');
                const brDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : o.data_ocorrencia;
                const obs = o.observacoes ? `<div class="m-history-obs">"${o.observacoes}"</div>` : '';
                return `
                    <div class="m-history-row">
                        <div class="m-history-date">${brDate}</div>
                        <div class="m-history-type">${o.tipo_ocorrencia}</div>
                        ${obs}
                    </div>
                `;
            }).join('');
        } catch(e) {
            hc.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Erro ao carregar.</div>';
        }
    }

    // --- FORMULÁRIO CRUD ---
    function abrirFormularioNova() {
        document.getElementById('mFormTitle').innerText = 'Nova Família';
        document.getElementById('fId').value = '';
        document.getElementById('fNome').value = '';
        document.getElementById('fCodigo').value = '';
        document.getElementById('fTel').value = '';
        document.getElementById('fStatus').value = 'Ativa';
        document.getElementById('fRua').value = '';
        document.getElementById('fNum').value = '';
        document.getElementById('fBairro').value = '';
        
        document.getElementById('mFormModal').classList.add('active');
    }
    
    function abrirFormularioEdicao(f) {
        if (!f) return;
        document.getElementById('mFormTitle').innerText = 'Editar Família';
        document.getElementById('fId').value = f.id;
        document.getElementById('fNome').value = f.nome_familia || '';
        document.getElementById('fCodigo').value = f.codigo || '';
        document.getElementById('fTel').value = f.telefone || '';
        document.getElementById('fStatus').value = f.status || 'Ativa';
        document.getElementById('fRua').value = f.endereco_logradouro || '';
        document.getElementById('fNum').value = f.endereco_numero || '';
        document.getElementById('fBairro').value = f.endereco_bairro || '';
        
        document.getElementById('mFormModal').classList.add('active');
    }
    
    window.fecharFormulario = function() {
        document.getElementById('mFormModal').classList.remove('active');
    };
    
    async function salvarFamilia() {
        const id = document.getElementById('fId').value;
        const payload = {
            nome_familia: document.getElementById('fNome').value.trim(),
            codigo: document.getElementById('fCodigo').value.trim() || null,
            telefone: document.getElementById('fTel').value.trim() || null,
            status: document.getElementById('fStatus').value,
            endereco_logradouro: document.getElementById('fRua').value.trim() || null,
            endereco_numero: document.getElementById('fNum').value.trim() || null,
            endereco_bairro: document.getElementById('fBairro').value.trim() || null
        };
        
        if (!payload.nome_familia) {
            alert('O nome do responsável é obrigatório.');
            return;
        }
        
        const btn = document.getElementById('btnSalvarFamilia');
        btn.innerText = '...';
        btn.disabled = true;
        
        try {
            if (id) {
                // Update
                const { error } = await db.from('ass_familias').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await db.from('ass_familias').insert([payload]);
                if (error) throw error;
            }
            
            window.fecharFormulario();
            // Se estava editando, fecha o painel de detalhes tbm pra forçar refresh
            if (id) document.getElementById('mDetModal').classList.remove('active');
            
            await carregarFamilias();
        } catch(e) {
            console.error(e);
            alert('Erro ao salvar família.');
        } finally {
            btn.innerText = 'Salvar';
            btn.disabled = false;
        }
    }

})();
