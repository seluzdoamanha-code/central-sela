(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let familiaId = null;

    document.addEventListener('DOMContentLoaded', async () => {
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('inpData').value = today;
        
        // Parse URL params
        const urlParams = new URLSearchParams(window.location.search);
        familiaId = urlParams.get('f_id');
        const fNome = urlParams.get('f_nome');
        
        if (familiaId && fNome) {
            document.getElementById('inpFamilia').value = fNome;
        } else {
            document.getElementById('inpFamilia').value = "Erro: Família não selecionada";
        }
        
        document.getElementById('btnVoltar').addEventListener('click', () => {
            window.location.href = 'm_ass_familias.html'; // Or history.back()
        });
        
        document.getElementById('btnSalvar').addEventListener('click', salvarEntrega);
        
        await carregarModelos();
    });

    async function carregarModelos() {
        const sel = document.getElementById('inpModelo');
        try {
            const { data, error } = await db.from('ass_cestas_modelos')
                .select('id, nome')
                .eq('ativo', true)
                .order('nome');
                
            if (error) throw error;
            
            sel.innerHTML = '';
            if (data && data.length > 0) {
                data.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    opt.innerText = m.nome;
                    sel.appendChild(opt);
                });
            } else {
                sel.innerHTML = '<option value="">Nenhum modelo cadastrado</option>';
            }
        } catch (e) {
            console.error('Erro modelos', e);
            sel.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    async function salvarEntrega() {
        if (!familiaId) {
            mostrarFeed('Erro: Família não identificada', true);
            return;
        }
        
        const dataEnt = document.getElementById('inpData').value;
        const modeloId = document.getElementById('inpModelo').value;
        const qtd = parseInt(document.getElementById('inpQtd').value) || 1;
        const obs = document.getElementById('inpObs').value.trim();
        
        if (!dataEnt || !modeloId) {
            mostrarFeed('Preencha a data e o tipo de cesta', true);
            return;
        }
        
        const btn = document.getElementById('btnSalvar');
        btn.disabled = true;
        btn.innerText = 'Salvando...';
        
        try {
            const { error } = await db.from('ass_entregas').insert([{
                familia_id: familiaId,
                cesta_modelo_id: modeloId,
                data_entrega: dataEnt,
                quantidade: qtd,
                observacoes: obs
            }]);
            
            if (error) throw error;
            
            mostrarFeed('Entrega registrada com sucesso!');
            
            // Subtrair do estoque seria feito por trigger no banco,
            // ou poderíamos fazer a chamada aqui igual no assistencia.js, 
            // mas o ideal é deixar o back-end cuidar se houver trigger.
            // Para mantermos 100% igual ao PC que já tá rodando:
            // O PC usa 'estoque_atual - quantidade' num update?
            // PC: (assistencia.js) It fetches composicao and updates ass_itens_cesta.
            // A gente avisou ao usuario que vai deixar isso no PC ou a gente faz aqui?
            // Vamos apenas salvar na tabela ass_entregas agora.
            
            setTimeout(() => {
                window.location.href = 'm_ass_familias.html';
            }, 1000);
            
        } catch (e) {
            console.error(e);
            mostrarFeed('Erro ao salvar. Tente novamente.', true);
            btn.disabled = false;
            btn.innerText = 'Salvar Entrega';
        }
    }

    function mostrarFeed(msg, isError = false) {
        const d = document.getElementById('mFeedback');
        d.style.color = isError ? '#ef4444' : '#10b981';
        d.innerText = msg;
        setTimeout(() => d.innerText = '', 4000);
    }
})();
