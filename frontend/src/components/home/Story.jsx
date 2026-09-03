import { historia } from '../../content/story.js'
import { SectionLabel } from '../ds/index.js'

export function Story() {
  return (
    <section className="section story" id="nossa-historia">
      <div className="section__head">
        <SectionLabel>Nossa História</SectionLabel>
        <p className="story__lead">{historia.chamada}</p>
      </div>

      <div className="story__prose">
        {historia.paragrafos.map((paragrafo) => (
          <p key={paragrafo.slice(0, 40)}>{paragrafo}</p>
        ))}
      </div>

      {historia.fecho && <p className="story__fecho">{historia.fecho}</p>}
    </section>
  )
}
