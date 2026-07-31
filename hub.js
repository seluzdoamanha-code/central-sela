const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const estruturaId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!estruturaId) {
        alert("ID da estrutura não fornecido!");
        window.location.href = 'entidade.html';
        return;
    }

    await carregarDadosEstrutura();
    configurarAbas();
    
    // Iniciar Aba de Equipe
    await carregarEquipe();
    
    // Iniciar Aba de Documentos & Projetos
    await carregarProjetosProcessos();
    await carregarDocumentos();
    await popularSelectDepartamentos();
    
    // Formulario de Documentos
    document.getElementById('formDoc').addEventListener('submit', salvarDocumento);
    
    // Formulario de Projetos
    const formProj = document.getElementById('formProjeto');
    if(formProj) formProj.addEventListener('submit', salvarProjeto);
    
    // Iniciar Aba de Agenda
    await carregarAgenda();
    document.getElementById('formEvento').addEventListener('submit', salvarEvento);
});

async function carregarDadosEstrutura() {
    try {
        const { data, error } = await db.from('estruturas').select('*').eq('id', estruturaId).single();
        if (error) throw error;
        
        if (data) {
            document.getElementById('hubName').textContent = data.nome;
            document.getElementById('hubType').textContent = data.tipo;
            
            // Configuração Dinâmica de Abas
            let config = data.abas_config;
            
            const nomeStr = (data.nome || '').toLowerCase();
            const isIrradiacao = nomeStr.includes('irradi') || nomeStr.includes('irradia');
            
            if (!config || Object.keys(config).length === 0) {
                // Regras default se não houver config salva
                config = {
                    equipe: true,
                    agenda: true,
                    projetos: !['Família', 'Atividade', 'Turma'].includes(data.tipo),
                    documentos: true,
                    apps: isIrradiacao
                };
            } else if (isIrradiacao) {
                // Forçar habilitar apps se for Irradiação, mesmo que a config default do banco diga false
                config.apps = true;
            }
            
            // Ocultar Abas desativadas
            if (!config.equipe) document.querySelector('[data-target="abaEquipe"]').style.display = 'none';
            if (!config.agenda) document.querySelector('[data-target="abaAgenda"]').style.display = 'none';
            if (!config.projetos) document.querySelector('[data-target="abaProjetosProcessos"]').style.display = 'none';
            if (!config.documentos) document.querySelector('[data-target="abaDocumentos"]').style.display = 'none';
            
            if (config.apps) {
                const btnApps = document.querySelector('[data-target="abaApps"]');
                if(btnApps) btnApps.style.display = 'block';
                if (isIrradiacao) {
                    carregarAppIrradiacao();
                }
            }
        }
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('hubContent').style.display = 'block';
    } catch (err) {
        console.error("Erro ao carregar estrutura:", err);
        document.getElementById('loadingState').textContent = "Erro ao carregar dados. Verifique sua conexão.";
    }
}

// ==========================================
// MÓDULO DE EQUIPE
// ==========================================
async function carregarEquipe() {
    try {
        const { data, error } = await db
            .from('vinculos_estrutura')
            .select(`
                papel,
                pessoas (nome_completo, papeis, celular, email)
            `)
            .eq('estrutura_id', estruturaId);
            
        if (error) throw error;
        
        const gridLideranca = document.getElementById('gridLideranca');
        const gridMembros = document.getElementById('gridMembros');
        const status = document.getElementById('equipeStatus');
        
        if (!data || data.length === 0) {
            status.textContent = 'Nenhum membro vinculado a este departamento.';
            return;
        }
        
        const tituloGestao = document.getElementById('tituloGestaoPessoas');
        if (tituloGestao) {
            tituloGestao.textContent = `Gestão de Pessoas (${data.length})`;
        }
        
        status.textContent = `${data.length} membro(s) na equipe.`;
        
        let htmlLider = '';
        let htmlMembro = '';
        
        data.forEach(rel => {
            const pessoa = rel.pessoas;
            if (!pessoa) return;
            
            const isLider = rel.papel && (
                rel.papel.toLowerCase().includes('diretor') ||
                rel.papel.toLowerCase().includes('diretora') ||
                rel.papel.toLowerCase().includes('diretoria') ||
                rel.papel.toLowerCase().includes('direção') ||
                rel.papel.toLowerCase().includes('direcao') ||
                rel.papel.toLowerCase().includes('líder') ||
                rel.papel.toLowerCase().includes('lider') ||
                rel.papel.toLowerCase().includes('coordenador') ||
                rel.papel.toLowerCase().includes('coordenadora') ||
                rel.papel.toLowerCase().includes('gerente') ||
                rel.papel.toLowerCase().includes('presidente') ||
                rel.papel.toLowerCase().includes('presidenta')
            );
            
            // Format phone if it exists
            const telefone = pessoa.celular ? `<div style="font-size: 11px; margin-top: 4px; color: var(--text-muted);">📱 ${pessoa.celular}</div>` : '';
            const emailIcon = pessoa.email ? `<div style="font-size: 11px; margin-top: 2px; color: var(--text-muted);">✉️ ${pessoa.email}</div>` : '';
            
            const cardHtml = `
            <div style="background: var(--bg-panel); border: 1px solid ${isLider ? 'var(--primary)' : 'var(--border)'}; border-radius: 8px; padding: 16px; display: flex; flex-direction: column;">
                <div style="font-size: 15px; font-weight: 600; color: var(--text-main);">${pessoa.nome_completo}</div>
                <div style="font-size: 13px; color: var(--primary); margin-top: 4px; font-weight: 500;">${rel.papel || 'Membro'}</div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                    ${telefone}
                    ${emailIcon}
                </div>
                ${pessoa.papeis && pessoa.papeis.length > 0 ? 
                    `<div style="margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap;">
                        ${pessoa.papeis.map(t => `<span style="background: rgba(129, 140, 248, 0.1); color: #818cf8; padding: 2px 8px; border-radius: 12px; font-size: 10px;">${t}</span>`).join('')}
                    </div>` 
                : ''}
            </div>
            `;
            
            if (isLider) htmlLider += cardHtml;
            else htmlMembro += cardHtml;
        });
        
        if (htmlLider) {
            document.getElementById('containerLideranca').style.display = 'block';
            gridLideranca.innerHTML = htmlLider;
        }
        
        if (htmlMembro) {
            document.getElementById('containerMembros').style.display = 'block';
            gridMembros.innerHTML = htmlMembro;
        }
        
    } catch (err) {
        console.error("Erro ao carregar equipe:", err);
        document.getElementById('equipeStatus').textContent = "Erro: " + (err.message || "Falha ao buscar membros no banco de dados.");
    }
}

function configurarAbas() {
    const botoes = document.querySelectorAll('.tab-btn');
    const conteudos = document.querySelectorAll('.tab-content');

    botoes.forEach(btn => {
        btn.addEventListener('click', () => {
            botoes.forEach(b => b.classList.remove('active'));
            conteudos.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // No celular, recolhe o menu após clicar em uma aba
            const tabsNav = document.querySelector('.tabs-nav');
            if (tabsNav) {
                tabsNav.classList.remove('show-mobile');
            }
        });
    });

    // Auto-navegar para aba passada na URL (?id=XXX&tab=abaApps)
    const urlTab = urlParams.get('tab');
    if (urlTab) {
        // Usamos um timeout curto para garantir que outras manipulações (como carregarDadosEstrutura) já renderizaram o botão
        setTimeout(() => {
            const btn = document.querySelector(`[data-target="${urlTab}"]`);
            if (btn && btn.style.display !== 'none') {
                btn.click();
            }
        }, 300);
    }
}

// Assumir o controle do Menu Hambúrguer (Mobile)
window.onMobileMenuClick = () => {
    const tabsNav = document.querySelector('.tabs-nav');
    if (tabsNav) {
        tabsNav.classList.toggle('show-mobile');
    }
};

window.abrirOrganograma = function() {
    window.location.href = `organograma.html?id=${estruturaId}`;
};

// ==========================================
// MÓDULO DE DOCUMENTOS
// ==========================================
let documentosGlobais = [];

window.abrirModalDoc = (id = null) => {
    const modal = document.getElementById('modalDoc');
    document.getElementById('formDoc').reset();
    document.getElementById('inDocId').value = '';
    
    // Popular o select de Projetos
    const selectProj = document.getElementById('inDocProjetoId');
    if (selectProj && typeof projetosGlobais !== 'undefined') {
        selectProj.innerHTML = '<option value="">-- Solto (Nenhum Projeto) --</option>';
        projetosGlobais.forEach(p => {
            selectProj.innerHTML += `<option value="${p.id}">${p.tipo}: ${p.titulo}</option>`;
        });
    }

    if (id) {
        const doc = documentosGlobais.find(d => d.id === id);
        if (doc) {
            document.getElementById('modalDocTitle').textContent = 'Editar Documento';
            document.getElementById('inDocId').value = doc.id;
            document.getElementById('inDocTitulo').value = doc.titulo;
            document.getElementById('inDocTipo').value = doc.tipo;
            if (selectProj && doc.projeto_processo_id) {
                selectProj.value = doc.projeto_processo_id;
            }
            if (doc.tipo === 'Link') {
                document.getElementById('inDocLink').value = doc.conteudo;
            } else {
                document.getElementById('inDocMd').value = doc.conteudo;
            }
        }
    } else {
        document.getElementById('modalDocTitle').textContent = 'Adicionar Documento';
    }
    
    window.toggleDocType();
    modal.classList.add('show');
};

window.fecharModalDoc = () => {
    document.getElementById('modalDoc').classList.remove('show');
};

async function carregarDocumentos() {
    const listLocais = document.getElementById('listDocsLocais');
    const listOficiais = document.getElementById('listDocsOficiais');
    
    listLocais.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    listOficiais.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    
    try {
        // 1. Buscar Documentos Locais (Dono é a estrutura atual)
        const { data: locais, error: errLocais } = await db
            .from('documentos')
            .select('*')
            .eq('estrutura_id', estruturaId);
            
        // 2. Buscar Documentos Herdados (A estrutura atual está na tabela de visibilidade)
        const { data: visibilidade, error: errVis } = await db
            .from('documentos_visibilidade')
            .select('documento_id')
            .eq('estrutura_id', estruturaId);
            
        let herdados = [];
        if (visibilidade && visibilidade.length > 0) {
            const docIds = visibilidade.map(v => v.documento_id);
            const { data: herdadosData } = await db
                .from('documentos')
                .select('*, estruturas(nome)') // traz o nome de quem criou
                .in('id', docIds);
            herdados = herdadosData || [];
        }

        // Filtra para exibir na aba Documentos Gerais apenas os que não tem projeto
        const locaisSoltos = (locais || []).filter(d => !d.projeto_processo_id);
        const herdadosSoltos = herdados.filter(d => !d.projeto_processo_id);

        documentosGlobais = locais || []; // Mantemos todos globais para os Projetos poderem acessá-los
        renderizarDocumentos(locaisSoltos, listLocais, true);
        renderizarDocumentos(herdadosSoltos, listOficiais, false);
        
    } catch (err) {
        console.warn("Erro ao buscar documentos. Tabelas criadas?", err);
        listLocais.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: As tabelas de documentos não foram criadas no Supabase.</div>';
        listOficiais.innerHTML = '';
    }
}

function renderizarDocumentos(docs, container, isLocal) {
    if (!docs || docs.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">Nenhum documento encontrado.</div>`;
        return;
    }
    
    let html = '';
    docs.forEach(doc => {
        const icon = doc.tipo === 'Link' ? '🔗' : '📝';
        const dono = isLocal ? 'Criado por nós' : `📌 Oficial de: ${doc.estruturas?.nome || 'Instância Superior'}`;
        
        let actionBtn = '';
        if (doc.tipo === 'Link') {
            actionBtn = `<a href="${doc.conteudo}" target="_blank" class="btn btn-primary" style="padding: 4px 8px; font-size: 12px; text-decoration: none;">Abrir Link &nearr;</a>`;
        } else {
            // Encode the markdown content to safely pass it in onclick
            const encodedContent = encodeURIComponent(doc.conteudo || '');
            const encodedTitle = encodeURIComponent(doc.titulo || '');
            actionBtn = `<button class="btn btn-primary" style="padding: 4px 8px; font-size: 12px;" onclick="abrirViewerMarkdown('${encodedTitle}', '${encodedContent}')">Ler Conteúdo</button>`;
        }
        
            let editBtn = '';
            let deleteBtn = '';
            if (isLocal) {
                editBtn = `<button onclick="abrirModalDoc('${doc.id}')" style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 16px; padding: 4px;" title="Editar Documento">✏️</button>`;
                deleteBtn = `<button onclick="excluirDocumento('${doc.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; padding: 4px;" title="Excluir Documento">🗑️</button>`;
            }

            html += `
            <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${icon} ${doc.titulo}</div>
                    <div style="display: flex; gap: 8px;">
                        ${editBtn}
                        ${deleteBtn}
                    </div>
                </div>
                <div style="font-size: 12px; color: var(--text-muted);">${dono}</div>
            <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
                ${actionBtn}
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

// Removido declaração duplicada de abrirModalDoc e fecharModalDoc

window.toggleDocType = function() {
    const tipo = document.getElementById('inDocTipo').value;
    if (tipo === 'Link') {
        document.getElementById('groupDocLink').style.display = 'block';
        document.getElementById('inDocLink').required = true;
        document.getElementById('groupDocMd').style.display = 'none';
        document.getElementById('inDocMd').required = false;
    } else {
        document.getElementById('groupDocLink').style.display = 'none';
        document.getElementById('inDocLink').required = false;
        document.getElementById('groupDocMd').style.display = 'block';
        document.getElementById('inDocMd').required = true;
    }
};

async function popularSelectDepartamentos() {
    const container = document.getElementById('checkDepartamentos');
    try {
        const { data, error } = await db.from('estruturas').select('id, nome').neq('id', estruturaId).order('nome');
        if (data) {
            let html = '';
            data.forEach(d => {
                html += `
                <label style="display: flex; align-items: center; gap: 8px; color: var(--text-main); cursor: pointer;">
                    <input type="checkbox" class="chk-dept" value="${d.id}" style="width: auto;"> ${d.nome}
                </label>
                `;
            });
            container.innerHTML = html;
        }
    } catch (e) {
        container.innerHTML = '<span style="color: #ef4444;">Erro ao carregar</span>';
    }
}

async function salvarDocumento(e) {
    e.preventDefault();
    
    const btnSave = document.getElementById('btnSaveDoc');
    btnSave.disabled = true;
    btnSave.textContent = 'Salvando...';
    
    const docId = document.getElementById('inDocId').value;
    const titulo = document.getElementById('inDocTitulo').value;
    const tipo = document.getElementById('inDocTipo').value;
    const projetoId = document.getElementById('inDocProjetoId').value || null;
    
    let conteudo = '';
    if (tipo === 'Link') {
        conteudo = document.getElementById('inDocLink').value;
    } else {
        conteudo = document.getElementById('inDocMd').value;
    }
    
    try {
        let savedDocId = null;
        
        if (docId) {
            // Atualizar
            const { error } = await db.from('documentos').update({
                titulo: titulo,
                tipo: tipo,
                conteudo: conteudo,
                projeto_processo_id: projetoId
            }).eq('id', docId);
            if (error) throw error;
            savedDocId = docId;
        } else {
            // Inserir
            const { data: newDoc, error } = await db.from('documentos').insert([{
                estrutura_id: estruturaId,
                titulo: titulo,
                tipo: tipo,
                conteudo: conteudo,
                projeto_processo_id: projetoId
            }]).select();
            
            if (error) throw error;
            if (newDoc && newDoc.length > 0) {
                savedDocId = newDoc[0].id;
            }
        }
        
        // Tratar Visibilidade (Herança)
        const checkDepartamentos = document.getElementById('checkDepartamentos');
        if (checkDepartamentos) {
            const checks = checkDepartamentos.querySelectorAll('.chk-dept:checked');
            
            if (docId) {
                // Deletar visibilidade antiga
                await db.from('documentos_visibilidade').delete().eq('documento_id', savedDocId);
            }
            
            if (checks.length > 0 && savedDocId) {
                const inserts = Array.from(checks).map(chk => ({
                    documento_id: savedDocId,
                    estrutura_id: chk.value
                }));
                const { error: visError } = await db.from('documentos_visibilidade').insert(inserts);
                if (visError) console.warn("Erro ao vincular visibilidade:", visError);
            }
        }
        
        fecharModalDoc();
        await carregarDocumentos();
        if(typeof carregarProjetosProcessos === 'function') await carregarProjetosProcessos(); // refresh pra mostrar no projeto
    } catch (err) {
        console.error("Erro ao salvar documento:", err);
        alert("Erro ao salvar documento. Detalhes no console.");
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Salvar Documento';
    }
}

window.excluirDocumento = async function(id) {
    if (!confirm("Tem certeza que deseja excluir este documento? Os departamentos que o herdaram também perderão o acesso.")) return;
    
    try {
        // O Supabase (Cascade Delete) ou a exclusao direta da visibilidade primeiro
        await db.from('documentos_visibilidade').delete().eq('documento_id', id);
        const { error } = await db.from('documentos').delete().eq('id', id);
        
        if (error) throw error;
        await carregarDocumentos();
    } catch (err) {
        console.error("Erro ao excluir", err);
        alert("Erro ao excluir.");
    }
};

// ==========================================
// RENDERIZADOR MARKDOWN
// ==========================================
window.abrirViewerMarkdown = function(encodedTitle, encodedContent) {
    const titulo = decodeURIComponent(encodedTitle);
    const conteudo = decodeURIComponent(encodedContent);
    
    document.getElementById('viewerTitle').textContent = titulo;
    
    // Converte o Markdown cru para HTML usando Marked.js
    const htmlConvertido = marked.parse(conteudo);
    document.getElementById('viewerContent').innerHTML = htmlConvertido;
    
    document.getElementById('modalViewer').style.display = 'flex';
};

window.fecharViewer = function() {
    document.getElementById('modalViewer').style.display = 'none';
    document.getElementById('viewerContent').innerHTML = '';
};

// ==========================================
// MÓDULO DE AGENDA
// ==========================================

async function carregarAgenda() {
    const listAgenda = document.getElementById('listAgenda');
    listAgenda.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    
    try {
        const hojeIso = new Date().toISOString();
        
        // Buscar eventos locais e globais futuros
        const { data: eventos, error } = await db
            .from('agenda')
            .select('*, estruturas(nome)')
            .or(`estrutura_id.eq.${estruturaId},visibilidade.eq.Global`)
            .gte('data_hora_inicio', hojeIso)
            .order('data_hora_inicio', { ascending: true });
            
        if (error) throw error;
        
        if (!eventos || eventos.length === 0) {
            listAgenda.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Nenhum evento agendado.</div>';
            return;
        }
        
        let html = '';
        eventos.forEach(ev => {
            const dataInicio = new Date(ev.data_hora_inicio);
            const dataFim = ev.data_hora_fim ? new Date(ev.data_hora_fim) : null;
            
            const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
            const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const isGlobal = ev.visibilidade === 'Global';
            const badgeGloblal = isGlobal ? `<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-left: 8px;">GLOBAL</span>` : '';
            const organizador = isGlobal && ev.estruturas ? `Organizado por: ${ev.estruturas.nome}` : '';
            
            // Gerar Link Google Calendar (Formato: YYYYMMDDTHHMMSSZ)
            const gcalInicio = dataInicio.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            let gcalFim = gcalInicio;
            if (dataFim) {
                gcalFim = dataFim.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            } else {
                // +1 hora por padrão
                const tempFim = new Date(dataInicio.getTime() + 60 * 60 * 1000);
                gcalFim = tempFim.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            }
            const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.titulo)}&dates=${gcalInicio}/${gcalFim}&details=${encodeURIComponent(ev.descricao || '')}&location=${encodeURIComponent(ev.local || '')}`;

            // Gerar conteudo ICS
            const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${gcalInicio}
DTEND:${gcalFim}
SUMMARY:${ev.titulo}
DESCRIPTION:${ev.descricao || ''}
LOCATION:${ev.local || ''}
END:VEVENT
END:VCALENDAR`;
            
            const icsEncoded = encodeURIComponent(icsContent);

            html += `
            <div style="background: var(--bg-panel); border: 1px solid ${isGlobal ? '#ef4444' : 'var(--border)'}; border-radius: 8px; padding: 16px; display: flex; gap: 16px; position: relative;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; min-width: 60px;">
                    <div style="font-size: 14px; color: var(--primary); font-weight: bold;">${dataFormatada.split(' de ')[0]}</div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">${dataFormatada.split(' de ')[1] || ''}</div>
                </div>
                <div style="flex: 1; padding-right: 24px;">
                    <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${ev.titulo} ${badgeGloblal}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">⏰ ${horaFormatada} ${ev.local ? `| 📍 ${ev.local}` : ''}</div>
                    ${ev.descricao ? `<div style="font-size: 13px; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">${ev.descricao}</div>` : ''}
                    ${organizador ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">${organizador}</div>` : ''}
                    
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <a href="${gcalUrl}" target="_blank" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">+ Google Agenda</a>
                        <a href="data:text/calendar;charset=utf8,${icsEncoded}" download="${ev.titulo.replace(/\s+/g, '_')}.ics" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">+ Apple/Outlook (.ics)</a>
                    </div>
                </div>
                <button onclick="excluirEventoAgenda('${ev.id}')" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 14px; cursor: pointer; color: var(--text-muted);" title="Excluir Evento">🗑️</button>
            </div>
            `;
        });
        
        listAgenda.innerHTML = html;
    } catch (err) {
        console.warn("Erro ao carregar agenda", err);
        listAgenda.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: Tabela agenda não encontrada.</div>';
    }
}

window.abrirModalEvento = function() {
    document.getElementById('formEvento').reset();
    document.getElementById('modalEvento').style.display = 'flex';
};

window.fecharModalEvento = function() {
    document.getElementById('modalEvento').style.display = 'none';
};

async function salvarEvento(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveEvento');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const titulo = document.getElementById('inEvTitulo').value;
    const inicio = document.getElementById('inEvInicio').value;
    const fim = document.getElementById('inEvFim').value;
    const local = document.getElementById('inEvLocal').value;
    const visibilidade = document.getElementById('inEvVisibilidade').value;
    const descricao = document.getElementById('inEvDescricao').value;

    try {
        const { error } = await db.from('agenda').insert([{
            estrutura_id: estruturaId,
            titulo: titulo,
            data_hora_inicio: inicio ? new Date(inicio).toISOString() : null,
            data_hora_fim: fim ? new Date(fim).toISOString() : null,
            local: local,
            visibilidade: visibilidade,
            descricao: descricao
        }]);

        if (error) throw error;
        
        fecharModalEvento();
        await carregarAgenda();
    } catch (err) {
        console.error("Erro ao salvar evento:", err);
        alert("Erro ao salvar o evento.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Evento';
    }
}

window.excluirEventoAgenda = async (id) => {
    if (!confirm("Tem certeza que deseja apagar este evento da agenda?")) return;
    
    try {
        const { error } = await db.from('agenda').delete().eq('id', id);
        if (error) throw error;
        carregarAgenda();
    } catch (err) {
        console.error("Erro ao excluir evento:", err);
        alert("Erro ao excluir evento.");
    }
};

// ==========================================
// MÓDULO DE PROJETOS & PROCESSOS
// ==========================================
let projetosGlobais = [];

window.abrirModalProjeto = (tipo) => {
    document.getElementById('formProjeto').reset();
    document.getElementById('inProjetoId').value = '';
    document.getElementById('inProjetoTipo').value = tipo;
    document.getElementById('modalProjetoTitle').textContent = `Adicionar ${tipo}`;
    document.getElementById('modalProjeto').style.display = 'flex';
};

window.fecharModalProjeto = () => {
    document.getElementById('modalProjeto').style.display = 'none';
};

window.carregarProjetosProcessos = async () => {
    const container = document.getElementById('listProjetos');
    if(!container) return;
    
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    
    try {
        const { data, error } = await db
            .from('projetos_processos')
            .select('*')
            .eq('estrutura_id', estruturaId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        projetosGlobais = data || [];
        renderizarProjetosProcessos();
    } catch (err) {
        console.warn("Erro ao buscar projetos:", err);
        container.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: A tabela de projetos_processos não foi criada no Supabase.</div>';
    }
};

window.renderizarProjetosProcessos = () => {
    const container = document.getElementById('listProjetos');
    if (!projetosGlobais || projetosGlobais.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">Nenhum Projeto ou Processo encontrado.</div>`;
        return;
    }
    
    let html = '';
    projetosGlobais.forEach(proj => {
        const icon = proj.tipo === 'Projeto' ? '🚀' : '🔄';
        let badgeColor = 'var(--text-muted)';
        if(proj.status === 'Ativo') badgeColor = '#10b981';
        if(proj.status === 'Pausado') badgeColor = '#f59e0b';
        
        // Filtra documentos vinculados a este projeto
        const docsVinculados = typeof documentosGlobais !== 'undefined' ? documentosGlobais.filter(d => d.projeto_processo_id === proj.id) : [];
        let docsHtml = '';
        if (docsVinculados.length > 0) {
            docsHtml = '<div style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">';
            docsVinculados.forEach(doc => {
                const dIcon = doc.tipo === 'Link' ? '🔗' : '📝';
                
                let actionBtn = '';
                if (doc.tipo === 'Link') {
                    actionBtn = `onclick="window.open('${doc.conteudo}', '_blank')"`;
                } else {
                    const encodedContent = encodeURIComponent(doc.conteudo || '');
                    const encodedTitle = encodeURIComponent(doc.titulo || '');
                    actionBtn = `onclick="abrirViewerMarkdown('${encodedTitle}', '${encodedContent}')"`;
                }
                
                docsHtml += `
                <div style="background: rgba(255,255,255,0.03); border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" ${actionBtn}>
                        <div style="background: var(--bg-dark); padding: 8px; border-radius: 6px;">${dIcon}</div>
                        <span style="font-size: 14px; font-weight: 500;">${doc.titulo}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="abrirModalDoc('${doc.id}')" style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 14px;" title="Editar Documento">✏️</button>
                        <button onclick="excluirDocumento('${doc.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px;" title="Excluir Documento">🗑️</button>
                    </div>
                </div>
                `;
            });
            docsHtml += '</div>';
        } else {
            docsHtml = '<div style="margin-top: 16px; font-size: 12px; color: var(--text-muted); font-style: italic;">Nenhum documento/bloco vinculado.</div>';
        }

        html += `
        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px;">${icon}</div>
                    <div>
                        <h3 style="margin: 0; font-size: 18px; color: var(--text-main);">${proj.titulo}</h3>
                        <div style="font-size: 13px; color: ${badgeColor}; margin-top: 4px;">● ${proj.status}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editarProjeto('${proj.id}')" style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 16px;" title="Editar">✏️</button>
                    <button onclick="excluirProjeto('${proj.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px;" title="Excluir">🗑️</button>
                </div>
            </div>
            <p style="margin-top: 12px; color: var(--text-muted); font-size: 14px; line-height: 1.5;">${proj.descricao || ''}</p>
            ${docsHtml}
        </div>
        `;
    });
    
    container.innerHTML = html;
};

window.editarProjeto = (id) => {
    const proj = projetosGlobais.find(p => p.id === id);
    if (!proj) return;
    
    document.getElementById('inProjetoId').value = proj.id;
    document.getElementById('inProjetoTipo').value = proj.tipo;
    document.getElementById('inProjetoTitulo').value = proj.titulo;
    document.getElementById('inProjetoDescricao').value = proj.descricao;
    document.getElementById('inProjetoStatus').value = proj.status;
    
    document.getElementById('modalProjetoTitle').textContent = `Editar ${proj.tipo}`;
    document.getElementById('modalProjeto').style.display = 'flex';
};

window.excluirProjeto = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este item? Os documentos dentro dele não serão apagados, apenas ficarão 'soltos'.")) return;
    
    try {
        const { error } = await db.from('projetos_processos').delete().eq('id', id);
        if (error) throw error;
        await carregarProjetosProcessos();
    } catch (err) {
        console.error("Erro ao excluir", err);
        alert("Erro ao excluir.");
    }
};

window.salvarProjeto = async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById('btnSaveProjeto');
    btnSave.disabled = true;
    
    const id = document.getElementById('inProjetoId').value;
    const tipo = document.getElementById('inProjetoTipo').value;
    const titulo = document.getElementById('inProjetoTitulo').value;
    const descricao = document.getElementById('inProjetoDescricao').value;
    const status = document.getElementById('inProjetoStatus').value;
    
    const dados = {
        estrutura_id: estruturaId,
        tipo, titulo, descricao, status
    };
    
    try {
        if (id) {
            const { error } = await db.from('projetos_processos').update(dados).eq('id', id);
            if(error) throw error;
        } else {
            const { error } = await db.from('projetos_processos').insert([dados]);
            if(error) throw error;
        }
        
        fecharModalProjeto();
        await carregarProjetosProcessos();
        
        // Atualiza o select de projetos no modal de Documentos
        const selectProj = document.getElementById('inDocProjetoId');
        if (selectProj) {
            selectProj.innerHTML = '<option value="">-- Solto (Nenhum Projeto) --</option>';
            projetosGlobais.forEach(p => {
                selectProj.innerHTML += `<option value="${p.id}">${p.tipo}: ${p.titulo}</option>`;
            });
        }
        
    } catch(err) {
        console.error("Erro ao salvar projeto:", err);
        alert("Erro ao salvar. Verifique se a tabela projetos_processos existe.");
    } finally {
        btnSave.disabled = false;
    }
};

// ==========================================
// MÓDULO DE APPS & SERVIÇOS (Ex: Irradiação)
// ==========================================
let currentIrradiacaoTab = 'pendentes';
let currentIrradiacaoDia = 'Segunda-feira';

async function carregarAppIrradiacao() {
    const container = document.getElementById('containerApps');
    
    container.innerHTML = `
        <div style="background: rgba(79, 70, 229, 0.1); border: 1px solid var(--primary); border-radius: 12px; padding: 20px; margin-bottom: 32px;">
            <h3 style="color: var(--primary); margin-bottom: 16px;">📝 Nova Solicitação de Irradiação</h3>
            <form id="formIrradiacao" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Nome Completo do Necessitado *</label>
                    <input type="text" id="inIrrNome" required class="input-field" placeholder="Ex: Maria da Silva" style="width: 100%;">
                </div>
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Endereço Completo</label>
                    <input type="text" id="inIrrEndereco" class="input-field" placeholder="Rua, Número, Bairro, Cidade" style="width: 100%;">
                </div>
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">Dias para Irradiação *</label>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <label class="tag-checkbox-ui"><input type="checkbox" class="chk-dia" value="Segunda-feira"> Segunda-feira</label>
                        <label class="tag-checkbox-ui"><input type="checkbox" class="chk-dia" value="Terça-feira"> Terça-feira</label>
                        <label class="tag-checkbox-ui"><input type="checkbox" class="chk-dia" value="Quarta-feira"> Quarta-feira</label>
                        <label class="tag-checkbox-ui"><input type="checkbox" class="chk-dia" value="Quinta-feira"> Quinta-feira</label>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                    <button type="submit" class="btn btn-primary" id="btnSaveIrr">Enviar Solicitação</button>
                </div>
            </form>
        </div>
        
        <div style="margin-top: 32px;">
            <div style="display: flex; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; overflow-x: auto;">
                <button onclick="mudarAbaIrradiacao('pendentes')" id="btnIrrPendentes" class="btn btn-secondary" style="white-space: nowrap;">📥 Pendentes</button>
                <button onclick="mudarAbaIrradiacao('ativos')" id="btnIrrAtivos" class="btn" style="background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); white-space: nowrap;">📋 Painel de Leitura</button>
                <button onclick="mudarAbaIrradiacao('historico')" id="btnIrrHistorico" class="btn" style="background: transparent; color: var(--text-muted); white-space: nowrap;">🗄️ Histórico</button>
            </div>
            
            <div id="filtrosDiasIrr" style="display: none; gap: 12px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 8px;">
                <button class="btn btn-secondary btn-dia" onclick="setDiaIrradiacao('Segunda-feira')">Segunda-feira</button>
                <button class="btn btn-secondary btn-dia" onclick="setDiaIrradiacao('Terça-feira')">Terça-feira</button>
                <button class="btn btn-secondary btn-dia" onclick="setDiaIrradiacao('Quarta-feira')">Quarta-feira</button>
                <button class="btn btn-secondary btn-dia" onclick="setDiaIrradiacao('Quinta-feira')">Quinta-feira</button>
            </div>

            <div id="listaIrradiacoes" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>
            </div>
        </div>
    `;

    document.getElementById('formIrradiacao').addEventListener('submit', salvarIrradiacao);
    window.mudarAbaIrradiacao('pendentes');
}

window.mudarAbaIrradiacao = function(aba) {
    currentIrradiacaoTab = aba;
    
    // Atualiza botões
    const btnPendentes = document.getElementById('btnIrrPendentes');
    const btnAtivos = document.getElementById('btnIrrAtivos');
    const btnHistorico = document.getElementById('btnIrrHistorico');
    
    btnPendentes.style.background = aba === 'pendentes' ? 'var(--border)' : 'transparent';
    btnAtivos.style.background = aba === 'ativos' ? 'rgba(16,185,129,0.2)' : 'transparent';
    btnHistorico.style.background = aba === 'historico' ? 'var(--border)' : 'transparent';
    
    // Filtros de dia só aparecem no "ativos"
    const filtrosDias = document.getElementById('filtrosDiasIrr');
    if (aba === 'ativos') {
        filtrosDias.style.display = 'flex';
        window.setDiaIrradiacao(currentIrradiacaoDia); // Força render
    } else {
        filtrosDias.style.display = 'none';
        carregarListaIrradiacao();
    }
}

window.setDiaIrradiacao = function(dia) {
    currentIrradiacaoDia = dia;
    
    document.querySelectorAll('.btn-dia').forEach(b => {
        b.style.background = b.textContent === dia ? 'var(--primary)' : 'var(--bg-dark)';
        b.style.color = b.textContent === dia ? '#fff' : 'var(--text-muted)';
    });
    
    carregarListaIrradiacao();
}

async function carregarListaIrradiacao() {
    const lista = document.getElementById('listaIrradiacoes');
    try {
        let query = db.from('app_irradiacao_solicitacoes')
                      .select('*')
                      .eq('estrutura_id', estruturaId);
                      
        if (currentIrradiacaoTab === 'pendentes') {
            query = query.eq('status', 'pendente').order('criado_em', { ascending: false });
        } else if (currentIrradiacaoTab === 'ativos') {
            query = query.eq('status', 'ativo').ilike('dias_semana', `%${currentIrradiacaoDia}%`).order('criado_em', { ascending: true });
        } else if (currentIrradiacaoTab === 'historico') {
            query = query.eq('status', 'historico').order('criado_em', { ascending: false });
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (!data || data.length === 0) {
            lista.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; text-align: center; padding: 24px; background: rgba(255,255,255,0.02); border-radius: 8px;">Nenhum registro encontrado nesta visão.</div>';
            return;
        }
        
        let html = '';
        data.forEach(item => {
            const dataPed = new Date(item.criado_em).toLocaleDateString('pt-BR');
            
            // Botões de Ação
            let actionsHtml = '';
            let progressHtml = '';
            
            if (currentIrradiacaoTab === 'pendentes') {
                actionsHtml = `
                    <button onclick="aprovarIrradiacao('${item.id}')" class="btn btn-primary" style="padding: 6px 12px;">✅ Aprovar p/ Leitura</button>
                    <button onclick="excluirIrradiacaoDefinitivo('${item.id}')" class="btn" style="color: #ef4444; border: 1px solid #ef4444; padding: 6px 12px; background: transparent;">Apagar</button>
                `;
            } else if (currentIrradiacaoTab === 'ativos') {
                const leituras = item.leituras || 0;
                let caixinhas = '';
                for(let i=1; i<=4; i++) {
                    if (i <= leituras) {
                        caixinhas += `<span style="display:inline-block; width:16px; height:16px; background:#10b981; border-radius:50%; margin-right:4px;"></span>`;
                    } else {
                        caixinhas += `<span style="display:inline-block; width:16px; height:16px; border:2px solid #334155; border-radius:50%; margin-right:4px;"></span>`;
                    }
                }
                
                progressHtml = `<div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">Leituras: ${leituras}/4<br><div style="margin-top:4px;">${caixinhas}</div></div>`;
                
                actionsHtml = `
                    <button onclick="marcarLeituraIrr('${item.id}', ${leituras})" class="btn" style="background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid #10b981; padding: 6px 12px;">✅ Registrar Leitura</button>
                    <button onclick="arquivarIrradiacao('${item.id}')" class="btn btn-secondary" style="padding: 6px 12px;">Forçar Arquivamento</button>
                `;
            } else if (currentIrradiacaoTab === 'historico') {
                actionsHtml = `
                    <button onclick="reativarIrradiacao('${item.id}')" class="btn btn-secondary" style="padding: 6px 12px;">♻️ Reativar (+4 Semanas)</button>
                    <button onclick="excluirIrradiacaoDefinitivo('${item.id}')" class="btn" style="color: #ef4444; border: 1px solid #ef4444; padding: 6px 12px; background: transparent;">Apagar</button>
                `;
            }
            
            html += `
                <div style="background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="flex: 1;">
                            <h4 style="color: var(--text-main); margin: 0 0 4px 0; font-size: 16px;">${item.nome_solicitado}</h4>
                            <p style="color: var(--text-muted); font-size: 13px; margin: 0;">📍 ${item.endereco || 'Endereço não informado'}</p>
                            <span style="font-size: 11px; color: var(--text-muted);">Criado em: ${dataPed} | Dia alvo: <strong style="color: #cbd5e1;">${item.dias_semana}</strong></span>
                            ${progressHtml}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${actionsHtml}
                    </div>
                </div>
            `;
        });
        lista.innerHTML = html;
        
    } catch (e) {
        console.error(e);
        lista.innerHTML = '<div style="color: #ef4444;">Erro ao carregar solicitações.</div>';
    }
}

async function salvarIrradiacao(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveIrr');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    
    const nome = document.getElementById('inIrrNome').value;
    const endereco = document.getElementById('inIrrEndereco').value;
    
    const checkboxes = document.querySelectorAll('.chk-dia:checked');
    const dias = Array.from(checkboxes).map(c => c.value);
    
    if (dias.length === 0) {
        alert("Selecione pelo menos um dia para a Irradiação.");
        btn.disabled = false;
        btn.textContent = 'Enviar Solicitação';
        return;
    }
    
    try {
        // Criar N registros independentes, um para cada dia selecionado
        const recordsToInsert = dias.map(dia => ({
            estrutura_id: estruturaId,
            nome_solicitado: nome,
            endereco: endereco,
            dias_semana: dia,
            status: 'pendente',
            leituras: 0
        }));
        
        const { error } = await db.from('app_irradiacao_solicitacoes').insert(recordsToInsert);
        if (error) throw error;
        
        document.getElementById('formIrradiacao').reset();
        await carregarListaIrradiacao();
        alert("Solicitação enviada com sucesso!");
    } catch (err) {
        console.error(err);
        alert("Erro ao enviar solicitação.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar Solicitação';
    }
}

window.aprovarIrradiacao = async function(id) {
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ status: 'ativo', leituras: 0 }).eq('id', id);
        if (error) throw error;
        await carregarListaIrradiacao();
    } catch (err) { console.error(err); alert('Erro ao aprovar'); }
}

window.marcarLeituraIrr = async function(id, leituras_atuais) {
    try {
        const novaLeitura = leituras_atuais + 1;
        let novoStatus = 'ativo';
        if (novaLeitura >= 4) {
            novoStatus = 'historico';
            alert("4ª Leitura concluída! O nome será movido para o histórico.");
        }
        
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ 
            leituras: novaLeitura, 
            status: novoStatus 
        }).eq('id', id);
        if (error) throw error;
        
        await carregarListaIrradiacao();
    } catch (err) { console.error(err); alert('Erro ao marcar leitura'); }
}

window.arquivarIrradiacao = async function(id) {
    if(!confirm("Deseja forçar o arquivamento deste nome mesmo antes das 4 semanas?")) return;
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ status: 'historico' }).eq('id', id);
        if (error) throw error;
        await carregarListaIrradiacao();
    } catch (err) { console.error(err); alert('Erro ao arquivar'); }
}

window.reativarIrradiacao = async function(id) {
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ status: 'ativo', leituras: 0 }).eq('id', id);
        if (error) throw error;
        await carregarListaIrradiacao();
    } catch (err) { console.error(err); alert('Erro ao reativar'); }
}

window.excluirIrradiacaoDefinitivo = async function(id) {
    if(!confirm("Atenção! Confirma exclusão DEFINITIVA do sistema?")) return;
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').delete().eq('id', id);
        if (error) throw error;
        await carregarListaIrradiacao();
    } catch (err) { console.error(err); alert("Erro ao excluir."); }
};
