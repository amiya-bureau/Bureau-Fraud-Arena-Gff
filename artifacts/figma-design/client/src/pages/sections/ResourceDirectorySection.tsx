import { Card, CardContent } from "@/components/ui/card";

const intelligenceCards = [
  {
    title: "Identity Intelligence",
    description:
      "Verify identities with confidence using advanced KYC, KYB, AML screening, and risk signals .",
    icon: "/figmaAssets/group-48099771.png",
  },
  {
    title: "Device Intelligence",
    description:
      "Detect spoofing, emulators, rooted devices, and suspicious device behavior with real-time.",
    icon: "/figmaAssets/group-48099772.png",
  },
  {
    title: "Behavioral Intelligence",
    description:
      "Analyze user interactions and behavioral patterns to distinguish genuine customers.",
    icon: "/figmaAssets/group-48099773.png",
  },
];

export const ResourceDirectorySection = (): JSX.Element => {
  return (
    <section className="w-full bg-white py-[115px]">
      <div className="mx-auto flex w-full max-w-[1132px] flex-col gap-[18px] px-5 xl:px-0">
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {intelligenceCards.map((card) => (
            <Card
              key={card.title}
              className="rounded-none border-[#d1dff9] bg-transparent p-0 shadow-none"
            >
              <CardContent className="flex h-full min-h-[386px] flex-col p-12">
                <img
                  className="h-[60px] w-[60px] shrink-0"
                  alt=""
                  src={card.icon}
                />
                <div className="mt-[68px] flex flex-col gap-5">
                  <h2 className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-2xl font-medium tracking-[-0.48px] text-[#000123]">
                    {card.title}
                  </h2>
                  <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-xl font-normal leading-7 tracking-[-0.40px] text-[#000123] opacity-60">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="relative min-h-[476px] overflow-hidden rounded-none border-[#d1dff9] bg-[#f5f9ff] p-0 shadow-none">
          <CardContent className="relative z-10 flex min-h-[476px] w-full flex-col justify-center p-12">
            <div className="flex w-full max-w-[391px] flex-col gap-20 opacity-80">
              <div className="flex flex-col gap-[18px]">
                <div className="relative flex h-[27px] w-[181px] items-center justify-center bg-[#4715ff1a] px-[8.82px] py-[5.88px]">
                  <img
                    className="absolute left-0 top-0 h-7 w-1.5"
                    alt=""
                    src="/figmaAssets/rectangle-34625199-2.svg"
                  />
                  <span className="[font-family:'Geist_Mono',Helvetica] text-[11.8px] font-medium leading-none text-[#4715ff]">
                    CONNECTED FRAUD SIGNALS
                  </span>
                  <img
                    className="absolute right-0 top-0 h-7 w-1.5"
                    alt=""
                    src="/figmaAssets/rectangle-34625198-5.svg"
                  />
                </div>
                <h2 className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[38px] font-normal leading-[normal] tracking-[-0.76px] text-[#000123]">
                  Move Beyond Detection. Start Preventing.
                </h2>
              </div>
              <div className="flex w-full max-w-[315px] flex-col gap-7">
                <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-xl font-normal leading-7 tracking-[-0.40px] text-[#000123] opacity-60">
                  Verify identities with confidence using advanced KYC, KYB, AML
                  screening, and risk signals .
                </p>
                <button
                  type="button"
                  className="group flex h-auto w-fit items-center gap-3 text-left [font-family:'Denim-TRIAL-Medium',Helvetica] text-[19.6px] font-medium leading-[normal] tracking-[-0.39px] text-[#000123]"
                >
                  <span>Explore Bureau</span>
                  <span
                    aria-hidden="true"
                    className="text-xl leading-none transition-transform duration-200 group-hover:translate-x-1"
                  >
                    ›
                  </span>
                </button>
              </div>
            </div>
          </CardContent>
          <img
            className="pointer-events-none absolute right-[-467px] top-0 h-[476px] w-[769px] max-w-none"
            alt=""
            src="/figmaAssets/group-13.png"
          />
          <img
            className="pointer-events-none absolute left-[496px] top-[18px] h-[440px] w-[636px] max-w-none"
            alt=""
            src="/figmaAssets/group-2147257038-1.png"
          />
        </Card>
      </div>
    </section>
  );
};
