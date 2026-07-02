import Link from "next/link";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        你的想法,值得更聪明的写作空间
      </h1>
      <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">
        写作、规划、分享、共创。让 AI 陪你一起,重塑文档与协作的方式。
      </p>
      <div className="mt-10 flex justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/login">免费开始</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/features">了解更多</Link>
        </Button>
      </div>
    </section>
  );
};

export default Hero;
