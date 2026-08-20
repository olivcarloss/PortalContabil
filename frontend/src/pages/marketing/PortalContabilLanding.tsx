import { useState, type ReactNode, type SVGProps } from "react";
import "./rodrisaas.css";

const WHATSAPP_NUMBER = "5511988402174";
const WHATSAPP_MESSAGE = "Olá! Quero conhecer o PortalContabil.cloud.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

/* ------------------------------------------------------------------ */
/* Inline icon set (vector, monochrome — no emoji, no external dep)   */
/* ------------------------------------------------------------------ */

type IconProps = SVGProps<SVGSVGElement>;

const iconBase = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ArrowRightIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const SparkleIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);
const CheckIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const LightningIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
  </svg>
);
const CodeSlashIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M9 18 3 12l6-6M15 6l6 6-6 6" />
  </svg>
);
const StackIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);
const CursorClickIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M6 3v6M3 6h6M13 13l7 3-3.5 1.5L15 21z" />
    <path d="m13 13-4-9-2 2" />
  </svg>
);
const UsersIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const FileChartIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M9 17v-3M12 17v-6M15 17v-4" />
  </svg>
);
const BookIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const DeviceIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <rect x="2" y="4" width="14" height="10" rx="1.5" />
    <path d="M8 20h4M9 14v6M17 8h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-4" />
  </svg>
);
const PlusIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const WhatsAppIcon = (p: IconProps) => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5C11 9 10.5 7.7 10.3 7.2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z" />
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
  </svg>
);

/* ------------------------------------------------------------------ */

const BENEFITS: { icon: (p: IconProps) => ReactNode; title: string; desc: string }[] = [
  {
    icon: LightningIcon,
    title: "Comece a operar no mesmo dia",
    desc: "Sem instalação e sem servidor próprio: cadastre o escritório, ative os produtos licenciados e o time já entra logado.",
  },
  {
    icon: UsersIcon,
    title: "Acesso do jeito certo pra cada pessoa",
    desc: "Master, Administrador ou Usuário — cada papel enxerga só os escritórios, clientes e telas que faz sentido pra ele.",
  },
  {
    icon: StackIcon,
    title: "Tudo em um só lugar",
    desc: "Licenciamento, cadastro de clientes e CNPJs, conciliação contábil e relatórios — sem depender de planilha solta.",
  },
  {
    icon: CodeSlashIcon,
    title: "Exportação de verdade",
    desc: "Todo relatório sai em CSV, XLS ou PDF com o mesmo padrão de datas e valores da tela — ou vai direto por e-mail.",
  },
];

const STEPS = [
  {
    title: "Ative os produtos do escritório",
    desc: "O Master libera os produtos e módulos contratados por escritório inteiro ou por CNPJ específico, já com os valores configurados.",
  },
  {
    title: "Defina papéis e perfis de acesso",
    desc: "Cada pessoa recebe um papel — Master, Administrador ou Usuário — e um perfil que decide exatamente quais telas ela vê.",
  },
  {
    title: "Acompanhe pelo Portal Contábil",
    desc: "Sintético, analítico, plano de contas e todos os relatórios prontos pra consultar, filtrar e exportar quando precisar.",
  },
];

const FEATURES: { icon: (p: IconProps) => ReactNode; title: string; desc: string }[] = [
  {
    icon: CursorClickIcon,
    title: "Licenciamento por escritório e CNPJ",
    desc: "Ative produtos e módulos por escritório inteiro ou por CNPJ específico, com histórico e renovação automática.",
  },
  {
    icon: UsersIcon,
    title: "Perfis de acesso configuráveis",
    desc: "Defina, por perfil, exatamente quais menus e telas cada pessoa do escritório enxerga — sem depender de código.",
  },
  {
    icon: FileChartIcon,
    title: "Relatórios exportáveis e por e-mail",
    desc: "Sintético, analítico, escritórios, clientes, produtos, módulos, tabela de preços e plano de contas — em CSV, XLS, PDF ou e-mail.",
  },
  {
    icon: BookIcon,
    title: "Plano de contas com padrão de fallback",
    desc: "Cada escritório pode carregar o próprio plano de contas via XLS; sem isso, o portal usa o plano padrão da plataforma sozinho.",
  },
  {
    icon: StackIcon,
    title: "Conciliação contábil sintético e analítico",
    desc: "Veja o resumo por CNPJ e período, e entre no detalhe de cada lançamento com um clique.",
  },
  {
    icon: DeviceIcon,
    title: "Funciona em qualquer tela",
    desc: "Layout adaptado para celular, tablet e notebook, com o mesmo controle de acesso em qualquer dispositivo.",
  },
];

const FAQS = [
  {
    q: "Preciso instalar alguma coisa para usar o portal?",
    a: "Não. O PortalContabil.cloud roda 100% no navegador — seu escritório só precisa de um login para começar.",
  },
  {
    q: "Como funciona o controle de acesso entre Master, Administrador e Usuário?",
    a: "Master tem acesso total à plataforma. Administrador gerencia os escritórios e CNPJs sob sua responsabilidade. Usuário só enxerga o que o perfil dele libera — tudo configurável pela tela de Perfis de acesso.",
  },
  {
    q: "Consigo tirar os relatórios do portal?",
    a: "Sim. Todo relatório pode ser exportado em CSV, XLS ou PDF, ou enviado direto por e-mail em anexo, com o mesmo padrão de datas e valores usado em tela.",
  },
  {
    q: "O que acontece se o meu escritório não carregar um plano de contas próprio?",
    a: "O portal usa automaticamente o plano de contas padrão da plataforma, então nada trava — e você pode carregar o seu a qualquer momento.",
  },
  {
    q: "Como falo com o suporte?",
    a: "Pelo WhatsApp (11) 98840-2174 ou pelo e-mail do seu escritório — nossa equipe responde diretamente por lá.",
  },
];

export default function PortalContabilLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="rs">
      <nav className="rs-nav">
        <div className="rs-container rs-nav-inner">
          <a href="#top" className="rs-logo">
            <span className="rs-logo-mark" aria-hidden="true">
              <SparkleIcon width={15} height={15} stroke="#fff" />
            </span>
            PortalContabil.cloud
          </a>
          <div className="rs-nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="rs-nav-actions">
            <a href="/login" className="rs-btn rs-btn-secondary">
              Entrar
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rs-btn rs-btn-primary">
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header id="top" className="rs-hero">
        <div className="rs-hero-glow" />
        <div className="rs-container rs-hero-inner">
          <div className="rs-eyebrow">
            <span className="rs-eyebrow-dot" />
            Feito para escritórios de contabilidade
          </div>
          <h1>
            O portal completo para o seu <span className="rs-hero-gradient-text">escritório de contabilidade</span>
          </h1>
          <p>
            Licenciamento de produtos, cadastro de clientes e CNPJs, e conciliação contábil com relatórios prontos
            para exportar — tudo em um único portal, com o controle de acesso que o seu time precisa.
          </p>
          <div className="rs-hero-ctas">
            <a href="/login" className="rs-btn rs-btn-primary rs-btn-lg">
              Entrar no portal
              <ArrowRightIcon width={17} height={17} />
            </a>
            <a href="#como-funciona" className="rs-btn rs-btn-secondary rs-btn-lg">
              Ver como funciona
            </a>
          </div>

          <div className="rs-hero-mock" role="img" aria-label="Prévia do Portal Contábil">
            <div className="rs-hero-mock-bar">
              <span className="rs-hero-mock-dot" />
              <span className="rs-hero-mock-dot" />
              <span className="rs-hero-mock-dot" />
            </div>
            <div className="rs-hero-mock-screen">
              <div className="rs-hero-mock-side">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rs-hero-mock-pill" style={{ width: `${70 - i * 6}%` }} />
                ))}
              </div>
              <div className="rs-hero-mock-main">
                <div className="rs-hero-mock-block" style={{ height: 28, width: "40%" }} />
                <div className="rs-hero-mock-block" style={{ height: 90 }} />
                <div style={{ display: "flex", gap: 12 }}>
                  <div className="rs-hero-mock-block" style={{ height: 64, flex: 1 }} />
                  <div className="rs-hero-mock-block" style={{ height: 64, flex: 1 }} />
                  <div className="rs-hero-mock-block" style={{ height: 64, flex: 1 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Benefits */}
      <section className="rs-section" id="beneficios">
        <div className="rs-container">
          <div className="rs-section-head">
            <h2 className="rs-heading-2">Feito para o dia a dia do escritório</h2>
            <p className="rs-subheading">
              Cada tela foi pensada pra reduzir o tempo entre "preciso disso" e "está resolvido".
            </p>
          </div>
          <div className="rs-grid rs-grid-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rs-card">
                <div className="rs-icon-tile">
                  <b.icon width={20} height={20} stroke="#fff" />
                </div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="rs-section" id="como-funciona" style={{ background: "var(--rs-bg-alt)" }}>
        <div className="rs-container">
          <div className="rs-section-head">
            <h2 className="rs-heading-2">Do cadastro à operação em 3 passos</h2>
            <p className="rs-subheading">Sem curva de aprendizado, sem etapas escondidas.</p>
          </div>
          <div className="rs-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rs-step">
                <div className="rs-step-num">{i + 1}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="rs-section" id="recursos">
        <div className="rs-container">
          <div className="rs-section-head">
            <h2 className="rs-heading-2">Tudo que o seu escritório precisa</h2>
            <p className="rs-subheading">Recursos pensados para quem administra clientes, CNPJs e licenças no dia a dia.</p>
          </div>
          <div className="rs-grid rs-grid-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rs-feature-row" style={{ borderBottom: "none" }}>
                <div className="rs-feature-icon">
                  <f.icon width={18} height={18} />
                </div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="rs-section" id="faq" style={{ background: "var(--rs-bg-alt)" }}>
        <div className="rs-container">
          <div className="rs-section-head">
            <h2 className="rs-heading-2">Perguntas frequentes</h2>
            <p className="rs-subheading">Não achou o que procurava? Fale com a gente pelo WhatsApp.</p>
          </div>
          <div className="rs-faq">
            {FAQS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={item.q} className={`rs-faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="rs-faq-q"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    {item.q}
                    <span className="rs-faq-icon">
                      <PlusIcon width={18} height={18} />
                    </span>
                  </button>
                  <div className="rs-faq-a">
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="rs-section">
        <div className="rs-container">
          <div className="rs-final-cta">
            <h2>Pronto para organizar o seu escritório?</h2>
            <p>Fale com a gente pelo WhatsApp e conheça o PortalContabil.cloud, ou entre direto se já tem cadastro.</p>
            <div className="rs-final-cta-actions">
              <a href="/login" className="rs-btn rs-btn-primary rs-btn-lg">
                Entrar no portal
                <ArrowRightIcon width={17} height={17} />
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rs-btn rs-btn-secondary rs-btn-lg">
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="rs-footer">
        <div className="rs-container">
          <div className="rs-footer-top">
            <div className="rs-footer-brand">
              <a href="#top" className="rs-logo">
                <span className="rs-logo-mark" aria-hidden="true">
                  <SparkleIcon width={15} height={15} stroke="#fff" />
                </span>
                PortalContabil.cloud
              </a>
              <p>Portal de licenciamento, gestão de clientes e conciliação contábil para escritórios de contabilidade.</p>
              <div className="rs-footer-social">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
                  <WhatsAppIcon width={18} height={18} />
                </a>
              </div>
            </div>
            <div className="rs-footer-col">
              <h5>Produto</h5>
              <ul>
                <li><a href="#recursos">Recursos</a></li>
                <li><a href="#como-funciona">Como funciona</a></li>
                <li><a href="#faq">Perguntas frequentes</a></li>
              </ul>
            </div>
            <div className="rs-footer-col">
              <h5>Portal</h5>
              <ul>
                <li><a href="/login">Entrar</a></li>
                <li><a href="/esqueci-minha-senha">Esqueci minha senha</a></li>
              </ul>
            </div>
            <div className="rs-footer-col">
              <h5>Contato</h5>
              <ul>
                <li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp: (11) 98840-2174</a></li>
                <li><a href="mailto:contato@portalcontabil.cloud">contato@portalcontabil.cloud</a></li>
              </ul>
            </div>
          </div>
          <div className="rs-footer-bottom">
            <span>© {new Date().getFullYear()} PortalContabil.cloud. Todos os direitos reservados.</span>
            <div className="rs-footer-bottom-links">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a href="/login">Entrar</a>
            </div>
          </div>
        </div>
      </footer>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rs-whatsapp-fab"
        aria-label="Falar no WhatsApp"
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}
