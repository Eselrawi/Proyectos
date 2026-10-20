import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import Intro from "@/components/experience/Intro";
import Menu from "@/components/Menu";
import Offer from "@/components/site/Offer";
import Reservations from "@/components/site/Reservations";
import Contact from "@/components/site/Contact";
import Footer from "@/components/site/Footer";
import { DemoBand, DemoCTA } from "@/components/site/DemoChrome";
import Responsive from "@/components/mobile/Responsive";
import MobileHome from "@/components/mobile/MobileHome";
import { ScrollBar } from "@/components/site/Fx";

export default function Home() {
  return (
    <>
      <ScrollBar />
      <DemoBand />
      <Header />
      <main>
        <Responsive
          mobile={<MobileHome />}
          desktop={
            <>
              <Intro />
              <Hero />
              <Menu />
              <Offer />
              <Reservations />
              <Contact />
            </>
          }
        />
      </main>
      <Footer />
      <DemoCTA />
    </>
  );
}
