import { useState } from "react";
import Navbar from "@/components/clinic/Navbar";
import HeroSection from "@/components/clinic/HeroSection";
import ScarAssessmentCTA from "@/components/clinic/ScarAssessmentCTA";
import PhilosophySection from "@/components/clinic/PhilosophySection";
import SpeakerSection from "@/components/clinic/SpeakerSection";
import WhyClaritySection from "@/components/clinic/WhyClaritySection";
import ProgramsSection from "@/components/clinic/ProgramsSection";
import ReviewsSection from "@/components/clinic/ReviewsSection";
import TreatmentSection from "@/components/clinic/TreatmentSection";
import TechnologySection from "@/components/clinic/TechnologySection";

import JourneySection from "@/components/clinic/JourneySection";
import CtaSection from "@/components/clinic/CtaSection";
import CaseReviewsSection from "@/components/clinic/CaseReviewsSection";
import FooterSection from "@/components/clinic/FooterSection";
import FloatingButton from "@/components/clinic/FloatingButton";
import ConsultationPopup from "@/components/clinic/ConsultationPopup";

const Index = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const openPopup = () => setPopupOpen(true);

  return (
    <div className="min-h-screen">
      <Navbar onBook={openPopup} />
      <HeroSection onBook={openPopup} />
      <PhilosophySection />
      <SpeakerSection />
      <WhyClaritySection />
      <ProgramsSection />
      <ReviewsSection />
      <TreatmentSection />
      <TechnologySection />
      
      <JourneySection />
      <CtaSection />
      <CaseReviewsSection />
      <FooterSection />
      <FloatingButton />
      <ConsultationPopup open={popupOpen} onClose={() => setPopupOpen(false)} />
    </div>
  );
};

export default Index;
