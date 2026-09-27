import { redirect } from "next/navigation";

// The root page was a placeholder for "Šiandienos treniruotė" ahead of this
// feature's implementation; now that it lives at /treniruote, redirect here
// too (mirrors the existing /exercises -> /pratimai redirect).
export default function Home() {
  redirect("/treniruote");
}
