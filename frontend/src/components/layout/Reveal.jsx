import { domAnimation, LazyMotion, m, useReducedMotion } from 'motion/react'

/**
 * Envolve uma seção para ela deslizar para dentro quando entra na tela.
 *
 * `whileInView` com `once` é o motivo de a biblioteca estar aqui: resolve
 * observação de viewport, disparo único e limpeza sem um IntersectionObserver
 * escrito à mão em cada seção.
 *
 * Importa `m` dentro de `LazyMotion` com `domAnimation`, e não o `motion`
 * completo: o `motion` arrasta todo o motor da biblioteca — layout animations,
 * drag, gestos — e nada disso é usado aqui. Este site é aberto no celular, com
 * dados móveis, por quem só quer confirmar presença.
 *
 * O movimento é curto de propósito. O sistema de design não tem fundação de
 * motion — hover instantâneo, nada de bounce ou spring —, então aqui há apenas
 * deslocamento e opacidade.
 */
export function Reveal({ children, delay = 0, y = 24 }) {
  const semMovimento = useReducedMotion()

  // Quem pediu menos movimento no sistema recebe o conteúdo já posicionado.
  if (semMovimento) return children

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.55, delay, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
