import type { RadarItem } from "@/src/core/radar";

const TASK_SUMMARIES: Record<string, string> = {
  "S1-BEL-030": "Suivre les tirs, les impacts et le plateau actif.",
  "S1-EPH-040": "Suivre les quatre pièces et la limite de tours.",
  "S1-OUV-040": "Consigner la couleur finale et sa confirmation.",
  "S1-CLO-050": "Suivre l’équipe, la cible et l’issue du combat.",
  "G-LEDGER-020": "Signaler la défaite et consigner les ressources perdues."
};

export function taskSummaryFr(taskId: string, taskName: string) {
  return TASK_SUMMARIES[taskId] ?? `Suivre « ${taskName} » avec les seules données confirmées dans le client.`;
}

export function radarItemFr(item: RadarItem): RadarItem {
  const title = item.title
    .replace(/ ist blockiert$/u, " est bloquée")
    .replace(/ ist unbesetzt$/u, " n’est pas affectée")
    .replace(/ wartet auf /u, " attend ")
    .replace(/ ist offline$/u, " est hors ligne");

  const impactBySource: Record<string, string> = {
    "Kritischer Pfad kann nicht fortgesetzt werden.": "La progression ne peut pas continuer tant que ce blocage persiste.",
    "Captain muss Team oder Person zuweisen.": "Le capitaine doit affecter une équipe ou une personne.",
    "Abhängigkeit auf dem nächsten Pfad ist noch offen.": "Une dépendance de la prochaine étape reste ouverte.",
    "Aktuelle Aufgabe kann ohne Neuzuweisung blockieren.": "La mission en cours peut se bloquer sans nouvelle affectation.",
    "Teilnehmerstatus prüfen.": "Vérifier l’état de connexion de cette personne."
  };
  return { ...item, title, impact: impactBySource[item.impact] ?? item.impact };
}
