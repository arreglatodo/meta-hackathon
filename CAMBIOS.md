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

## 2026-10-26 12:55 · Política de datos: el código es público, la data de ArreglaTodo no

**Commit**: `c2c6e90`

Antes el repo decía que no tenía datos reales, pero no explicaba cómo se iba a usar la historia
de ArreglaTodo para estimar las horas sin hacerla pública. Ahora hay una política escrita, para
el equipo y para los jurados. Lo pidió Máximo: HomePlan es un spin-off de ArreglaTodo, y lo que
pasa por ArreglaTodo es información privilegiada.

### Qué cambió
- **`docs/DATA-POLICY.md`**:
  - Es público el código, la forma del estimador (qué datos usa y cómo los combina), una
    calibración de ejemplo para que cualquiera pueda correrlo, y resultados agregados (cuántos
    ejemplos y cuánto se equivoca en horas).
  - Es privado todo lo de ArreglaTodo: solicitudes, cotizaciones, trabajos, chats, precios y la
    calibración real que sale de esa historia.
  - Es como un modelo de código abierto con pesos privados.
- **No se cifra nada dentro del repo.** Un archivo cifrado en un repo público queda público para
  siempre si se filtra la clave, y no se borra de la historia de git. Lo privado vive afuera, en
  el Supabase privado de HomePlan.
- **El circuito del estimador:**
  1. Un script lee ArreglaTodo solo con permiso de lectura y se queda con datos que no
     identifican a nadie: ambientes, baños, frecuencia, extras y horas cotizadas.
  2. Esos datos se guardan en el Supabase privado de HomePlan.
  3. El estimador se calibra ahí, y la app carga la calibración solo del lado del servidor.
- **Cuánta data hay**: más de mil trabajos de limpieza describen la casa y las horas (consulta
  de solo conteos sobre `arreglatodo-db`, 26/10). *Corregido el 26/10 a las 13:10*: esta
  entrada daba las cifras exactas, y Máximo pidió redondearlas porque el repo es público.
- `README.md` (sección "Data and privacy") y `CLAUDE.md` (regla para cualquier agente) apuntan a
  la política.

### Archivos clave
- `docs/DATA-POLICY.md`, `README.md`, `CLAUDE.md`.

**Pendiente**:
- La política dice que ArreglaTodo autoriza el uso de su historia: conviene que quede firmado
  por los dos socios (Máximo y Lorenzo), aunque sea un mail.
- Armar el script de extracción y la calibración.

## 2026-10-26 12:47 · Borroneo automático de personas en los videos, con SAM 3.1

**Commit**: `bc2d421`

Antes, el video de prueba mostraba a dos personas en la mesa del comedor y tenía audio, así que
no se podía usar en la demo pública. Ahora hay una herramienta que encuentra las personas cuadro
por cuadro con SAM 3.1, las borronea y saca el audio. Lo pidió Máximo para la demo, y sirve
también como función del producto: HomePlan puede borronear a la gente de cada video de
cliente antes de guardarlo.

### Qué cambió
- **SAM falló con el video entero** (62 segundos, 1.872 cuadros: error 502 dos veces), aunque
  la documentación dice que acepta hasta 15.000 cuadros. Con tramos de 10 segundos funciona: la
  herramienta parte el video, procesa los tramos en paralelo y los vuelve a unir. Tarda ~32 s.
- Detectó personas en 442 cuadros: las dos de la mesa (de 23,7 a 31,5 s) y algunos aciertos
  falsos sobre ropa colgada en el baño. Se borronea todo lo que marca, por las dudas.
- Revisado a ojo, un cuadro por segundo: no quedó nadie sin borronear.
- Costo: unos US$0,37.
- El video borroneado **no está en el repo**: se le pasó a Máximo aparte.

### Archivos clave
- `scripts/sam-boxes.mjs` (`pnpm sam:boxes <video> <concepto> <salida.json>`).
- `scripts/blur-boxes.py` (`pnpm blur <video> <cajas.json> <salida.mp4>`).
- `docs/probes/2026-10-26-first-video.md`: sección "Follow-up".

**Pendiente**:
- Pasar el borroneo al circuito real, para que corra solo con cada video que llega.
- Avisar en `#office-hours` del Discord de Meta que SAM da 502 con videos de ~1.900 cuadros.

## 2026-10-26 12:34 · Primera prueba con un video real: Muse Spark inventaría, SAM no cuenta

**Commit**: `8fea08c`

Antes no sabíamos si el video servía para cotizar. Era el riesgo principal del plan, y la idea
original era que SAM 3.1 contara ambientes y artefactos. Ahora está probado con un video real de
62 segundos de un apartamento, **grabado con lentes Meta Ray-Ban Gen 3 Wayfarer** y mandado por
WhatsApp (es exactamente el camino que haría un cliente). El resultado cambia el diseño:

- **SAM 3.1 no sirve para contar.** Al recorrer la casa, el mismo objeto sale y vuelve a entrar
  en cuadro y SAM lo toma como otro: devolvió 4 sofás (hay 1 o 2), 2 camas (hay 1), 16 puertas,
  y no vio la pileta del baño. El inodoro y la pileta de la cocina sí los vio bien.
- **Muse Spark 1.3 armó el inventario correcto** mirando el mismo video: escritorio, pasillo,
  living con balcón, comedor, cocina, dormitorio y baño, sin contar dos veces, con tipo de piso,
  vidrios, desorden, tareas especiales y lo que no pudo ver. Tardó 20 segundos.
- **Nuevo reparto**: Muse Spark arma el inventario; SAM marca en la imagen las superficies que
  llevan tiempo (vidrios, pisos, mesadas, baño) y compara antes y después de cada visita.
- **Tiempo**: 7 pedidos a SAM en paralelo, más la subida, tardan 20 segundos. Todo entra en una
  función de Vercel de 60 s: **no hace falta Modal para esto**.
- El README ahora dice a quién va dirigido: cualquiera con smartphone y WhatsApp, con los Meta
  Ray-Ban como versión manos libres (el cliente recorre la casa, el prestador muestra el
  trabajo), y Uruguay como mercado de validación de un producto que sirve en cualquier mercado
  que vive en WhatsApp.

### Archivos clave
- `docs/probes/2026-10-26-first-video.md`: el informe de la prueba, con la tabla de SAM.
- `scripts/probe-sam.mjs`, `scripts/probe-spark-video.mjs` (`pnpm probe:sam`, `pnpm probe:spark`).
- `README.md`: secciones "The problem" y "Who it's for".

**Pendiente**:
- El video no está en el repo (muestra una casa real y a dos personas). Para la demo pública hay
  que grabar otro sin personas, o borronearlas.
- Próxima prueba: SAM con fotos de antes y después de la misma superficie.

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
