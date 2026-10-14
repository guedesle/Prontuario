import styles from "./page.module.css";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const hasError = Boolean(params?.error);

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <section className={styles.visual} aria-label="Apresentação da plataforma">
          <div className={styles.visualTop}>
            <span className={styles.brandMark} aria-hidden="true">✳</span>
            <strong>Prontuário Aprimorado</strong>
          </div>
          <div className={styles.illustration}>
            <img src="/images/clinical-access.svg" alt="Ilustração abstrata de profissionais de saúde e continuidade do cuidado" />
          </div>
          <div className={styles.visualText}>
            <span className={styles.overline}>Plataforma clínica integrada</span>
            <h2>Cuidado conectado, decisões acompanhadas.</h2>
            <p>Um espaço de trabalho para a avaliação geriátrica e para o cuidado compartilhado com a Medicina de Família.</p>
          </div>
        </section>

        <section className={styles.login} aria-labelledby="login-title">
          <div className={styles.loginTop}>
            <span className={styles.secureLabel}>Acesso profissional restrito</span>
            <span className={styles.accessNote}>Ambiente protegido</span>
          </div>
          <div className={styles.loginBody}>
            <p className={styles.eyebrow}>Bem-vindo de volta</p>
            <h1 id="login-title">Acesse seu espaço clínico.</h1>
            <p className={styles.intro}>Utilize sua conta profissional autorizada para continuar.</p>

            <div className={styles.formGroup} aria-label="Autenticação com credenciais">
              <label htmlFor="login-email">E-mail profissional</label>
              <input id="login-email" type="email" placeholder="nome@instituicao.com.br" autoComplete="username" disabled />
              <label htmlFor="login-password">Senha</label>
              <input id="login-password" type="password" placeholder="••••••••••••" autoComplete="current-password" disabled />
              <button className={styles.passwordButton} type="button" disabled>Entrar com e-mail e senha</button>
              <p className={styles.notAvailable}>Acesso por senha ainda não habilitado. Para evitar credenciais inseguras, nenhuma senha local será criada nesta etapa.</p>
            </div>

            <div className={styles.separator}><span>ou continue com sua conta</span></div>

            <a className={styles.googleButton} href="/auth/google" data-google-auth-entrypoint="true">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48" focusable="false">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.05 11.05 0 0 1-4.82 7.26l7.73 6C44.36 38.09 46.98 31.93 46.98 24.55Z"/>
                <path fill="#FBBC05" d="M10.53 28.59A14.39 14.39 0 0 1 9.75 24c0-1.59.27-3.13.77-4.59l-7.98-6.19A24 24 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.72l-7.73-6c-2.14 1.44-4.89 2.22-8.17 2.22-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48Z"/>
              </svg>
              Continuar com Google
            </a>
            <a className={styles.compatible} href="/auth/google?manual=1" data-google-auth-compatible-entrypoint="true">Usar modo compatível</a>
            {hasError ? (
              <p className={styles.error} role="alert">Não foi possível iniciar a autenticação com o Google. Tente novamente ou use o modo compatível.</p>
            ) : null}
          </div>
          <footer className={styles.footer}>Acesso limitado a profissionais autorizados. Não compartilhe sua sessão.</footer>
        </section>
      </div>
    </main>
  );
}
