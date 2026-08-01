// Proteção de Rota (Auth Guard)
// Deve ser carregado no <head> de TODAS as páginas do portal (exceto login.html)

const GUARD_SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const GUARD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

// Inicializa cliente isolado para o guard (caso o da página demore)
const authDb = window.supabase.createClient(GUARD_SUPABASE_URL, GUARD_SUPABASE_KEY);

async function checkAuth() {
    // 1. Pega a sessão atual
    const { data: { session }, error: sessionError } = await authDb.auth.getSession();
    
    if (sessionError || !session) {
        window.location.replace('login.html');
        return;
    }

    // 2. Se tem sessão, pega o e-mail
    const email = session.user.email;
    if (!email) {
        await authDb.auth.signOut();
        window.location.replace('login.html');
        return;
    }

    // 3. Checa se o e-mail está na tabela usuarios_autorizados
    const { data: whitelist, error: dbError } = await authDb
        .from('usuarios_autorizados')
        .select('*')
        .eq('email', email)
        .single();

    if (dbError || !whitelist) {
        // Usuário tem conta Google, mas não tem permissão na SELA
        await authDb.auth.signOut();
        window.location.replace('login.html?error=nao_autorizado');
        return;
    }

    // 4. Usuário autorizado! 
    // Vamos injetar os dados dele no localStorage para o sidebar.js puxar
    const userProfile = {
        nome: whitelist.nome || session.user.user_metadata.full_name || 'Trabalhador SELA',
        foto: session.user.user_metadata.avatar_url || 'https://ui-avatars.com/api/?name=Sela&background=random'
    };
    localStorage.setItem('sela_user_profile', JSON.stringify(userProfile));
}

// Executa imediatamente
checkAuth();
