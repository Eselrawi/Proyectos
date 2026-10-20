import { useEffect } from 'react'
import { useSmoothScroll } from './lib/useSmoothScroll'
import { initStopTracker } from './lib/scrollStore'
import { ScrollTrigger } from './lib/gsap'
import Intro from './components/Intro'
import Header from './components/Header'
import TreeStage from './components/TreeStage'
import DepthNav from './components/DepthNav'
import { CanopyStop, BranchStops, ReviewsStop, HoursStop, RootsStop } from './components/Sections'
import Footer from './components/Footer'

export default function App() {
  useSmoothScroll()

  useEffect(() => {
    const stop = initStopTracker()
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh, { once: true })
    return stop
  }, [])

  return (
    <>
      <a className="skip" href="#main">Saltar al contenido</a>
      <Intro />
      <TreeStage />
      <Header />
      <DepthNav />
      <main id="main">
        <CanopyStop />
        <BranchStops />
        <ReviewsStop />
        <HoursStop />
        <RootsStop />
      </main>
      <Footer />
    </>
  )
}
