import { redirect } from "next/navigation"

export default function HomePage() {
  // Preusmjeravanje na login stranicu
  redirect("/login")
}
