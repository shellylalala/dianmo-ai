import {
  CoreShowcase,
  Features,
  Hero,
  NavbarAuth,
  Footer,
} from "@/components/landing";

const Home = async () => {
  return (
    <div>
      <NavbarAuth />
      <main className="flex-1">
        <Hero />
        <Features />
        <CoreShowcase />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
