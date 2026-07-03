import { auth } from "@/auth";

export default async function Dashboard() {
  const session = await auth();
  return <div className="p-8">已登录:{session?.user?.email}</div>;
}
