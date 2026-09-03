import { historia } from '../../content/story.js'
import { SectionLabel } from '../ds/index.js'

export function Story() {
  return (
    <section className="section story" id="nossa-historia">
      <div className="section__head">
        <SectionLabel>Nossa História</SectionLabel>
        <p className="story__lead">{historia.chamada}</p>
      </div>

      <ol className="timeline">
        {historia.momentos.map((momento) => (
          <li className="timeline__item" key={momento.texto.slice(0, 40)}>
            {momento.quando && <span className="timeline__when">{momento.quando}</span>}
            {/* Título é opcional: sem ele o marco fica só com o texto, e o
                traço dourado continua ancorando o item no filete. */}
            {momento.titulo && <h3 className="timeline__title">{momento.titulo}</h3>}
            <p className="timeline__text">{momento.texto}</p>
          </li>
        ))}
      </ol>

      {historia.fecho && <p className="story__fecho">{historia.fecho}</p>}
    </section>
  )
}
