import { requireAuthenticatedUser } from "@/server/auth/require-user";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function ModuleSelector() {
  const { user } = await requireAuthenticatedUser("patient.read");
  const displayName = user.name?.trim() || "Profissional";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}><span className={styles.brandMark} aria-hidden="true">✳</span> Prontuário Aprimorado</div>
          <span className={styles.account}>Acesso profissional autenticado</span>
        </header>
        <section className={styles.intro} aria-labelledby="module-title">
          <p className={styles.eyebrow}>Ambiente de trabalho clínico</p>
          <h1 id="module-title">Qual jornada você deseja iniciar?</h1>
          <p>Olá, {displayName}. Escolha o módulo correspondente ao atendimento. Sua identidade profissional continua protegida pela mesma sessão.</p>
        </section>
        <div className={styles.grid}>
          <a href="/" className={styles.card} aria-label="Abrir o Prontuário Geriátrico existente">
            <span className={styles.icon} aria-hidden="true">✦</span>
            <span className={styles.tag}>Módulo atual</span>
            <h2>Prontuário Geriátrico</h2>
            <p>Avaliação longitudinal completa, histórico clínico, escalas, medicamentos, SOAP e relatórios.</p>
            <strong>Acessar prontuário <span aria-hidden="true">→</span></strong>
          </a>
          <a href="/aga-medico-familia" className={`${styles.card} ${styles.accent}`} aria-label="Abrir módulo AGA — Médico da Família">
            <span className={styles.icon} aria-hidden="true">＋</span>
            <span className={styles.tag}>Nova linha de cuidado</span>
            <h2>AGA — Médico da Família</h2>
            <p>Avaliação Geriátrica Ampla na consulta de família, com cinco escalas, acompanhamento da jornada e revisão compartilhada.</p>
            <strong>Acessar módulo <span aria-hidden="true">→</span></strong>
          </a>
        </div>
        <p className={styles.note}>Os dois módulos compartilham o controle de acesso. O novo módulo está em fase de construção e usa apenas simulação sintética.</p>
      </div>
    </main>
  );
}
