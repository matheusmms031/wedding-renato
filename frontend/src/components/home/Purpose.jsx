import { proposito } from '../../content/story.js'
import { ScriptHeading, SectionLabel } from '../ds/index.js'

export function Purpose() {
  return (
    <section className="section purpose" id="proposito">
      <div className="section__head">
        <SectionLabel>Um Só Propósito</SectionLabel>
        <ScriptHeading as="h2" size="md">
          {proposito.chamada}
        </ScriptHeading>
      </div>

      <div className="purpose__prose">
        {proposito.paragrafos.map((paragrafo) => (
          <p key={paragrafo.slice(0, 32)}>{paragrafo}</p>
        ))}
      </div>

      <figure className="scripture">
        <blockquote className="scripture__quote">“{proposito.versiculo.texto}”</blockquote>
        <figcaption className="scripture__ref">{proposito.versiculo.referencia}</figcaption>
      </figure>

      <div className="purpose__plans">
        <h3 className="purpose__plans-title">{proposito.planos.titulo}</h3>
        <p className="purpose__prose">{proposito.planos.texto}</p>
      </div>

      <figure className="scripture scripture--closing">
        <blockquote className="scripture__quote">“{proposito.fecho.texto}”</blockquote>
        <figcaption className="scripture__ref">{proposito.fecho.referencia}</figcaption>
      </figure>
    </section>
  )
}
