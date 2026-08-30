# Fotos

Coloque aqui os arquivos e ligue-os em `src/content/story.js`.

- `casal.jpg` — **em uso** no painel do hero. Formato retrato funciona melhor;
  ela é recortada com `object-fit: cover`, com o enquadramento em `50% 22%`
  porque os rostos estão no terço superior do quadro.
- `renato.jpg` e `marilia.jpg` — retratos individuais da seção "Quem Somos"
  (opcionais; sem eles a seção fica só com o nome e o texto).

O design system pede imagens de tom quente e luz natural — nada de tratamento
frio ou azulado, que brigaria com o verde e o dourado da paleta.

Se o rosto ficar cortado no recorte, ajuste `posicao` em `story.js`
(ex.: `'50% 30%'` puxa o enquadramento para cima).
