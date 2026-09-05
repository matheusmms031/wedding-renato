import { Footer } from '../components/layout/Footer.jsx'
import { SiteNavBar } from '../components/layout/SiteNavBar.jsx'
import { Hero } from '../components/home/Hero.jsx'
import { Story } from '../components/home/Story.jsx'
import { Couple } from '../components/home/Couple.jsx'
import { Purpose } from '../components/home/Purpose.jsx'
import { Venue } from '../components/home/Venue.jsx'
import { GiftsSection } from '../components/home/GiftsSection.jsx'
import { RSVPSection } from '../components/home/RSVPSection.jsx'
import '../components/home/home.css'

export function Home() {
  return (
    <>
      <a className="skip-link" href="#inicio">
        Ir para o conteúdo
      </a>
      <SiteNavBar active="Início" />
      <main className="fade-in">
        <Hero />
        <Story />
        <Couple />
        <Purpose />
        <Venue />
        <GiftsSection />
        <RSVPSection />
      </main>
      <Footer />
    </>
  )
}
