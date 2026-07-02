import {
  CoreShowcase,
  Features,
  Hero,
  Navbar,
  Footer,
} from "@/components/landing";

const Home = () => {
  return (
    <div>
      <Navbar />
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
