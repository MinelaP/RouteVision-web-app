import { redirect } from "next/navigation"

export default function OpremaPage() {
  // Preusmjeravanje na vozni-park stranicu jer je oprema dio voznog parka
  redirect("/dashboard/vozni-park")
}
