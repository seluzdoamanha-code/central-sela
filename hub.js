const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const estruturaId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!estruturaId) {
        alert('Nenhum departamento selecionado!');
        window.location.href = 'entidade.html';
        return;
    }
    
    // Configura os botoes de Aba
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Desativa todos
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Ativa o clicado
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    await carregarDadosHub();
});

async function carregarDadosHub() {
    try {
        const { data, error } = await db.from('estruturas').select('*').eq('id', estruturaId).single();
        if (error) throw error;
        
        document.getElementById('hubName').textContent = data.nome;
        document.getElementById('hubType').textContent = data.tipo;
        
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('hubContent').style.display = 'block';
        
    } catch (err) {
        console.error("Erro ao carregar dados do Hub:", err);
        document.getElementById('loadingState').textContent = "Erro ao carregar o departamento.";
    }
}

window.abrirOrganograma = () => {
    window.location.href = 'organograma.html?id=' + estruturaId;
};
