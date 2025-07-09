export const mockProjects = [
  {
    id: "1",
    name: "Rénovation Immeuble Haussmannien",
    description: "Modernisation complète d'un immeuble du 19ème siècle",
    location: "16 Avenue des Champs-Élysées, Paris 8e",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    status: "En cours",
    planCount: 5
  },
  {
    id: "2", 
    name: "Extension Maison Individuelle",
    description: "Agrandissement d'une maison familiale avec création d'une véranda",
    location: "45 Rue de la République, Lyon 6e",
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-18T16:45:00Z",
    status: "Terminé",
    planCount: 3
  },
  {
    id: "3",
    name: "Bureaux Entreprise Tech",
    description: "Aménagement d'espaces de travail collaboratifs",
    location: "Tech Park, Sophia Antipolis",
    createdAt: "2024-01-05T08:30:00Z",
    updatedAt: "2024-01-12T11:20:00Z",
    status: "En attente",
    planCount: 8
  },
  {
    id: "4",
    name: "Appartement Duplex",
    description: "Réaménagement d'un duplex de 120m² avec optimisation des espaces",
    location: "22 Quai de la Fosse, Nantes",
    createdAt: "2024-01-08T14:00:00Z",
    updatedAt: "2024-01-15T10:15:00Z",
    status: "En cours",
    planCount: 4
  }
];

export const mockAnnotations = [
  {
    id: "1",
    projectId: "1",
    type: "rectangle",
    x: 100,
    y: 100,
    width: 150,
    height: 80,
    color: "#3b82f6",
    stroke: 2,
    notes: "Zone à rénover"
  },
  {
    id: "2", 
    projectId: "1",
    type: "line",
    startX: 50,
    startY: 200,
    endX: 250,
    endY: 200,
    color: "#ef4444",
    stroke: 3,
    notes: "Mur porteur"
  },
  {
    id: "3",
    projectId: "1",
    type: "circle",
    x: 300,
    y: 150,
    radius: 40,
    color: "#10b981",
    stroke: 2,
    notes: "Pilier existant"
  },
  {
    id: "4",
    projectId: "1",
    type: "text",
    x: 200,
    y: 300,
    text: "Cuisine à refaire",
    color: "#8b5cf6",
    fontSize: 16,
    notes: "Estimation 15k€"
  }
];