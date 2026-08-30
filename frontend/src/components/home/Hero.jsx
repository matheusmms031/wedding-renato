import { fotoDoCasal } from '../../content/story.js'
import { DateBlock, Monogram, ScriptHeading } from '../ds/index.js'

export function Hero() {
  const foto = fotoDoCasal.src ? fotoDoCasal : null

  return (
    <section className="hero" id="inicio">
      <div className="hero__panel">
        {foto ? (
          <img
            className="hero__photo"
            src={foto.src}
            alt={foto.alt}
            style={{ objectPosition: foto.posicao }}
            /* É a maior imagem acima da dobra: carrega cedo e com prioridade,
               em vez do lazy que atrasaria a primeira pintura. */
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          /* Sem foto, o sistema pede campo de cor chapado — nada de fotografia
             inventada. Ver src/assets/fotos/LEIA-ME.md. */
          <div className="hero__crest">
            <Monogram size={72} inverted />
            <span className="hero__crest-caption">Palmas · Tocantins</span>
          </div>
        )}
      </div>

      <div className="hero__content">
        <p className="hero__invite">
          Você está convidado para a nossa cerimônia de casamento
        </p>
        {/* Linhas explícitas para poder corrigir cada uma opticamente. A tinta
            do Alex Brush transborda a caixa de avanço de forma assimétrica: a
            de "Renato &" cai 3,2px à esquerda do centro e a de "Marília" 5,6px
            à direita (medido a 128px no canvas). Centralizadas pela caixa, as
            duas pendem para lados opostos e o bloco parece torto.
            Os valores estão em `em` para escalarem junto com a fonte. */}
        <ScriptHeading as="h1" size="lg">
          <span className="hero__name-line" style={{ '--optico': '0.025em' }}>
            Renato &amp;
          </span>
          <span className="hero__name-line" style={{ '--optico': '-0.0438em' }}>
            Marília
          </span>
        </ScriptHeading>
        <DateBlock month="Dezembro" day="20" weekday="Domingo" time="Às 11h" year="2026" />
      </div>
    </section>
  )
}
