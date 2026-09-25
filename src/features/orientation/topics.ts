export const orientationTopics = [
  {
    id: "atencion",
    title: "Busco un profesional o centro",
    question: "¿Dónde atienden y qué cobertura tienen?",
    description:
      "Contactos, edades atendidas y cobertura informada, con sus fuentes y fechas.",
    category: "profesionales",
    related: "centros",
    icon: "health",
  },
  {
    id: "escuela",
    title: "Necesito apoyos para la escuela",
    question: "¿Cómo encuentro apoyo educativo?",
    description:
      "Recursos de educación y acompañamiento para distintas trayectorias.",
    category: "educacion",
    icon: "school",
  },
  {
    id: "tramites",
    title: "Quiero orientarme con un trámite",
    question: "¿Dónde encuentro información sobre CUD o prestaciones?",
    description:
      "Organismos y recursos de derechos. Revisá siempre la jurisdicción y la fuente del requisito.",
    category: "derechos",
    icon: "document",
  },
  {
    id: "traslados",
    title: "Necesito resolver un traslado",
    question: "¿Qué opciones hay en mi zona?",
    description:
      "Servicios de transporte y recursos para viajar, junto con información nacional.",
    category: "transporte",
    icon: "transport",
  },
  {
    id: "redes",
    title: "Busco una red de apoyo",
    question: "¿Con quién puedo compartir el camino?",
    description:
      "Grupos y espacios comunitarios con información pública para contactarlos.",
    category: "comunidad",
    icon: "community",
  },
  {
    id: "vida-adulta",
    title: "Busco apoyos para la vida adulta",
    question: "¿Qué recursos atienden a personas adultas?",
    description:
      "Explorá todas las categorías filtrando por adultez. Los recursos sin edades informadas no aparecen en ese filtro.",
    category: "",
    age: "Adultez",
    icon: "life",
  },
] as const;
