import { useState, type ReactNode, type SVGProps } from "react";
import "./rodrisaas.css";

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
const StarIcon = (p: IconProps) => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z" />
  </svg>
);
const LightningIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
  </svg>
);
const PaletteIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M12 2a10 10 0 1 0 0 20c1.4 0 2-.8 2-2 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1 .8-1.8 1.8-1.8H17a3 3 0 0 0 3-3c0-5.5-4-10.4-8-10.4Z" />
    <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="7" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
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
const MagicWandIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M4 20 16 8M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 11l.7 1.4 1.4.7-1.4.7-.7 1.4-.7-1.4L17 13.1l1.3-.7z" />
  </svg>
);
const GlobeIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
  </svg>
);
const PlugIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M9 2v5M15 2v5M7 8h10l-1 5a4 4 0 0 1-4 3.5v3M11 16.5v0" />
  </svg>
);
const ShieldIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
  </svg>
);
const PlusIcon = (p: IconProps) => (
  <svg {...iconBase} {...p} aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const TwitterIcon = (p: IconProps) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M18.9 3H22l-7.6 8.7L23 21h-6.9l-5.4-6.5L4.6 21H1.4l8.2-9.3L1 3h7l4.9 5.9L18.9 3Zm-1.2 16.2h1.7L7.4 4.7H5.6l12.1 14.5Z" />
  </svg>
);
const LinkedinIcon = (p: IconProps) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5ZM3 9.7h4V21H3zM9.5 9.7H13v1.6h.05c.5-.9 1.7-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5V21h-4v-5.3c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4z" />
  </svg>
);
const GithubIcon = (p: IconProps) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2a10 10 0 0 0-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  </svg>
);

/* ------------------------------------------------------------------ */

const BENEFITS: { icon: (p: IconProps) => ReactNode; title: string; desc: string }[] = [
  {
    icon: LightningIcon,
    title: "Velocidade real",
    desc: "Do briefing ao site publicado em minutos — sem esperar por orçamento, briefing ou handoff.",
  },
  {
    icon: PaletteIcon,
    title: "Design com bom gosto",
    desc: "A IA aplica hierarquia, espaçamento e tipografia com padrão editorial, não modelos genéricos.",
  },
  {
    icon: CodeSlashIcon,
    title: "Zero código necessário",
    desc: "Edite tudo visualmente. Quem sabe código pode ir além exportando componentes limpos.",
  },
  {
    icon: StackIcon,
    title: "Pronto para escalar",
    desc: "Infraestrutura, performance e SEO já vêm configurados desde o primeiro deploy.",
  },
];

const STEPS = [
  {
    title: "Descreva sua visão",
    desc: "Conte o que você precisa em poucas frases — objetivo, público e estilo. A IA entende o contexto do seu negócio.",
  },
  {
    title: "A IA gera o site",
    desc: "Em segundos você recebe uma estrutura completa: seções, copy, imagens e identidade visual coerentes entre si.",
  },
  {
    title: "Publique em 1 clique",
    desc: "Ajuste o que quiser no editor visual e publique com domínio, SSL e performance já otimizados.",
  },
];

const FEATURES: { icon: (p: IconProps) => ReactNode; title: string; desc: string }[] = [
  { icon: CursorClickIcon, title: "Editor visual em tempo real", desc: "Arraste, edite e veja o resultado instantaneamente, sem recarregar a página." },
  { icon: MagicWandIcon, title: "Componentes gerados por IA", desc: "Peça uma seção nova em linguagem natural e receba um componente pronto e editável." },
  { icon: GlobeIcon, title: "SEO otimizado automaticamente", desc: "Meta tags, sitemap e performance técnica configurados sem esforço manual." },
  { icon: StackIcon, title: "Hospedagem inclusa", desc: "CDN global, certificado SSL e backups automáticos em todos os planos." },
  { icon: PlugIcon, title: "Integrações nativas", desc: "Conecte analytics, CRM, formulários e pagamentos sem escrever uma linha de código." },
  { icon: ShieldIcon, title: "Segurança de nível empresarial", desc: "Criptografia de ponta a ponta e conformidade com as principais normas do mercado." },
];

const TESTIMONIALS = [
  {
    quote: "Trocamos uma agência de design por um fluxo interno. Em duas semanas publicamos mais páginas do que no trimestre anterior inteiro.",
    name: "Marina Petrov",
    role: "Head de Marketing, Vórtex",
  },
  {
    quote: "O que mais impressiona é o bom gosto do resultado. Não parece gerado — parece feito por um estúdio de design sênior.",
    name: "Thiago Alencar",
    role: "Fundador, Cedro Studio",
  },
  {
    quote: "Migramos três produtos para a plataforma. O time de produto ganhou autonomia total sobre o site sem depender de engenharia.",
    name: "Helena Suzuki",
    role: "VP de Produto, Aurora Labs",
  },
];

const PLANS = [
  {
    name: "Starter",
    desc: "Para quem está validando uma ideia.",
    price: { monthly: 0, yearly: 0 },
    featured: false,
    cta: "Começar grátis",
    features: ["1 site publicado", "Domínio RodriSaas.app", "Editor visual com IA", "Componentes essenciais", "Suporte por e-mail"],
  },
  {
    name: "Pro",
    desc: "Para produtos e negócios em crescimento.",
    price: { monthly: 79, yearly: 63 },
    featured: true,
    cta: "Assinar Pro",
    features: [
      "Sites ilimitados",
      "Domínio próprio incluso",
      "Componentes com IA generativa",
      "SEO avançado + analytics",
      "Integrações nativas",
      "Suporte prioritário",
    ],
  },
  {
    name: "Enterprise",
    desc: "Para times que precisam de escala e governança.",
    price: { monthly: 249, yearly: 199 },
    featured: false,
    cta: "Falar com vendas",
    features: [
      "Tudo do plano Pro",
      "SSO e permissões por time",
      "SLA de suporte dedicado",
      "Ambiente white-label",
      "Gerente de conta dedicado",
    ],
  },
];

const FAQS = [
  {
    q: "Preciso saber programar para usar o RodriSaas?",
    a: "Não. O editor visual cobre 100% do fluxo de criação. Times técnicos podem exportar componentes para customizações avançadas, mas isso é opcional.",
  },
  {
    q: "A IA realmente entende o meu negócio ou entrega algo genérico?",
    a: "A geração usa o contexto que você fornece — setor, público e objetivo — para montar estrutura, copy e identidade visual coerentes, não um template fixo reaproveitado.",
  },
  {
    q: "Posso usar meu próprio domínio?",
    a: "Sim, a partir do plano Pro. Basta apontar o DNS e o certificado SSL é emitido automaticamente, sem configuração manual.",
  },
  {
    q: "É possível migrar um site que já existe?",
    a: "Sim. Nosso time de suporte ajuda na migração de conteúdo e estrutura para qualquer plano Pro ou Enterprise, sem custo adicional.",
  },
  {
    q: "Como funciona o cancelamento?",
    a: "Você pode cancelar a qualquer momento direto no painel, sem multa ou período de fidelidade. Seus dados ficam disponíveis para exportação por 30 dias.",
  },
  {
    q: "Vocês oferecem desconto para equipes maiores?",
    a: "Sim. O plano Enterprise é personalizado por volume de uso e número de times — fale com o nosso time comercial para uma proposta sob medida.",
  },
];

const currency = (v: number) =>
  v === 0 ? "Grátis" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

export default function RodriSaasLanding() {
  const [yearly, setYearly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="rs">
      <nav className="rs-nav">
        <div className="rs-container rs-nav-inner">
          <a href="#top" className="rs-logo">
            <span className="rs-logo-mark" aria-hidden="true">
              <SparkleIcon width={15} height={15} stroke="#fff" />
            </span>
            RodriSaas
          </a>
          <div className="rs-nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#precos">Preços</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="rs-nav-actions">
            <a href="#" className="rs-btn rs-btn-secondary">
              Entrar
            </a>
            <a href="#precos" className="rs-btn rs-btn-primary">
              Começar grátis
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
            Novo — gerador com IA v2.0
          </div>
          <h1>
            Crie sites profissionais em <span className="rs-hero-gradient-text">minutos</span>, não semanas
          </h1>
          <p>
            RodriSaas usa inteligência artificial para transformar uma ideia em um site pronto para produção —
            com design de estúdio, performance de ponta e zero código.
          </p>
          <div className="rs-hero-ctas">
            <a href="#precos" className="rs-btn rs-btn-primary rs-btn-lg">
              Começar gratuitamente
              <ArrowRightIcon width={17} height={17} />
            </a>
            <a href="#como-funciona" className="rs-btn rs-btn-secondary rs-btn-lg">
              Ver como funciona
            </a>
          </div>

          <div className="rs-hero-mock" role="img" aria-label="Prévia do editor visual do RodriSaas">
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

      {/* Trusted by */}
      <section className="rs-trusted">
        <div className="rs-container">
          <div className="rs-trusted-label">Times de produto confiam no RodriSaas</div>
          <div className="rs-trusted-row">
            <span>Nébula</span>
            <span>Vórtex</span>
            <span>Aurora Labs</span>
            <span>Cedro Studio</span>
            <span>Prisma</span>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="rs-section" id="beneficios">
        <div className="rs-container">
          <div className="rs-section-head">
            <h2 className="rs-heading-2">Feito para quem não pode esperar</h2>
            <p className="rs-subheading">
              Cada decisão de produto foi pensada para eliminar a distância entre a sua ideia e um site no ar.
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
            <h2 className="rs-heading-2">Do zero ao publicado em 3 passos</h2>
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
            <h2 className="rs-heading-2">Tudo que um time de produto precisa</h2>
            <p className="rs-subheading">Recursos de nível empresarial, com a simplicidade de uma ferramenta feita para todo mundo usar.</p>
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

      {/* Testimonials */}
      <section className="rs-section" style={{ background: "var(--rs-bg-alt)" }}>
        <div className="rs-container">
          <div className="rs-section-head">
            <h2 className="rs-heading-2">Times reais, resultados reais</h2>
            <p className="rs-subheading">Uma amostra de quem já tirou o site do papel com o RodriSaas.</p>
          </div>
          <div className="rs-grid rs-grid-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rs-testimonial">
                <div className="rs-stars" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
                <p>&ldquo;{t.quote}&rdquo;</p>
                <div className="rs-testimonial-author">
                  <span className="rs-avatar" aria-hidden="true">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="rs-section" id="precos">
        <div className="rs-container">
          <div className="rs-section-head">
            <h2 className="rs-heading-2">Planos simples, sem letras miúdas</h2>
            <p className="rs-subheading">Comece de graça. Faça upgrade quando o seu produto precisar de mais.</p>
          </div>

          <div className="rs-pricing-toggle">
            <span>Mensal</span>
            <button
              type="button"
              className={`rs-switch${yearly ? " is-on" : ""}`}
              role="switch"
              aria-checked={yearly}
              aria-label="Alternar entre cobrança mensal e anual"
              onClick={() => setYearly((v) => !v)}
            >
              <span className="rs-switch-knob" />
            </button>
            <span>Anual</span>
            <span className="rs-save-badge">Economize 20%</span>
          </div>

          <div className="rs-pricing-grid">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`rs-plan${plan.featured ? " rs-plan-featured" : ""}`}>
                {plan.featured && <span className="rs-plan-badge">Mais popular</span>}
                <div className="rs-plan-name">{plan.name}</div>
                <div className="rs-plan-desc">{plan.desc}</div>
                <div className="rs-plan-price">
                  <strong>{currency(yearly ? plan.price.yearly : plan.price.monthly)}</strong>
                  {plan.price.monthly > 0 && <span>/mês</span>}
                </div>
                <ul className="rs-plan-features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <CheckIcon width={16} height={16} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className={`rs-btn rs-btn-block ${plan.featured ? "rs-btn-primary" : "rs-btn-secondary"}`}
                >
                  {plan.cta}
                </a>
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
            <p className="rs-subheading">Não achou o que procurava? Fale com o nosso time.</p>
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
            <h2>Seu próximo site começa agora</h2>
            <p>Sem cartão de crédito. Sem instalação. Publique o primeiro site em menos de 10 minutos.</p>
            <div className="rs-final-cta-actions">
              <a href="#precos" className="rs-btn rs-btn-primary rs-btn-lg">
                Começar gratuitamente
                <ArrowRightIcon width={17} height={17} />
              </a>
              <a href="#faq" className="rs-btn rs-btn-secondary rs-btn-lg">
                Falar com vendas
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
                RodriSaas
              </a>
              <p>O construtor de sites com inteligência artificial para quem precisa publicar rápido e com qualidade de estúdio.</p>
              <div className="rs-footer-social">
                <a href="#" aria-label="RodriSaas no X (Twitter)">
                  <TwitterIcon />
                </a>
                <a href="#" aria-label="RodriSaas no LinkedIn">
                  <LinkedinIcon />
                </a>
                <a href="#" aria-label="RodriSaas no GitHub">
                  <GithubIcon />
                </a>
              </div>
            </div>
            <div className="rs-footer-col">
              <h5>Produto</h5>
              <ul>
                <li><a href="#recursos">Recursos</a></li>
                <li><a href="#precos">Preços</a></li>
                <li><a href="#como-funciona">Como funciona</a></li>
                <li><a href="#">Integrações</a></li>
              </ul>
            </div>
            <div className="rs-footer-col">
              <h5>Empresa</h5>
              <ul>
                <li><a href="#">Sobre nós</a></li>
                <li><a href="#">Carreiras</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Imprensa</a></li>
              </ul>
            </div>
            <div className="rs-footer-col">
              <h5>Recursos</h5>
              <ul>
                <li><a href="#">Documentação</a></li>
                <li><a href="#">Comunidade</a></li>
                <li><a href="#faq">Central de ajuda</a></li>
                <li><a href="#">Status</a></li>
              </ul>
            </div>
            <div className="rs-footer-col">
              <h5>Legal</h5>
              <ul>
                <li><a href="#">Privacidade</a></li>
                <li><a href="#">Termos de uso</a></li>
                <li><a href="#">Cookies</a></li>
                <li><a href="#">Segurança</a></li>
              </ul>
            </div>
          </div>
          <div className="rs-footer-bottom">
            <span>© {new Date().getFullYear()} RodriSaas. Todos os direitos reservados.</span>
            <div className="rs-footer-bottom-links">
              <a href="#">Privacidade</a>
              <a href="#">Termos</a>
              <a href="#">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
