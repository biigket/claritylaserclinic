import Navbar from "@/components/clinic/Navbar";
import HeroSection from "@/components/clinic/HeroSection";
import PhilosophySection from "@/components/clinic/PhilosophySection";
import WhyClaritySection from "@/components/clinic/WhyClaritySection";
import ProgramsSection from "@/components/clinic/ProgramsSection";
import TreatmentSection from "@/components/clinic/TreatmentSection";
import TechnologySection from "@/components/clinic/TechnologySection";
import DoctorSection from "@/components/clinic/DoctorSection";
import JourneySection from "@/components/clinic/JourneySection";
import CtaSection from "@/components/clinic/CtaSection";
import FooterSection from "@/components/clinic/FooterSection";
import FloatingButton from "@/components/clinic/FloatingButton";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <PhilosophySection />
      <WhyClaritySection />
      <ProgramsSection />
      <TreatmentSection />
      <TechnologySection />
      <DoctorSection />
      <JourneySection />
      <CtaSection />
      <FooterSection />
      <FloatingButton />
    </div>
  );
};

export default Index;
