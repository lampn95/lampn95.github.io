"use client";

import { motion } from "framer-motion";
import { Coffee, Heart } from "lucide-react";
import { CoffeeButton } from "./CoffeeButton";

export function CoffeeCTA() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-500/[0.08] via-orange-400/[0.05] to-rose-400/[0.06] p-8 sm:p-12 text-center"
      >
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

        <div className="relative">
          <div className="float-slow inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-black shadow-[0_8px_40px_rgba(255,184,107,0.45)]">
            <Coffee className="h-8 w-8" />
          </div>

          <h3 className="mt-5 text-2xl sm:text-3xl font-semibold text-white">
            Nội dung free, nhưng cà phê thì có giá.
          </h3>
          <p className="mt-3 max-w-xl mx-auto text-white/65 leading-relaxed">
            Nếu một story, một project, hay một ý ở đây giúp được bạn — bạn có thể mời mình
            một ly cà phê qua QR banking VN. Mọi đóng góp đều rất rất quý.
          </p>

          <div className="mt-7 flex items-center justify-center">
            <CoffeeButton size="lg" />
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/45">
            <Heart className="h-3 w-3 text-rose-300" />
            Cảm ơn bạn đã ghé qua.
          </div>
        </div>
      </motion.div>
    </section>
  );
}
