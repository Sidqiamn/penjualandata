import { CartDrawer } from "@/components/CartDrawer";
import { Catalog } from "@/components/Catalog";
import { CheckoutDialog } from "@/components/Checkout";
import { Floating } from "@/components/Floating";
import { FormulaBand } from "@/components/FormulaBand";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductDialog } from "@/components/ProductDialog";
import { CtaCell, Faq, Footer, HowToBuy } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FormulaBand />
        <Catalog />
        <HowToBuy />
        <Faq />
        <CtaCell />
      </main>
      <Footer />
      <Floating />
      <CartDrawer />
      <ProductDialog />
      <CheckoutDialog />
    </>
  );
}
