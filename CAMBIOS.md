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

## 2026-10-26 16:16 · La versión publicada daba 404: se declara Next.js en `vercel.json`

**Commit**: `d746b9c`

Antes, `meta-hackathon-five.vercel.app` respondía "NOT_FOUND" en todas las rutas, aunque los
deploys de `main` terminaban bien. El proyecto de Vercel se creó cuando el repo tenía solo el
README, así que quedó configurado como sitio estático: no construía la app. Ahora `vercel.json`
declara que es Next.js y con qué comandos se instala y construye; eso manda sobre lo que quedó
guardado en el proyecto.

### Archivos clave
- `vercel.json`.

**Pendiente**: confirmar que la página y `/api/quote` respondan después de este deploy.

## 2026-10-26 13:40 · Primera versión para probar: cotización desde el video

**Commit**: `e948fe8`

Antes, HomePlan solo conversaba: el análisis del video existía como scripts de prueba, no en el
producto. Ahora la página principal cotiza una limpieza a partir de un video, con el precio real
por opción y por zona, y deja reservar por WhatsApp. Lo pidió Máximo: una primera versión en
producción para ver cómo cotiza y cómo manda la cotización. La idea: que el cliente no tenga que
dar todos los detalles (graba un video y ya tiene el precio), y que el prestador sepa qué va a
encontrar antes de llegar.

### Qué cambió
- **El circuito**, en ~13 segundos (probado en el navegador con el video de prueba):
  1. El cliente graba o elige un video y la zona (Montevideo o Ciudad de la Costa).
  2. El navegador toma un cuadro cada 2 segundos (hasta 30, de 512 px). **El video no sale del
     celular**, y lo que se manda pesa ~0,5 MB, adentro del límite de Vercel (4,5 MB).
  3. Muse Spark arma el perfil de la casa: dormitorios, baños, cocina, living, balcones, pisos,
     vidrios, desorden, suciedad, mascotas, tareas especiales y lo que no se vio.
  4. El estimador parte de lo que reservan casas parecidas (la calibración privada) y le suma lo
     que muestra el video: baños de más, muchos vidrios, desorden, suciedad, mascotas, balcón.
     Mínimo 3 horas, horas enteras (como vende ArreglaTodo), dos personas si pasa de 8.
  5. Los precios por visita, para las cuatro opciones (con o sin productos, con o sin
     aspiradora), con el precio por hora.
  6. El mensaje para el cliente, el resumen para el prestador (con los cuadros del video) y el
     botón "Reservar por WhatsApp", con la cotización ya escrita.
- **Precios**: la fórmula es la misma que usa la web de ArreglaTodo (`utils/tarifas.py` de
  `web-app-platform`): precio por hora × horas + productos + aspiradora + gestión por tramos. La
  fórmula es pública; los montos (la mediana de las tarifas activas por zona) y los tramos de la
  gestión van en la configuración privada (`HOMEPLAN_PRICING`), nunca en el repo.
- **Sin configuración privada, todo funciona con valores de ejemplo**, y la página lo avisa.
- El chat pasó a `/chat`.
- **`docs/PILOT.md`**: cómo validarlo con clientes reales (qué medir y en qué orden).

### Archivos clave
- `src/lib/home/`: `profile.ts`, `estimate.ts`, `pricing.ts`, `config.ts`, `quote.ts`.
- `src/app/api/quote/route.ts`, `src/components/QuoteFlow.tsx`, `src/app/page.tsx`.
- `docs/PILOT.md`, `STACK.md`, `docs/DEMO-SCRIPT.md`, `.env.example`.

**Pendiente** (en Vercel, a mano: el conector de Vercel de esta sesión es de otra cuenta):
- `MODEL_API_KEY`, `HOMEPLAN_HOURS_CALIBRATION`, `HOMEPLAN_PRICING` y
  `NEXT_PUBLIC_BOOKING_WHATSAPP`, en Production y Preview. Los valores se le pasaron a Máximo
  aparte.
- Guardar cada cotización y la respuesta del prestador después de la visita.
- Marcar las superficies con SAM 3.1 en la pantalla, los audios y WhatsApp.

## 2026-10-26 13:31 · El trabajo previo al kickoff se señala por commit, no por etiqueta

**Commit**: `a03a624`

Antes, el README y `CLAUDE.md` apuntaban a una etiqueta `pre-kickoff` que nunca llegó a GitHub:
el entorno de trabajo rechaza subir etiquetas, y el link del README daba error. Ahora apuntan
directo al commit `360f698`, el último anterior al kickoff, que es lo mismo y sí existe.

### Archivos clave
- `README.md`, `CLAUDE.md`.

**Pendiente**: si se quiere la etiqueta igual, se crea a mano desde GitHub (Releases → nueva
etiqueta `pre-kickoff` sobre `360f698`).

## 2026-10-26 13:30 · Guión del video y declaración de lo hecho antes del kickoff

**Commit**: `1b6e9a8`

Antes no había guión del video de 3 minutos, y el README decía que todo el repo se había
escrito durante la hackathon. No era exacto: el kickoff fue a las 12:00 hora del Este (13:00 en
Uruguay), y la base, las pruebas con el video, el borroneo y la política de datos se hicieron
esa mañana. Ahora eso está declarado como trabajo previo, y hay un guión que se va a ir
actualizando a medida que se construye el producto.

### Qué cambió
- **El commit `360f698`** marca el fin de lo anterior al kickoff (iba a ser una etiqueta
  `pre-kickoff`; ver la entrada de arriba). El README lo dice, en su texto y en la tabla de "qué
  existía antes": todo lo posterior es trabajo del evento. **No se cambiaron fechas de commits ni se volvió a subir nada como
  nuevo**: hubiera sido presentar como hecho en el evento algo hecho antes, y las reglas
  descalifican por eso.
- **`docs/DEMO-SCRIPT.md`**: el guión, en inglés para grabarlo con la voz de Máximo.
  - Gancho de 7 segundos: la vista desde los lentes Meta Ray-Ban recorriendo la casa y, al
    segundo 4, el plan semanal que llega por WhatsApp y se acepta.
  - Problema, demo del video al plan, verificación de cada visita, cómo funciona por dentro,
    impacto y cierre ("Show us your home once. We'll prove every visit.").
  - Cada bloque dice qué se ve, qué se dice y si eso ya existe o falta construirlo.
  - La idea central: la IA no es el diferencial (la usan todos); lo es el circuito, en el que el
    video que cotiza es la referencia contra la que se verifica cada visita.
  - Consejos para grabar la voz limpia y la lista de tomas que hay que juntar.
- **`CLAUDE.md`**: dos reglas nuevas. Nunca cambiar fechas ni volver a subir trabajo viejo como
  nuevo. El guión guía lo que se construye y se actualiza cuando entra cada función.

### Archivos clave
- `docs/DEMO-SCRIPT.md`, `README.md`, `CLAUDE.md`.

**Pendiente**:
- Grabar otro recorrido con los lentes, sin personas, para el gancho.
- Las tomas del prestador con los lentes (antes y después del mismo baño, cocina y vidrio).
- La voz se graba al final, cuando las tomas del producto estén cerradas.

## 2026-10-26 13:10 · Se reescribió la historia de la rama para borrar cifras exactas

**Commit**: no aplica; es una reescritura de la historia de la rama. Esta entrada va en el
commit que corrige las referencias.

Antes, dos commits de la rama tenían las cifras exactas de la historia de ArreglaTodo
(cuántas solicitudes y cotizaciones de limpieza hay), aunque los documentos ya estaban
redondeados: el repo es público y cualquiera podía verlas mirando commits viejos. Máximo pidió
borrarlas. Ahora esos commits dicen "más de mil" desde el principio, y ninguna versión de la
rama tiene las cifras.

### Qué cambió
- Se reescribieron los 4 últimos commits de la rama. Los anteriores no cambian.
- Cambiaron los identificadores de esos commits; `CAMBIOS.md` y los mensajes de commit ya
  apuntan a los nuevos:

  | Antes | Ahora | Qué es |
  |---|---|---|
  | `c2c6e90` | `1bb3c5a` | Política de datos |
  | `c03b956` | `360f698` | Su entrada en `CAMBIOS.md` |
  | `f8b18f0` | `d245338` | Calibración de horas |
  | `cfcf843` | `f4138d7` | Su entrada en `CAMBIOS.md` |

- La rama se subió de nuevo forzando el reemplazo (`--force-with-lease`). Nadie más trabajaba
  sobre ella y `main` no la tenía.

**Pendiente**:
- GitHub puede seguir mostrando un tiempo los commits viejos a quien tenga el link exacto de cada
  uno. Para borrarlos del todo hay que pedírselo al soporte de GitHub. Son solo conteos, sin
  datos de clientes.

## 2026-10-26 13:02 · Calibración de horas con la historia de ArreglaTodo, sin sacarla de su base

**Commit**: `d245338`

Antes no había estimador de horas, y la política de datos explicaba la idea pero no cómo se
hacía. Ahora la calibración existe y la data de ArreglaTodo no salió de su base: la consulta
corre de solo lectura adentro y devuelve únicamente agregados. Lo pidió Máximo: usar la data de
horas sin que quede pública, y solo datos cualitativos (ambientes, horas, con o sin productos,
con o sin aspiradora).

### Qué cambió
- **`calibration/hours.sql`** (el código es público; los datos no salen):
  - Saca de cada trabajo de limpieza dormitorios, baños, ambientes, horas, productos y
    aspiradora, con reglas de texto que corren adentro de la base.
  - Agrupa por tipo de casa y devuelve, por grupo, las horas típicas y el rango. Solo de grupos
    de 20 trabajos o más, para que ningún número se pueda atar a un cliente.
  - Aparta 1 de cada 5 trabajos para medir el error de verdad.
- **No se le mandó texto de clientes a ningún modelo.** Las reglas alcanzaron; no hizo falta
  usar la API de Meta para esto.
- **La calibración quedó en el Supabase privado de HomePlan**, en un esquema que la API no
  expone (`private.estimator_calibration`, con RLS). No está en el repo.
- **`docs/DATA-POLICY.md`**: explica el circuito real y, en una tabla, quién ve qué (cliente,
  jurado, servidor de HomePlan, base de ArreglaTodo). Dice además que cualquier otra empresa
  podría correr la misma consulta sobre su propia base sin que ninguna vea la data de la otra.
- **Cifras redondeadas** a "más de mil trabajos" en todos los documentos públicos, incluida la
  entrada de abajo.

### El resultado, sin maquillaje
- **La historia casi no predice las horas.** El error promedio es de alrededor de una hora, y
  apenas ~5 % mejor que decirle "4 horas" a todo el mundo.
- Casi todos los tipos de casa dan 4 horas: lo que crece con la casa es el techo del rango, no
  lo típico. Productos y aspiradora no cambian las horas.
- La lectura: el cliente elige las horas (3 o 4, muchas veces el mínimo) antes de que nadie vea
  la casa. **La historia mide lo que se reserva, no lo que la casa necesita**, y el video es
  justo lo que falta. Está escrito en `docs/probes/2026-10-26-hours-calibration.md`.

### Archivos clave
- `calibration/hours.sql`, `docs/DATA-POLICY.md`, `docs/probes/2026-10-26-hours-calibration.md`.

**Pendiente**:
- Siguiente calibración: horas de los trabajos que **funcionaron** (el cliente volvió o renovó),
  no de las reservadas.
- Pasar la calibración a la app: rango de horas por tipo de casa, ajustado con lo que muestra el
  video.

## 2026-10-26 12:55 · Política de datos: el código es público, la data de ArreglaTodo no

**Commit**: `1bb3c5a`

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
  de solo conteos sobre `arreglatodo-db`, 26/10).
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
