# CAMBIOS

Bitácora de todo lo que se hace en HomePlan durante la Meta Global AI Developer Hackathon.
Sirve para auditar y como prueba de qué se construyó durante el evento (las reglas exigen
que se pueda identificar).

**Reglas** (completas en `CLAUDE.md`):
- Todo commit que cambia el proyecto lleva su entrada, y todo PR incluye las suyas.
- La más nueva va arriba, con fecha y hora de Montevideo: `## YYYY-MM-DD HH:MM · Título`.
- Adentro: hash del commit, qué cambió y por qué (cómo estaba antes y cómo queda), archivos
  clave y qué queda pendiente.

---

## 2026-10-26 11:49 · Base del proyecto: Next.js, cliente de Meta y simulador de chat

**Commit**: `603acb8`

Antes el repo tenía solo un README de una línea. Ahora tiene la base de HomePlan andando
contra la API de Meta: una página que simula el chat de WhatsApp, el agente respondiendo con
Muse Spark 1.3 y un panel que muestra cada paso que da el agente. Es el primer día de la
hackathon (arrancó hoy a las 12:00 hora del Este de EE.UU.).

### Qué cambió
- App Next.js 15 + TypeScript + Tailwind, con pnpm.
- Un solo cliente para todos los modelos de Meta, con el SDK de OpenAI apuntando a
  `https://api.meta.ai/v1`. Los nombres de los modelos están en un solo lugar.
- Primer agente: responde en español rioplatense, pide el video de la casa y **no da precios
  ni horas** (eso lo va a calcular el sistema, no el modelo). Probado: a "¿cuánto sale?"
  contesta pidiendo el video.
- Simulador de chat estilo WhatsApp y panel de pasos del agente (modelo, entrada, salida y
  tiempo de cada llamada).
- `pnpm smoke`: prueba que la clave funciona y que Muse Spark responde.
- Documentos: `README.md` (para los jurados, con la tabla de qué existía antes y qué se hizo
  en la hackathon), `STACK.md` (el stack confirmado hoy y por qué), `CLAUDE.md` (reglas del
  repo, incluida esta bitácora), `.env.example` y licencia MIT.

### Archivos clave
- `src/lib/meta.ts`: cliente de Meta y nombres de modelos.
- `src/lib/agent/run.ts`, `src/lib/agent/prompt.ts`: el agente y sus reglas.
- `src/app/api/chat/route.ts`: el endpoint del simulador.
- `src/components/ChatSimulator.tsx`: chat y panel de pasos.

**Pendiente**:
- Cargar `MODEL_API_KEY` en Vercel cuando se cree el proyecto (en esta sesión la pone el
  proxy).
- Crear el Supabase nuevo (separado de producción) y el número de prueba en Kapso.
- Hacer público el repo antes de la entrega.
