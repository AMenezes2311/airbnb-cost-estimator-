# Estimador de Estadias

Aplicação full stack em Next.js (App Router) que ajuda anfitriões do Airbnb a registrar reservas, acompanhar o total de hóspedes e calcular o custo de limpeza por apartamento.

## 🌟 Principais recursos

- Registro manual de estadias com datas, apartamentos e número de hóspedes
- Upload de imagem da reserva para extração automática de dados (OCR)
- Cálculo automático de noites e custo previsto por apartamento
- Painel com totais consolidados em tempo real (estadias, hóspedes e custo)
- Interface em português, responsiva e pensada para fluxo rápido de entrada
- Persistência em Supabase (Postgres + API)

## 🚀 Início rápido

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie o arquivo `.env.local` com base em `.env.local.example` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. No painel do Supabase, execute o SQL de `supabase/schema.sql` no SQL Editor.
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse [http://localhost:3000](http://localhost:3000) e comece a lançar estadias.

## 🧮 Como os cálculos funcionam

- **Noites**: diferença entre check-in e check-out (mínimo de 1).
- **Custo**: regras específicas por apartamento (ex.: A1 custa R$80 + R$15 por hóspede extra acima de 6). Os demais apartamentos podem ser configurados diretamente no arquivo `src/lib/calculations.ts`.
- **Hóspedes totais**: soma dos hóspedes de todas as estadias registradas.

## 🖼️ Importação por imagem

- No formulário principal, clique em **Enviar imagem da reserva**.
- A aplicação usa OCR para identificar **check-in**, **check-out** e **adultos**.
- Crianças são ignoradas por enquanto (ex.: "3 adultos, 2 crianças" vira 3 hóspedes).
- O código de apartamento é mapeado via alias (ex.: `A7` → `A407`) em `src/lib/reservationImageParser.ts`.

## 📁 Estrutura do projeto

```
src/
├─ app/
│  ├─ page.tsx            # Dashboard principal (UI em português)
│  └─ layout.tsx          # Layout raiz e metadados
├─ components/            # Formulários, listas e cartões
├─ hooks/
│  └─ useTrips.ts         # CRUD no Supabase + regras de negócio
└─ lib/
   ├─ calculations.ts     # Regras de custo por apartamento, datas e formatos
   ├─ supabase.ts         # Cliente e tipagem do banco
   └─ types.ts            # Tipagem compartilhada
```

## 🗃️ Persistência opcional com Supabase

1. Crie um projeto em [app.supabase.com](https://app.supabase.com).
2. Execute o SQL disponível em `supabase/schema.sql`.
3. Renomeie `.env.local.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Rode `npm run dev` e valide no dashboard se aparece o aviso "Supabase conectado".

## 🔮 Extensões futuras sugeridas

1. Importação automática de e-mails de confirmação do Airbnb.
2. Exportação em CSV do histórico.
3. Categorias adicionais de insumos (toalhas, amenities, etc.).
4. Modelos preditivos para sazonalidade e consumo real.

## 🛠️ Scripts úteis

- `npm run dev`: ambiente de desenvolvimento
- `npm run build`: build de produção
- `npm start`: servidor Next.js em modo produção
- `npm run lint`: análise estática

Bom planejamento de insumos e boas hospedagens! ✨
