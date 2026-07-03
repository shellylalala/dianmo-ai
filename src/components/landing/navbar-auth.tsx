import { auth } from "@/auth";
import Navbar from "./navbar";

export default async function NavbarAuth() {
  const session = await auth();
  return <Navbar user={session?.user ?? null} />;
}
