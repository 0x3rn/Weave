"use client";

import Header from '../components/header';
import Hero from '../components/hero';
import Problem from '../components/problem';
import Solution from '../components/solution';
import How from '../components/how';
import Economy from '../components/economy';
import Escrow from '../components/escrow';
import Trust from '../components/trust';
import MarketplacePreview from '../components/marketplace-preview';
import Features from '../components/features';
import UseCases from '../components/use-cases';
import Testimonials from '../components/testimonials';
import Pricing from '../components/pricing';
import FAQ from '../components/faq';
import ReadyCTA from '../components/readyCTA';
import Footer from '../components/footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <How />
        <Economy />
        <Escrow />
        <Trust />
        <MarketplacePreview />
        <Features />
        <UseCases />
        <Testimonials />
        <Pricing />
        <FAQ />
        <ReadyCTA />
      </main>
      <Footer />
    </>
  );
}