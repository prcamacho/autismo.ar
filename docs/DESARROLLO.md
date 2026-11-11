# Desarrollo y colaboración con IA

Reglas acordadas el 10 de noviembre de 2026. Complementan [AGENTS.md](../AGENTS.md), la [visión](../VISION_Y_PLAN.md) y la arquitectura específica del [piloto comunitario](./COMUNIDAD.md). La adopción inicial modifica documentación; no habilita funciones ni configura infraestructura.

## 1. Entender el pedido y mantener su alcance

Antes de programar, expresar brevemente:

- **Resultado:** qué podrá hacer o ver la persona usuaria.
- **Alcance:** qué parte necesita cambiar para lograrlo.
- **Criterio de aceptación:** qué evidencia permitirá comprobarlo.
- **Modelo recomendado:** modelo, razonamiento y motivo según dificultad, riesgo y consumo esperado.

Una tarea pequeña requiere pocas líneas. No convertir cada pedido en un formulario ni exigir vocabulario técnico al responsable del proyecto.

| Situación                                                                                  | Cómo actuar                                                                                                                              |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| La implementación admite una decisión menor, reversible y coherente con el proyecto        | Explicar la suposición y avanzar.                                                                                                        |
| Dos interpretaciones cambian funciones, reglas, datos, costos, privacidad o comportamiento | Hacer una pregunta concreta sobre esa decisión antes de modificar la parte dependiente. Continuar lecturas o trabajo independiente útil. |
| Aparece una mejora que no hace falta para cumplir el pedido                                | Proponerla por separado; incorporarla cuando esté autorizada.                                                                            |
| El pedido contradice el comportamiento documentado o una decisión anterior                 | Mostrar la diferencia y resolverla antes de sustituir el comportamiento.                                                                 |

Las autorizaciones de la conversación siguen vigentes. No pedir de nuevo permiso para pasos ya autorizados, revisiones o correcciones rutinarias dentro del alcance. Tampoco interpretar un pedido ambiguo como autorización para publicar, crear servicios pagos o modificar datos ajenos.

Al cerrar, comparar el resultado real con el pedido y el criterio de aceptación. Compilar correctamente no demuestra por sí solo que se resolvió la necesidad.

## 2. Organización del código y configuración

- Seguir las responsabilidades existentes: páginas y componentes, reglas del dominio, acceso a datos y configuración. Consultar el README y la guía del módulo antes de crear otra estructura.
- Reutilizar contratos, validaciones y componentes adecuados. Evitar implementaciones paralelas de una misma regla y cambios amplios de arquitectura para una corrección puntual.
- Centralizar valores y reglas compartidos que se espera modificar. Usar nombres por su significado, unidades explícitas y referencias comunes; el ejemplo de un límite compartido es un caso de este criterio general.
- Definir valores válidos, predeterminados y comportamiento ante configuración ausente o inválida. Validar en servidor lo que afecta permisos, escrituras o límites protegidos.
- Elegir la ubicación según la necesidad: constantes para definiciones del código, variables de entorno para configuración de despliegue y persistencia autorizada cuando haga falta editar sin desplegar. Un panel de administración es una función adicional que requiere alcance propio.
- Mantener secretos fuera del navegador, Git y documentación. Documentar los nombres y propósitos de variables, nunca sus valores privados.
- Conservar valores estables y decisiones particulares cuando tengan un motivo. No convertir todo en parámetros, agregar capas sin uso concreto ni generalizar la app de Ian sin un pedido específico.
- Mantener cambios pequeños y con un propósito reconocible. Los arreglos temporales deben explicar su motivo, limitación y condición para retirarlos.

## 3. Selección de modelos y consumo

Esta tabla es una recomendación inicial, no un benchmark del proyecto ni una promesa de ahorro. Verificar disponibilidad y nombres en el selector que realmente se use.

| Trabajo                                                                       | Punto de partida                                         |
| ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| Cambios pequeños, repetitivos y con requisitos claros y verificación sencilla | GPT-6 Luna, bajo o medio.                                |
| Funciones habituales y correcciones localizadas                               | GPT-6.1 Sol, medio; alto si el razonamiento lo requiere. |
| Cambios entre varias partes o depuración compleja                             | GPT-6.1 Sol, alto o muy alto.                            |
| Arquitectura difícil, problemas ambiguos o análisis especialmente exigente    | GPT-6 Astra, alto o muy alto.                            |

Evaluar Ultra solo ante un trabajo que justifique ese esfuerzo. Un nivel mayor no garantiza un resultado mejor. Considerar también velocidad seleccionada, contexto, herramientas y eventual delegación; no habilitar delegación automática sin autorización. No confundir razonamiento Ultra con velocidad Ultrafast.

Elegir directamente según dificultad y riesgo; no pasar obligatoriamente una tarea por todos los modelos. Escalar cuando la evidencia muestre dificultades persistentes de comprensión, diagnóstico o calidad. Antes, revisar si falta información, acceso o una decisión que un modelo mayor tampoco resolvería.

La IA recomienda la selección. Si no dispone de una herramienta para cambiar y comprobar el modelo principal, debe decirlo y permitir que el responsable lo seleccione. No declarar un cambio ficticio ni detener trabajo independiente que pueda realizarse con calidad.

Optimizar el consumo total hasta terminar una función verificada, incluyendo investigación, revisión y correcciones:

- Buscar primero y leer fragmentos pertinentes; ampliar solo cuando falte contexto. Evitar volcados completos de registros, herramientas o archivos ajenos al pedido.
- Agrupar lecturas independientes y reutilizar resultados que sigan vigentes. No releer documentación completa sin motivo ni omitir una revisión cuando pudo cambiar.
- Mantener instrucciones concisas y documentación específica enlazada. Guardar decisiones y pendientes, sin copiar conversaciones privadas.
- Evitar intentos repetidos a ciegas y pruebas redundantes. Conservar todas las verificaciones necesarias para el riesgo del cambio.
- Dar actualizaciones y entregas breves con evidencia útil. No afirmar un ahorro porcentual ni un costo por tarea sin mediciones comparables.

Tokens, cuota del plan y gasto económico son medidas distintas. Cuando la herramienta muestre consumo, registrar su alcance y fecha; no atribuir una variación de cuota compartida exclusivamente a esta tarea si hubo otra actividad.

Referencias consultadas al acordar estas pautas: [selección de modelos](https://developers.openai.com/api/docs/guides/model-selection), [uso de Astra y razonamiento](https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex) y [caso LegalOn](https://openai.com/index/legalon-halves-codex-costs/). Las opciones evolucionan: revalidar antes de cambiar herramientas o basar un presupuesto en ellas. El ahorro reportado por LegalOn no es una estimación para autismo.ar.

## 4. Verificación y entrega

Usar los comandos existentes del [README](../README.md). Para código ejecutable, seleccionar y ejecutar lint, tipos, pruebas relevantes y compilación según el alcance. Antes de promover una entrega de producto, las comprobaciones automáticas acordadas deben pasar o la limitación debe quedar resuelta; no ocultar una falla o simular un resultado.

Probar comportamiento observable y regresiones relevantes, incluidos permisos, errores y entradas inválidas cuando corresponda. Una corrección de bug debe incorporar una comprobación de su causa cuando sea útil y proporcionado. No agregar pruebas que solo repitan la implementación ni exigir una batería de ejecución de la app para un cambio exclusivamente documental: comprobar formato, enlaces y diff.

En interfaces, revisar visualmente cuando sea posible: móvil, escritorio, teclado, foco, contraste y movimiento reducido. Señalar detalles pertinentes de iconos, títulos, descripción, vista previa al compartir, indexación y estados de carga, vacío y error. Proponer lo que falta sin ampliar silenciosamente la tarea; conservar el `noindex` del prototipo hasta una decisión de lanzamiento.

La entrega debe explicar qué cambió y por qué, qué se comprobó, qué quedó pendiente y las limitaciones reales. Una revisión de la propia IA no equivale a una revisión independiente. El flujo de publicación y recuperación está en [OPERACION.md](./OPERACION.md).

## 5. Memoria y comprobación de las instrucciones

Cada cambio conserva su motivo, criterio de aceptación y evidencia en el commit o solicitud de integración. Las decisiones con consecuencias duraderas se registran en [DECISIONES.md](./DECISIONES.md). Mantener el código versionado en Git; no crear copias de código en la documentación para reemplazar ese historial.

Usar solo IDs reales de tareas, commits, versiones y despliegues. Si aún no existen, indicar que están pendientes. Vincular la versión publicada con su commit al comprobar un despliegue.

Al adaptar estas pautas a otra herramienta o repositorio, comprobar dónde y cuándo se cargan sus instrucciones. En una conversación nueva, verificar con una tarea pequeña ya autorizada que la guía pertinente se leyó y se aplicó sin repetirla en el prompt. Un archivo descubierto o un enlace no prueba cumplimiento: contrastar acciones y resultado. Si falla, corregir alcance, contradicciones o reglas vagas. Las instrucciones acompañan las pruebas, revisiones y controles, no los sustituyen.
