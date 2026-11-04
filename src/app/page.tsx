import { redirect } from "next/navigation";
import { tools } from "@/tools/registry";
export default function Home() {
  redirect(`/tools/${tools[0].slug}`);
}
