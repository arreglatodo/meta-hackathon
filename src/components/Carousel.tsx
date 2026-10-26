"use client";

import type { ProviderOption } from "@/lib/home/quote";
import { type Frequency, money } from "./quote-ui";

export const VISITS_PER_MONTH: Record<Frequency, number> = { once: 1, weekly: 4, biweekly: 2 };

/** ArreglaTodo's carousel intro (CRM `textoIntro` + `INCLUYE_LIMPIEZA`). */
export const CAROUSEL_INTRO =
  "👋 ¡Estas son las opciones para tu limpieza! Deslizá para verlas y tocá *Elegir* en la que prefieras.\n\n" +
  "Tu dinero queda protegido hasta que termine el servicio. Los precios incluyen las leyes sociales (BPS y BSE) y los boletos del personal.";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** WhatsApp-style interactive carousel: one card per provider. */
export function Carousel({
  options,
  frequency,
  onChoose,
}: {
  options: ProviderOption[];
  frequency: Frequency;
  onChoose: (o: ProviderOption) => void;
}) {
  const visits = VISITS_PER_MONTH[frequency];
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
      {options.map((o, i) => {
        const base = o.prices[0];
        const withProducts = o.prices.find((p) => p.products && !p.vacuum);
        const gift = o.gift && o.gift.frequency === frequency ? o.gift.text : null;
        return (
          <article
            key={i}
            className="w-[230px] shrink-0 snap-start overflow-hidden rounded-xl bg-bubble-agent shadow-sm"
          >
            <div className="flex h-28 items-center justify-center bg-gradient-to-br from-[#fdcbb2] to-[#fef7f1]">
              {o.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-semibold text-white">
                  {initials(o.name)}
                </span>
              )}
            </div>
            <div className="space-y-1 px-3 py-2 text-[13px] leading-snug">
              <div>
                <strong>{o.name}</strong>
                {o.rating ? ` · ⭐ ${o.rating.toFixed(1)}` : ""}
              </div>
              <div className="text-xs text-muted">
                {[o.company, o.jobs ? `${o.jobs.toLocaleString("es-UY")} trabajos` : null, o.reviews ? `${o.reviews} reseñas` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              <div>
                Limpieza de {base.hours} h{frequency === "once" ? "" : `, ${visits} por mes`}
              </div>
              <div>
                💰 <strong>Total {money(base)}</strong> por visita
              </div>
              {withProducts && <div className="text-xs text-muted">Con productos: {money(withProducts)}</div>}
              {frequency !== "once" && o.plans[frequency] && (
                <div className="text-xs">
                  Plan mensual: <strong>{money(base, o.plans[frequency]!.total)}</strong>
                </div>
              )}
              {gift && <div className="text-xs font-medium text-[#128c7e]">🎁 Con el plan, {gift}</div>}
            </div>
            <div className="border-t border-line text-center text-sm text-[#128c7e]">
              {o.profileUrl && (
                <a href={o.profileUrl} target="_blank" rel="noreferrer" className="block border-b border-line py-2">
                  🔗 Ver reseñas
                </a>
              )}
              <button type="button" onClick={() => onChoose(o)} className="w-full py-2 font-medium">
                Elegir
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
