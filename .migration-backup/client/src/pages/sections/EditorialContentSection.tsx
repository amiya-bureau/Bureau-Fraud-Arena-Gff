import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const featureItems = [
  "Network-level fraud detection",
  "API-first architecture",
];

const editorialCards = [
  {
    title: "Trusted By Modern Financial Institutions",
    action: "Explore Bureau",
    backgroundClass: "bg-white",
    textClass: "text-[#000123]",
    buttonClass:
      "bg-[#000123] text-white hover:bg-[#000123]/90 focus-visible:ring-[#000123]",
    arrowClass: "bg-white",
    graphic: (
      <>
        <img
          className="absolute top-0 right-[-5.75%] h-[112.73%] w-[81.87%] max-w-none object-contain object-right-top"
          alt="Group"
          src="/figmaAssets/group-6.png"
        />
        <img
          className="absolute top-[27px] right-0 h-[367px] w-[49.57%] max-w-none object-contain object-right-top"
          alt="Group"
          src="/figmaAssets/group-2147257038.png"
        />
      </>
    ),
  },
  {
    title: "Enterprise-Ready Fraud Intelligence",
    action: "Book a Demo",
    backgroundClass: "bg-[#4715ff]",
    textClass: "text-white",
    buttonClass:
      "bg-white text-[#000123] hover:bg-white/90 focus-visible:ring-white",
    arrowClass: "bg-[#000123]",
    graphic: (
      <>
        <div className="absolute top-[-464px] left-1/2 h-[796px] w-[227.73%] -translate-x-1/2 rounded-[1470px/398px] bg-[#010439] blur-[143.55px]" />
        <div className="absolute -top-6 left-[45.08%] h-[462px] w-[60.11%]">
          <img
            className="absolute top-[23px] left-0 h-[394px] w-[99.74%] max-w-none object-contain object-left-top"
            alt="Group"
            src="/figmaAssets/group-7.png"
          />
          <img
            className="absolute top-28 left-[24.36%] h-[73px] w-[73px]"
            alt="Group"
            src="/figmaAssets/group-48099711-1.png"
          />
          <p className="absolute top-[196px] left-[24.36%] w-[92px] text-[12.6px] font-medium leading-[normal] tracking-[0] text-white [font-family:'Geist_Mono',Helvetica]">
            NETWORK MATCH FOUND
          </p>
        </div>
      </>
    ),
  },
];

const PixelArrow = ({ colorClass }: { colorClass: string }) => (
  <span className="relative block h-[16.61px] w-[9.97px]" aria-hidden="true">
    <span className={`absolute left-px top-0 h-[3px] w-[3px] ${colorClass}`} />
    <span
      className={`absolute left-px top-[13px] h-[3px] w-[3px] ${colorClass}`}
    />
    <span
      className={`absolute left-[3px] top-[3px] h-[3px] w-[3px] ${colorClass}`}
    />
    <span
      className={`absolute left-[3px] top-2.5 h-[3px] w-[3px] ${colorClass}`}
    />
    <span
      className={`absolute left-[7px] top-[7px] h-[3px] w-[3px] ${colorClass}`}
    />
  </span>
);

export const EditorialContentSection = (): JSX.Element => {
  return (
    <section className="w-full bg-[#000123] px-4 py-16 sm:px-8 md:py-[140px] lg:px-12">
      <div className="mx-auto flex w-full max-w-[1291px] flex-col gap-[23px]">
        {editorialCards.map((card) => (
          <Card
            key={card.title}
            className={`relative min-h-[394px] overflow-hidden rounded-none border-0 shadow-none ${card.backgroundClass}`}
          >
            <CardContent className="relative z-0 flex min-h-[394px] flex-col justify-between p-6 sm:p-10 md:p-[60px]">
              <div className="pointer-events-none absolute inset-0 z-0 hidden md:block">
                {card.graphic}
              </div>
              <div className="relative z-10 flex max-w-[455px] flex-col items-start gap-10">
                <h2
                  className={`m-0 text-[42px] leading-[0.98] tracking-[-1.04px] sm:text-[52px] [font-family:'Denim-TRIAL-Regular',Helvetica] ${card.textClass}`}
                >
                  {card.title}
                </h2>
                <Button
                  type="button"
                  className={`h-auto rounded-none px-[14.95px] py-[13.29px] text-[16.6px] font-medium leading-[normal] tracking-[-0.33px] [font-family:'Denim-TRIAL-Medium',Helvetica] ${card.buttonClass}`}
                >
                  <span>{card.action}</span>
                  <PixelArrow colorClass={card.arrowClass} />
                </Button>
              </div>
              <div className="relative z-10 mt-10 w-full">
                <img
                  className="h-0.5 w-full"
                  alt="Line"
                  src="/figmaAssets/line-313.svg"
                />
                <ul className="mt-[18px] flex flex-wrap items-center gap-x-[26px] gap-y-3">
                  {featureItems.map((feature) => (
                    <li
                      key={feature}
                      className="inline-flex items-center gap-3 [font-family:'Denim-TRIAL-Regular',Helvetica]"
                    >
                      <img
                        className="h-[20.8px] w-[20.8px]"
                        alt="Check circle"
                        src="/figmaAssets/check-circle--streamline-sharp.svg"
                      />
                      <span
                        className={`text-lg leading-[25.2px] tracking-[-0.36px] ${card.textClass}`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
