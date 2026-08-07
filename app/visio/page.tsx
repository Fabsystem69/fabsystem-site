import { redirect } from "next/navigation";

// Le systeme de reservation Cal.com est abandonne (quasi aucune utilisation
// en 4 mois). La route /visio est conservee pour ne pas casser les liens
// existants, mais redirige vers /contact au lieu d'afficher le widget Cal.com.
export default function VisioPage() {
  redirect("/contact");
}
