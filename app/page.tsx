"use client";
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'

import Header from '../components/header'
import Features from '../components/features'
import How from '../components/how'
import Testimonials from '../components/testimonials'
import Pricing from '../components/pricing'
import ReadyCTA from '../components/readyCTA'
import Footer from '../components/footer'

export default function page(){
  useRevealOnScroll();

  return(
    <>
      <Header />
      <Features />
      <How />
      <Testimonials />
      <Pricing />
      <ReadyCTA />
      <Footer />
    </>
  )
}