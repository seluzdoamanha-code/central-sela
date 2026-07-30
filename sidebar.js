(function() {
    // Usamos variáveis locais (não exportadas pro window) para não dar conflito
    // com outros arquivos js (ex: app.js, entidade.js) que também declaram SUPABASE_URL.
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

    const sidebarDb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

    document.addEventListener('DOMContentLoaded', async () => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        const sidebarHTML = `
            <aside class="sidebar" style="display: flex; flex-direction: column;">
                <div class="logo-area" style="display: flex; align-items: center; justify-content: flex-start; gap: 12px; padding: 0 16px;">
                    <img src="logo_sela.png" alt="Logo SELA" style="height: 40px; width: auto; border-radius: 50%;">
                    <h2 style="margin: 0;">Central SELA</h2>
                </div>
                <nav class="main-nav" id="sidebarNav" style="flex: 1;">
                    <a href="index.html" class="nav-item ${currentPage === 'index.html' ? 'active' : ''}">🏠 Início / Mural</a>
                    <a href="entidade.html" class="nav-item ${currentPage === 'entidade.html' || currentPage === 'hub.html' ? 'active' : ''}">🏛️ Entidade & Atividades</a>
                    <a href="pessoas.html" class="nav-item ${currentPage === 'pessoas.html' || currentPage === 'perfil.html' ? 'active' : ''}">👥 Pessoas & Perfis</a>
                    
                    <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 8px 16px;" class="desktop-only"></div>

                    <div id="dynamicShortcuts" style="display: contents;">
                        <div style="padding: 16px; color: var(--text-muted); font-size: 12px; text-align: center;">Carregando Atalhos...</div>
                    </div>
                    
                    <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 8px 16px;" class="desktop-only"></div>
                    <a href="config.html" class="nav-item ${currentPage === 'config.html' ? 'active' : ''}">⚙️ Configurações</a>
                </nav>
                
                <div class="sidebar-footer" style="padding: 24px; font-size: 11px; color: var(--text-muted); text-align: center; border-top: 1px solid var(--border);">
                    <div id="socialLinks" style="display: flex; justify-content: center; gap: 12px; margin-bottom: 12px;">
                        <!-- Redes sociais injetadas aqui -->
                    </div>
                    <div class="desktop-only">
                        <div>&copy; 2026 Luz do Amanhã</div>
                        <div style="opacity: 0.6; margin-top: 4px;">Dev by Central SELA</div>
                    </div>
                </div>
            </aside>
        `;

        const existingSidebar = document.querySelector('aside.sidebar');
        if (existingSidebar) {
            existingSidebar.outerHTML = sidebarHTML;
        } else {
            const container = document.querySelector('.app-container');
            if (container) container.insertAdjacentHTML('afterbegin', sidebarHTML);
        }
        
        await carregarAtalhosDinamicos();
        await carregarRedesSociais();
        
        // Se a página atual possuir o container da Vitrine, carrega os eventos globais nela!
        if (document.getElementById('vitrineEventos')) {
            await carregarEventosGlobais();
        }
    });

    async function carregarAtalhosDinamicos() {
        const container = document.getElementById('dynamicShortcuts');
        if (!sidebarDb) return;
        
        try {
            const { data, error } = await sidebarDb
                .from('estruturas')
                .select('id, nome, tipo')
                .eq('exibir_no_menu', true)
                .order('nome');
                
            if (error) throw error;
            
            if (!data || data.length === 0) {
                container.innerHTML = '';
                return;
            }
            
            let html = '';
            data.forEach(d => {
                let icon = '📌';
                if(d.tipo === 'Departamento') icon = '🏢';
                if(d.tipo === 'Atividade') icon = '🎯';
                if(d.tipo === 'Família') icon = '🏠';
                
                const urlParams = new URLSearchParams(window.location.search);
                const isActive = (window.location.pathname.includes('hub.html') && urlParams.get('id') == d.id);
                
                html += `<a href="hub.html?id=${d.id}" class="nav-item ${isActive ? 'active' : ''}">${icon} ${d.nome}</a>`;
            });
            
            container.innerHTML = html;
        } catch (err) {
            console.warn("Erro ao carregar atalhos dinâmicos.", err);
            container.innerHTML = '';
        }
    }

    async function carregarRedesSociais() {
        const container = document.getElementById('socialLinks');
        if (!sidebarDb) return;
        
        try {
            const { data, error } = await sidebarDb.from('configuracoes').select('*');
            if (error) throw error;
            
            if (!data) return;
            
            let html = '';
            const configMap = {};
            data.forEach(c => configMap[c.chave] = c.valor);
            
            if (configMap['social_youtube'] === 'true') {
                html += `<a href="${configMap['link_youtube'] || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; font-size: 16px;">▶️</a>`;
            }
            if (configMap['social_instagram'] === 'true') {
                html += `<a href="${configMap['link_instagram'] || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; font-size: 16px;">📸</a>`;
            }
            if (configMap['social_facebook'] === 'true') {
                html += `<a href="${configMap['link_facebook'] || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; font-size: 16px;">📘</a>`;
            }
            if (configMap['social_tiktok'] === 'true') {
                html += `<a href="${configMap['link_tiktok'] || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; font-size: 16px;">🎵</a>`;
            }
            
            container.innerHTML = html;
        } catch (err) {
            console.warn("Erro ao carregar redes sociais.", err);
        }
    }

    // Exportar funções para o escopo global para que config.js consiga recarregar o menu
    window.carregarAtalhosDinamicos = carregarAtalhosDinamicos;
    window.carregarRedesSociais = carregarRedesSociais;

    // ==========================================
    // VITRINE DE EVENTOS GLOBAIS (Compartilhada)
    // ==========================================
    async function carregarEventosGlobais() {
        const containerVitrine = document.getElementById('vitrineEventos');
        const listaEventos = document.getElementById('listaEventosGlobais');
        
        if (!sidebarDb || !containerVitrine || !listaEventos) return;
        
        try {
            const hojeIso = new Date().toISOString();
            
            const { data, error } = await sidebarDb
                .from('agenda')
                .select('*, estruturas(nome)')
                .eq('visibilidade', 'Global')
                .gte('data_hora_inicio', hojeIso)
                .order('data_hora_inicio', { ascending: true })
                .limit(3);
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                containerVitrine.style.display = 'flex';
                
                let html = '';
                data.forEach(ev => {
                    const dataInicio = new Date(ev.data_hora_inicio);
                    const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
                    const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const organizador = ev.estruturas ? ev.estruturas.nome : 'Central SELA';
                    
                    html += `
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: center; min-width: 300px;">
                        <div style="background: #ef4444; color: white; border-radius: 6px; padding: 6px 10px; text-align: center; min-width: 55px;">
                            <div style="font-size: 14px; font-weight: bold;">${dataFormatada.split(' de ')[0]}</div>
                            <div style="font-size: 10px; text-transform: uppercase;">${dataFormatada.split(' de ')[1] || ''}</div>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: white; font-size: 14px;">${ev.titulo}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${organizador} | ⏰ ${horaFormatada} ${ev.local ? `| 📍 ${ev.local}` : ''}</div>
                        </div>
                    </div>
                    `;
                });
                
                listaEventos.innerHTML = html;
            } else {
                containerVitrine.style.display = 'none';
            }
        } catch (err) {
            console.warn('Erro na vitrine global:', err);
        }
    }

})();
