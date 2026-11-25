import { DestinationsShowcase } from '../components/sections/DestinationsShowcase'
import { GlobeSection } from '../components/sections/GlobeSection'
import { Hero } from '../components/sections/Hero'
import { Intro } from '../components/sections/Intro'
import { MissionVision } from '../components/sections/MissionVision'
import { MoveSection } from '../components/sections/MoveSection'
import { PlanJourney } from '../components/sections/PlanJourney'
import { ServicesShowcase } from '../components/sections/ServicesShowcase'
import { Values } from '../components/sections/Values'
import { absUrl, organizationLd, Seo } from '../components/ui/Seo'
import { useContent } from '../hooks/useContent'

/**
 * Scroll story: 01 Takeoff → 02 Explore → 03 Connect → 04 Move → 05 Arrive,
 * interleaved with the brand intro, services, values and mission.
 */
export default function Home() {
  const { contact } = useContent()
  return (
    <>
      <Seo jsonLd={[organizationLd(contact), { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Skyhigh', url: absUrl('/') }]} />
      <Hero />
      <Intro />
      <ServicesShowcase />
      <DestinationsShowcase />
      <GlobeSection />
      <MoveSection />
      <Values />
      <MissionVision />
      <PlanJourney />
    </>
  )
}
