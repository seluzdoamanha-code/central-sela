// URL e Key do Supabase (Mesmas do app.js)
const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const btnGoogle = document.getElementById('btnGoogleLogin');
    const btnMicrosoft = document.getElementById('btnMicrosoftLogin');
    const errorMsg = document.getElementById('errorMsg');

    // Checa se já existe uma sessão ativa ou um erro na URL
    verificarStatusAtual();

    btnGoogle.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            console.log('Iniciando login com Google...');
            btnGoogle.disabled = true;
            btnGoogle.innerHTML = 'Conectando...';
            
            // Constrói a URL do index baseada na URL atual (suporta subpastas como /PortalLuz/)
            let indexUrl = window.location.href.split('?')[0];
            indexUrl = indexUrl.replace('login.html', 'index.html');
            
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: indexUrl
                }
            });

            if (error) {
                console.error("Erro do Supabase:", error);
                throw error;
            }
        } catch (error) {
            console.error('Erro no login:', error);
            alert('Erro ao tentar conectar: ' + error.message);
            mostrarErro('Falha ao conectar com o Google. Tente novamente.');
            btnGoogle.disabled = false;
            btnGoogle.innerHTML = `Entrar com o Google`;
        }
    });

    if (btnMicrosoft) {
        btnMicrosoft.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                console.log('Iniciando login com Microsoft...');
                btnMicrosoft.disabled = true;
                btnMicrosoft.innerHTML = 'Conectando...';
                
                let indexUrl = window.location.href.split('?')[0];
                indexUrl = indexUrl.replace('login.html', 'index.html');
                
                const { data, error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'azure',
                    options: {
                        redirectTo: indexUrl
                    }
                });

                if (error) {
                    console.error("Erro do Supabase:", error);
                    throw error;
                }
            } catch (error) {
                console.error('Erro no login:', error);
                alert('Erro ao tentar conectar: ' + error.message);
                mostrarErro('Falha ao conectar com a Microsoft. Tente novamente.');
                btnMicrosoft.disabled = false;
                btnMicrosoft.innerHTML = `Entrar com a Microsoft`;
            }
        });
    }

    async function verificarStatusAtual() {
        // Pega possíveis mensagens de erro da URL (ex: ?error=nao_autorizado&email=xyz)
        const urlParams = new URLSearchParams(window.location.search);
        const errorType = urlParams.get('error');
        
        if (errorType === 'nao_autorizado') {
            const rejectedEmail = urlParams.get('email') || 'Desconhecido';
            mostrarErro(`Acesso Negado: O e-mail "${rejectedEmail}" não está cadastrado na lista de trabalhadores autorizados do Portal.`);
        }

        // Checa se já está logado
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            // Se já tem sessão, manda pro index
            window.location.href = 'index.html';
        }
    }

    function mostrarErro(mensagem) {
        errorMsg.textContent = mensagem;
        errorMsg.style.display = 'block';
    }
});
