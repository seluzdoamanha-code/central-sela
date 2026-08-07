(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let allFamilias = [];
    let hubId = null;

    document.addEventListener('DOMContentLoaded', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        hubId = urlParams.get('id');

        document.getElementById('btnVoltarHub').addEventListener('click', () => {
            if (hubId) window.location.href = 'm_hub.html?id=' + hubId;
            else window.location.href = 'm_atividades.html';
        });

        document.getElementById('mSearchInput').addEventListener('input', filtrarLista);

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
            const nomeStr = (f.nome_familia || '').toLowerCase();
            const codStr = (f.codigo || '').toLowerCase();
            return nomeStr.includes(query) || codStr.includes(query);
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
            const telStr = f.telefone ? '📞 ' + f.telefone : '';

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

    function abrirDetalhes(f) {
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
        if (f.endereco_complemento) endCompleto += ' (' + f.endereco_complemento + ')';
        if (f.endereco_bairro) endCompleto += ' - ' + f.endereco_bairro;
        if (f.endereco_cep) endCompleto += ' CEP: ' + f.endereco_cep;
        
        document.getElementById('mdEndereco').innerText = endCompleto || 'Não informado';
        
        const btnMaps = document.getElementById('btnGoogleMaps');
        if (endCompleto) {
            btnMaps.style.display = 'flex';
            const endBusca = encodeURIComponent(endCompleto + ' Ponta Grossa PR');
            btnMaps.href = 'https://www.google.com/maps/search/?api=1&query=' + endBusca;
        } else {
            btnMaps.style.display = 'none';
        }

        // Logística
        document.getElementById('mdCesta').innerText = f.tipo_cesta_id || '-';
        document.getElementById('mdDiaRetirada').innerText = f.dia_retirada_padrao || '-';

        document.getElementById('mDetModal').classList.add('active');
    }

})();
