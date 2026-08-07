(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let allFamilias = [];
    let hubId = null;
    let autoFamiliaId = null;

    document.addEventListener('DOMContentLoaded', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        hubId = urlParams.get('id');
        autoFamiliaId = urlParams.get('familia_id');

        document.getElementById('btnVoltarHub').addEventListener('click', () => {
            if (hubId) window.location.href = 'm_hub.html?id=' + hubId;
            else window.location.href = 'm_atividades.html';
        });

        setupTypeButtons();
        setupAutocomplete();
        
        document.getElementById('btnSalvar').addEventListener('click', salvarRegistro);

        await carregarFamiliasBase();
        
        if (autoFamiliaId && allFamilias.length > 0) {
            const f = allFamilias.find(x => x.id == autoFamiliaId);
            if (f) {
                document.getElementById('inpBuscaFam').value = `[${f.codigo || 'S/C'}] ${f.nome_familia}`;
                document.getElementById('hdnFamId').value = f.id;
                document.getElementById('btnSalvar').disabled = false;
            }
        }
        
        await carregarHistoricoHoje();
    });

    async function carregarFamiliasBase() {
        try {
            const { data, error } = await db.from('ass_familias').select('id, nome_familia, codigo').order('nome_familia');
            if (!error && data) {
                allFamilias = data;
            }
        } catch (e) {
            console.error('Erro ao carregar lista de famílias', e);
        }
    }

    function setupTypeButtons() {
        const btns = document.querySelectorAll('.m-type-btn');
        const hdn = document.getElementById('hdnTipoOco');
        
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                hdn.value = btn.getAttribute('data-type');
            });
        });
    }

    function setupAutocomplete() {
        const inp = document.getElementById('inpBuscaFam');
        const res = document.getElementById('autocompleteResults');
        const hdnId = document.getElementById('hdnFamId');
        const btnSalvar = document.getElementById('btnSalvar');

        // Fecha ao clicar fora
        document.addEventListener('click', (e) => {
            if (e.target !== inp && !res.contains(e.target)) {
                res.style.display = 'none';
            }
        });

        inp.addEventListener('input', () => {
            hdnId.value = ''; // Reset ID on type
            btnSalvar.disabled = true;
            
            const q = inp.value.toLowerCase().trim();
            if (q.length < 2) {
                res.style.display = 'none';
                return;
            }
            
            const matches = allFamilias.filter(f => 
                (f.nome_familia && f.nome_familia.toLowerCase().includes(q)) || 
                (f.codigo && f.codigo.toLowerCase().includes(q))
            ).slice(0, 10); // Limita a 10 resultados para nao travar a tela
            
            if (matches.length > 0) {
                res.innerHTML = matches.map(f => `
                    <div class="m-autocomplete-item" data-id="${f.id}" data-nome="${f.nome_familia}" data-cod="${f.codigo || 'S/C'}">
                        <span class="m-fam-sel-codigo">${f.codigo || 'S/C'}</span> ${f.nome_familia}
                    </div>
                `).join('');
                res.style.display = 'block';
                
                // Add click listeners
                document.querySelectorAll('.m-autocomplete-item').forEach(item => {
                    item.addEventListener('click', () => {
                        inp.value = `[${item.getAttribute('data-cod')}] ${item.getAttribute('data-nome')}`;
                        hdnId.value = item.getAttribute('data-id');
                        res.style.display = 'none';
                        btnSalvar.disabled = false;
                    });
                });
            } else {
                res.innerHTML = '<div class="m-autocomplete-item" style="color:var(--text-muted);">Nenhuma família encontrada</div>';
                res.style.display = 'block';
            }
        });
    }

    async function salvarRegistro() {
        const familia_id = document.getElementById('hdnFamId').value;
        const tipo_ocorrencia = document.getElementById('hdnTipoOco').value;
        const observacoes = document.getElementById('inpObs').value.trim();
        const btnSalvar = document.getElementById('btnSalvar');
        
        if (!familia_id) return;
        
        btnSalvar.disabled = true;
        btnSalvar.innerText = 'Salvando...';
        
        try {
            const data_ocorrencia = new Date().toISOString().split('T')[0];
            const payload = {
                familia_id,
                tipo_ocorrencia,
                data_ocorrencia,
                observacoes: observacoes || null
            };
            
            const { error } = await db.from('ass_ocorrencias').insert([payload]);
            if (error) throw error;
            
            const fb = document.getElementById('mFeedback');
            fb.innerText = 'Registro salvo com sucesso!';
            fb.style.color = '#10b981';
            
            setTimeout(() => {
                fb.innerText = '';
            }, 3000);
            
            // Limpa form para o próximo
            document.getElementById('inpBuscaFam').value = '';
            document.getElementById('hdnFamId').value = '';
            document.getElementById('inpObs').value = '';
            btnSalvar.innerText = 'Salvar Registro';
            
            await carregarHistoricoHoje();
            
        } catch (e) {
            console.error('Erro ao salvar', e);
            const fb = document.getElementById('mFeedback');
            fb.innerText = 'Erro ao salvar. Verifique conexão.';
            fb.style.color = '#ef4444';
            btnSalvar.disabled = false;
            btnSalvar.innerText = 'Tentar Novamente';
        }
    }

    async function carregarHistoricoHoje() {
        const list = document.getElementById('mHistoryList');
        try {
            const hojeIso = new Date().toISOString().split('T')[0];
            
            // Limit 20 para evitar listão gigante
            const { data, error } = await db
                .from('ass_ocorrencias')
                .select(`
                    id, 
                    tipo_ocorrencia, 
                    data_ocorrencia,
                    ass_familias ( nome_familia, codigo )
                `)
                .eq('data_ocorrencia', hojeIso)
                .order('id', { ascending: false })
                .limit(20);
                
            if (error) throw error;
            
            if (!data || data.length === 0) {
                list.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">Nenhum registro feito hoje.</div>';
                return;
            }
            
            list.innerHTML = data.map(o => {
                const fam = o.ass_familias || {};
                const nome = fam.nome_familia || 'Desconhecida';
                const cod = fam.codigo || 'S/C';
                
                let icon = '📝';
                if (o.tipo_ocorrencia === 'Cesta Entregue') icon = '📦';
                if (o.tipo_ocorrencia === 'Falta') icon = '❌';
                if (o.tipo_ocorrencia === 'Visita Realizada') icon = '🤝';
                
                return `
                    <div class="m-history-item">
                        <div>
                            <div class="m-hist-fam">${icon} [${cod}] ${nome}</div>
                            <div class="m-hist-type">${o.tipo_ocorrencia}</div>
                        </div>
                        <div class="m-hist-date">${o.data_ocorrencia.split('-').reverse().join('/')}</div>
                    </div>
                `;
            }).join('');
            
        } catch (e) {
            console.error('Erro ao carregar histórico', e);
            list.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 13px;">Erro ao carregar histórico.</div>';
        }
    }

})();
