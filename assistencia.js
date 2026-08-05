// ==========================================
// MÓDULO: ASSISTÊNCIA SOCIAL
// ==========================================

window.carregarAppAssistencia = async function() {
    const abaApps = document.getElementById('abaApps');
    
    abaApps.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div>
                <h2 style="color: var(--text-main); margin: 0; font-size: 24px;">Assistência Social (Cestas Básicas)</h2>
                <p style="color: var(--text-muted); margin: 4px 0 0 0; font-size: 14px;">Gestão de Famílias, Estoque e Planejamento de Entregas</p>
            </div>
        </div>

        <div style="background: var(--bg-panel); border-radius: 12px; border: 1px solid var(--border); overflow: hidden;">
            
            <!-- Menu Interno do App -->
            <div style="display: flex; gap: 8px; padding: 16px; border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none;">
                <button onclick="mudarAbaAssistencia('dashboard')" id="btnAssDashboard" class="btn" style="white-space: nowrap; border-radius: 8px;">📊 Dashboard</button>
                <button onclick="mudarAbaAssistencia('familias')" id="btnAssFamilias" class="btn" style="white-space: nowrap; border-radius: 8px;">👨‍👩‍👧‍👦 Famílias</button>
                <button onclick="mudarAbaAssistencia('cestas')" id="btnAssCestas" class="btn" style="white-space: nowrap; border-radius: 8px;">📦 Cestas & Itens</button>
                <button onclick="mudarAbaAssistencia('entregas')" id="btnAssEntregas" class="btn" style="white-space: nowrap; border-radius: 8px;">🚚 Entregas & Metas</button>
                <button onclick="mudarAbaAssistencia('ocorrencias')" id="btnAssOcorrencias" class="btn" style="white-space: nowrap; border-radius: 8px;">📋 Ocorrências</button>
            </div>

            <!-- Conteúdo das Abas -->
            <div style="padding: 24px; min-height: 400px;">
                
                <!-- Aba Dashboard -->
                <div id="assDashboard" class="ass-tab-content" style="display: none;">
                    <div id="assDashboardContainer">
                        <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                            Carregando indicadores...
                        </div>
                    </div>
                </div>

                <!-- Aba Famílias -->
                <div id="assFamilias" class="ass-tab-content" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: var(--text-main); margin: 0;">Cadastro de Famílias</h3>
                        <button class="btn btn-primary" onclick="abrirModalNovaFamilia()" style="border-radius: 8px; font-weight: 500;">+ Nova Família</button>
                    </div>
                    <div id="assFamiliasLista"></div>
                </div>

                <!-- Aba Cestas -->
                <div id="assCestas" class="ass-tab-content" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: var(--text-main); margin: 0;">Tipos de Cestas e Itens</h3>
                        <div>
                            <button class="btn" onclick="abrirModalNovoItem()" style="border-radius: 8px; margin-right: 8px;">+ Novo Item (Estoque)</button>
                            <button class="btn btn-primary" onclick="abrirModalNovaCesta()" style="border-radius: 8px; font-weight: 500;">+ Novo Modelo de Cesta</button>
                        </div>
                    </div>
                    <div id="assCestasLista"></div>
                </div>

                <!-- Aba Entregas -->
                <div id="assEntregas" class="ass-tab-content" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: var(--text-main); margin: 0;">Registro de Entregas Realizadas</h3>
                        <button class="btn btn-primary" onclick="abrirModalNovaEntrega()" style="border-radius: 8px; font-weight: 500;">+ Registrar Entrega (Baixa)</button>
                    </div>
                    <div id="assEntregasLista"></div>
                </div>

                <!-- Aba Ocorrências -->
                <div id="assOcorrencias" class="ass-tab-content" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: var(--text-main); margin: 0;">Ocorrências e Acompanhamento</h3>
                        <button class="btn btn-primary" onclick="abrirModalNovaOcorrencia()" style="border-radius: 8px; font-weight: 500;">+ Registrar Ocorrência</button>
                    </div>
                    <div id="assOcorrenciasLista"></div>
                </div>

            </div>
        </div>
    `;

    // Inicializa na primeira aba
    window.mudarAbaAssistencia('dashboard');
};

// Controle de abas internas
window.mudarAbaAssistencia = function(aba) {
    const abas = ['dashboard', 'familias', 'cestas', 'entregas', 'ocorrencias'];
    
    abas.forEach(a => {
        // Esconder conteúdo
        const el = document.getElementById('ass' + a.charAt(0).toUpperCase() + a.slice(1));
        if (el) el.style.display = 'none';
        
        // Resetar botões
        const btn = document.getElementById('btnAss' + a.charAt(0).toUpperCase() + a.slice(1));
        if (btn) {
            btn.classList.remove('btn-primary');
            btn.style.fontWeight = 'normal';
            btn.style.color = 'var(--text-main)';
            btn.style.background = 'transparent';
        }
    });

    // Ativar a selecionada
    const elAtiva = document.getElementById('ass' + aba.charAt(0).toUpperCase() + aba.slice(1));
    if (elAtiva) elAtiva.style.display = 'block';

    const btnAtivo = document.getElementById('btnAss' + aba.charAt(0).toUpperCase() + aba.slice(1));
    if (btnAtivo) {
        btnAtivo.classList.add('btn-primary');
        btnAtivo.style.fontWeight = 'bold';
        btnAtivo.style.color = 'white';
        btnAtivo.style.background = 'var(--primary)';
    }

    // Disparar carregamento de dados conforme a aba
    if (aba === 'dashboard') carregarDashboardAssistencia();
    if (aba === 'familias') carregarListaFamilias();
    if (aba === 'cestas') carregarListaCestas();
    if (aba === 'entregas') carregarListaEntregas();
    if (aba === 'ocorrencias') carregarListaOcorrencias();
};

// ==========================================
// FUNÇÕES DE CARREGAMENTO (STUBS)
// ==========================================

async function carregarDashboardAssistencia() {
    const container = document.getElementById('assDashboardContainer');
    container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Construindo Dashboard... (Sem dados no banco ainda)</div>';
}

async function carregarListaFamilias() {
    const container = document.getElementById('assFamiliasLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Nenhuma família cadastrada.</div>';
}

async function carregarListaCestas() {
    const container = document.getElementById('assCestasLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Carregando catálogo...</div>';

    try {
        // Fetch Itens
        const resItens = await db.from('ass_itens_cesta').select('*').order('descricao');
        if (resItens.error) throw resItens.error;
        const itens = resItens.data;

        // Fetch Cestas e suas composições
        const resCestas = await db.from('ass_cestas_modelos').select(`
            *,
            ass_cesta_composicao (
                quantidade,
                ass_itens_cesta ( id, codigo, descricao, unidade )
            )
        `).order('tipo');
        if (resCestas.error) throw resCestas.error;
        const cestas = resCestas.data;

        // Guarda globalmente os itens para o modal de composição de cesta
        window.assItensGlobais = itens;

        let html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">
                
                <!-- Coluna de Itens (Catálogo) -->
                <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                    <h4 style="color: var(--text-main); margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Catálogo de Produtos (Estoque)</h4>
                    ${itens.length === 0 ? '<p style="color:var(--text-muted); font-size:13px;">Nenhum item cadastrado.</p>' : `
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 12px;">
                                        <th style="padding: 8px 4px;">Cód</th>
                                        <th style="padding: 8px 4px;">Descrição</th>
                                        <th style="padding: 8px 4px;">Unidade</th>
                                        <th style="padding: 8px 4px;">Peso (kg)</th>
                                        <th style="padding: 8px 4px;">Status</th>
                                        <th style="padding: 8px 4px;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itens.map(i => `
                                        <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
                                            <td style="padding: 8px 4px; color: #60a5fa;">${i.codigo}</td>
                                            <td style="padding: 8px 4px; color: var(--text-main); font-weight: 500;">${i.descricao}</td>
                                            <td style="padding: 8px 4px; color: var(--text-muted);">${i.unidade}</td>
                                            <td style="padding: 8px 4px; color: var(--text-muted);">${i.peso_kg || '-'}</td>
                                            <td style="padding: 8px 4px;">
                                                <span style="background: ${i.status === 'Ativo' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${i.status === 'Ativo' ? '#10b981' : '#ef4444'}; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                                                    ${i.status}
                                                </span>
                                            </td>
                                            <td style="padding: 8px 4px; text-align: right;">
                                                <button onclick="excluirItemAss('${i.id}')" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Excluir">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>

                <!-- Coluna de Cestas (Modelos) -->
                <div>
                    <h4 style="color: var(--text-main); margin-top: 0; margin-bottom: 16px;">Modelos de Cestas</h4>
                    ${cestas.length === 0 ? '<p style="color:var(--text-muted); font-size:13px;">Nenhum modelo cadastrado.</p>' : 
                        cestas.map(c => `
                            <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <h5 style="color: var(--primary); margin: 0; font-size: 16px;">${c.tipo}</h5>
                                            <span style="background: #334155; color: #cbd5e1; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${c.codigo}</span>
                                        </div>
                                        <p style="color: var(--text-muted); font-size: 13px; margin: 4px 0 0 0;">${c.descricao}</p>
                                    </div>
                                    <button onclick="excluirCestaAss('${c.id}')" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Excluir Cesta">🗑️</button>
                                </div>
                                
                                <div style="background: rgba(0,0,0,0.1); border-radius: 6px; padding: 12px;">
                                    <h6 style="color: var(--text-muted); margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Composição:</h6>
                                    ${c.ass_cesta_composicao.length === 0 ? '<span style="font-size:12px; color:var(--text-muted);">Sem itens</span>' : 
                                        c.ass_cesta_composicao.map(comp => `
                                            <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px dashed rgba(255,255,255,0.05); padding: 4px 0;">
                                                <span style="color: var(--text-main);">(${comp.ass_itens_cesta?.codigo || '-'}) ${comp.ass_itens_cesta?.descricao || 'Item deletado'}</span>
                                                <span style="color: var(--text-muted);">${comp.quantidade} ${comp.ass_itens_cesta?.unidade || ''}</span>
                                            </div>
                                        `).join('')
                                    }
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;

        container.innerHTML = html;

    } catch(err) {
        console.error(err);
        container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Erro ao carregar os dados.</div>';
    }
}

async function carregarListaEntregas() {
    const container = document.getElementById('assEntregasLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Nenhuma entrega registrada este mês.</div>';
}

async function carregarListaOcorrencias() {
    const container = document.getElementById('assOcorrenciasLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Nenhuma ocorrência registrada.</div>';
}

// ==========================================
// FUNÇÕES DE MODAIS 
// ==========================================

window.abrirModalNovoItem = function() {
    // Inject modal se não existir
    if(!document.getElementById('modalNovoItemAss')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modalNovoItemAss" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">
                <div class="modal-content" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 400px;">
                    <h3 style="margin-top: 0; color: var(--text-main);">Novo Item (Estoque)</h3>
                    <form id="formNovoItemAss" onsubmit="salvarNovoItemAss(event)">
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Código Único (Ex: IC1)</label>
                            <input type="text" id="assItemCodigo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Descrição (Ex: Arroz 5kg)</label>
                            <input type="text" id="assItemDescricao" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                        </div>
                        <div style="margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Unidade</label>
                                <input type="text" id="assItemUnidade" class="form-control" required placeholder="Ex: pacote, lata" style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Peso Bruto (kg)</label>
                                <input type="number" step="0.01" id="assItemPeso" class="form-control" placeholder="Ex: 5" style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn" onclick="document.getElementById('modalNovoItemAss').style.display='none'">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Item</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }
    document.getElementById('formNovoItemAss').reset();
    document.getElementById('modalNovoItemAss').style.display = 'flex';
};

window.salvarNovoItemAss = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const payload = {
            codigo: document.getElementById('assItemCodigo').value.trim(),
            descricao: document.getElementById('assItemDescricao').value.trim(),
            unidade: document.getElementById('assItemUnidade').value.trim(),
            peso_kg: document.getElementById('assItemPeso').value ? parseFloat(document.getElementById('assItemPeso').value) : null
        };
        const { error } = await db.from('ass_itens_cesta').insert(payload);
        if (error) throw error;
        
        document.getElementById('modalNovoItemAss').style.display = 'none';
        carregarListaCestas();
    } catch(err) {
        console.error(err);
        alert('Erro ao salvar item. O código já existe?');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Item';
    }
};

window.excluirItemAss = async function(id) {
    if(!confirm("Tem certeza que deseja excluir este item? Ele será removido de todas as composições de cestas.")) return;
    try {
        const { error } = await db.from('ass_itens_cesta').delete().eq('id', id);
        if (error) throw error;
        carregarListaCestas();
    } catch(err) {
        console.error(err);
        alert('Erro ao excluir item.');
    }
};

window.abrirModalNovaCesta = function() {
    if(!window.assItensGlobais || window.assItensGlobais.length === 0) {
        alert("Cadastre pelo menos um item no catálogo primeiro!");
        return;
    }

    if(!document.getElementById('modalNovaCestaAss')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modalNovaCestaAss" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">
                <div class="modal-content" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 500px;">
                    <h3 style="margin-top: 0; color: var(--text-main);">Novo Modelo de Cesta</h3>
                    <form id="formNovaCestaAss" onsubmit="salvarNovaCestaAss(event)">
                        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Código (Ex: CB1)</label>
                                <input type="text" id="assCestaCodigo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Tipo (Ex: Pequena, Grande)</label>
                                <input type="text" id="assCestaTipo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Descrição detalhada</label>
                            <input type="text" id="assCestaDescricao" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                        </div>
                        
                        <div style="margin-bottom: 8px; border-top: 1px solid var(--border); padding-top: 16px;">
                            <label style="display: block; color: var(--text-main); font-weight: 500; margin-bottom: 8px;">Composição da Cesta (Itens)</label>
                            <div id="assCestaComposicaoContainer" style="max-height: 200px; overflow-y: auto; background: var(--bg-body); border: 1px solid var(--border); border-radius: 6px; padding: 12px;">
                                <!-- Items rendered dynamically -->
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn" onclick="document.getElementById('modalNovaCestaAss').style.display='none'">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Cesta</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }
    
    // Render checkboxes for composition
    const compContainer = document.getElementById('assCestaComposicaoContainer');
    compContainer.innerHTML = window.assItensGlobais.map(i => `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
            <label style="display: flex; align-items: center; gap: 8px; color: var(--text-main); font-size: 13px; cursor: pointer;">
                <input type="checkbox" class="ass-cesta-item-cb" value="${i.id}" onchange="toggleCestaQtd(this, '${i.id}')">
                (${i.codigo}) ${i.descricao} <span style="color:var(--text-muted); font-size: 11px;">(${i.unidade})</span>
            </label>
            <input type="number" id="qtd_${i.id}" value="1" min="1" step="1" style="width: 60px; background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main); padding: 4px; border-radius: 4px; display: none;">
        </div>
    `).join('');

    document.getElementById('formNovaCestaAss').reset();
    document.getElementById('modalNovaCestaAss').style.display = 'flex';
};

window.toggleCestaQtd = function(cb, id) {
    const ipt = document.getElementById('qtd_' + id);
    if(cb.checked) { ipt.style.display = 'block'; } else { ipt.style.display = 'none'; }
};

window.salvarNovaCestaAss = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const payloadCesta = {
            codigo: document.getElementById('assCestaCodigo').value.trim(),
            tipo: document.getElementById('assCestaTipo').value.trim(),
            descricao: document.getElementById('assCestaDescricao').value.trim()
        };
        
        // Insert Cesta
        const { data: cestaData, error: cestaError } = await db.from('ass_cestas_modelos').insert(payloadCesta).select('id').single();
        if (cestaError) throw cestaError;
        
        const cestaId = cestaData.id;

        // Montar composicao
        const composicoes = [];
        document.querySelectorAll('.ass-cesta-item-cb:checked').forEach(cb => {
            const itemId = cb.value;
            const qtd = document.getElementById('qtd_' + itemId).value;
            composicoes.push({
                cesta_id: cestaId,
                item_id: itemId,
                quantidade: parseInt(qtd) || 1
            });
        });

        // Insert composicao
        if (composicoes.length > 0) {
            const { error: compError } = await db.from('ass_cesta_composicao').insert(composicoes);
            if (compError) throw compError;
        }
        
        document.getElementById('modalNovaCestaAss').style.display = 'none';
        carregarListaCestas();
    } catch(err) {
        console.error(err);
        alert('Erro ao salvar cesta. Verifique se o código já existe.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Cesta';
    }
};

window.excluirCestaAss = async function(id) {
    if(!confirm("Tem certeza que deseja excluir este modelo de cesta? Isso apagará sua composição também.")) return;
    try {
        const { error } = await db.from('ass_cestas_modelos').delete().eq('id', id);
        if (error) throw error;
        carregarListaCestas();
    } catch(err) {
        console.error(err);
        alert('Erro ao excluir cesta. Pode estar vinculada a uma entrega.');
    }
};

window.abrirModalNovaFamilia = function() { alert('Modal Nova Família em breve!'); };
window.abrirModalNovaEntrega = function() { alert('Modal Nova Entrega em breve!'); };
window.abrirModalNovaOcorrencia = function() { alert('Modal Nova Ocorrência em breve!'); };
