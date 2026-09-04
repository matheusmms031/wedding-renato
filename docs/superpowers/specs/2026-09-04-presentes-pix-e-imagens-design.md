# Presentes: QR Code PIX e imagens

Data: 2026-09-04

## Problema

A lista de presentes hoje só reserva um item — não há como pagar. O convidado
clica em "Presentear", o presente fica no nome dele, e o dinheiro é combinado
por fora. Além disso a tabela `gifts` tem uma coluna `image_url` que nunca foi
usada: os cards são só texto.

Queremos que o convidado veja um QR Code PIX com o valor do presente, pague pelo
app do banco, e confirme; e que o admin possa subir uma foto de cada presente.

## Decisões

| Decisão | Escolha | Por quê |
|---|---|---|
| Onde a imagem mora | Disco, em volume Docker | Não incha o banco nem os dumps; o nginx serve direto, sem passar pelo Node |
| Chave PIX | Configurável no painel | Muda sem redeploy |
| Fluxo de pagamento | QR → paga → confirma → reserva | A reserva reflete uma ação consciente do convidado |
| Confirmação do pagamento | Manual, pelos noivos | Integrar PSP exige conta, credenciais e webhook — desproporcional para 48 convidados |
| Reserva temporária | Não haverá | Complexidade (expiração, limpeza) desproporcional à escala |
| Onde o QR é desenhado | Backend, em SVG | Evita somar uma biblioteca de QR ao bundle que todo convidado baixa |

## Modelo de dados

**Tabela nova `settings`** — chave-valor (`key` PK varchar(64), `value` text,
timestamps). Chave-valor em vez de colunas tipadas para que a próxima
configuração não exija migration.

Chaves usadas:

- `pix_key` — chave aleatória, formato UUID (36 caracteres)
- `pix_receiver_name` — máximo 25 caracteres (campo 59 do EMV)
- `pix_receiver_city` — máximo 15 caracteres (campo 60 do EMV)

Os limites são normativos do Bacen, não escolha nossa: exceder gera um BR Code
que o app do banco recusa. Valida no schema da API e no formulário.

**`gifts.image_url`** — coluna existente, sem migration. Passa a guardar o
caminho relativo `/uploads/<uuid>.<ext>`.

## Upload de imagens

`POST /api/admin/gifts/:id/image`, multipart, atrás de `requireAdmin`.

- Nome do arquivo é um UUID gerado por nós. O nome vindo do cliente é ignorado —
  é vetor de path traversal.
- Tipo aceito: JPEG, PNG, WebP, verificado pelos **bytes iniciais** do arquivo,
  não pela extensão nem pelo `Content-Type` (ambos vêm do cliente).
- Limite de 5 MB.
- Trocar a imagem apaga a anterior. Apagar o presente apaga o arquivo.

**Volume compartilhado.** O nginx roda no container `frontend` e o upload cai no
`backend` — sistemas de arquivos distintos. Um volume `uploads-data` é montado
nos dois: leitura e escrita no backend, somente leitura no frontend. O nginx
ganha `location /uploads/`.

Consequência operacional: **são dois volumes no backup**, não um. O dump do
Postgres não cobre as imagens. Registrar no runbook de deploy.

## PIX

`backend/src/lib/pix.js` — função pura `montarPayloadPix({ chave, nome, cidade,
valorCentavos })` que devolve a string do BR Code no formato EMV:

| Campo | Conteúdo |
|---|---|
| 00 | Payload Format Indicator: `01` |
| 26 | GUI `br.gov.bcb.pix` + chave |
| 52 | Merchant Category Code: `0000` |
| 53 | Moeda: `986` (BRL) |
| 54 | Valor, em reais com duas casas |
| 58 | País: `BR` |
| 59 | Nome do recebedor |
| 60 | Cidade do recebedor |
| 62 | Additional Data: txid `***` |
| 63 | CRC16-CCITT dos bytes anteriores |

Sem I/O, sem dependência de banco — recebe dados, devolve string. É o ponto mais
fácil de errar e o mais fácil de testar.

`GET /api/gifts/:id/pix` devolve `{ payload, qrcodeSvg }`, autenticado. Endpoint
separado da listagem: a chave só sai do servidor quando alguém vai de fato pagar.

## Fluxo do convidado

1. Card mostra a foto, se houver.
2. "Presentear" abre um modal: foto, nome, valor, QR, botão "copiar código PIX".
3. "Já fiz o PIX" chama o `claim` que já existe. "Cancelar" fecha.
4. Acessibilidade: foco preso no diálogo, `Esc` fecha, `aria-modal`.

**Corrida conhecida e aceita.** Entre ver o QR e confirmar, outra pessoa pode
levar o item — e o caso ruim é alguém pagar e então descobrir isso. O backend já
responde `GIFT_UNAVAILABLE`; a interface trata com mensagem específica, dizendo
que o presente foi escolhido enquanto ele pagava e orientando a falar com os
noivos. O dinheiro chegou; a correção é humana.

## Testes

Somam-se aos 48 existentes:

- `montarPayloadPix` contra um BR Code de referência, com CRC conferido
- rejeição de nome acima de 25 e cidade acima de 15 caracteres
- upload recusando tipo inválido (inclusive extensão mentindo sobre o conteúdo)
- upload recusando acima de 5 MB
- upload aceitando um PNG real e gravando com nome UUID
- `GET /gifts/:id/pix` exigindo autenticação
- `GET/PUT /admin/settings` exigindo admin

## Fora de escopo

- Confirmação automática de pagamento (webhook de PSP)
- Reserva temporária com expiração
- Redimensionamento ou otimização das imagens enviadas
