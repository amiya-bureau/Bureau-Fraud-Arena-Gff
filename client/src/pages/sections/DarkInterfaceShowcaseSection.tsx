import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const callsToAction = [{ label: "Explore Bureau" }, { label: "Subscribe Now" }];

const pixelArrowDots = [
  "col-start-1 row-start-1",
  "col-start-1 row-start-5",
  "col-start-2 row-start-2",
  "col-start-2 row-start-4",
  "col-start-3 row-start-3",
];

const PixelArrow = () => (
  <span
    aria-hidden="true"
    className="grid h-5 w-3 grid-cols-3 grid-rows-5 place-items-center"
  >
    {pixelArrowDots.map((position) => (
      <span key={position} className={`h-1 w-1 bg-[#000123] ${position}`} />
    ))}
  </span>
);

const CtaButton = ({ label }: { label: string }) => (
  <Button
    type="button"
    variant="secondary"
    className="h-auto rounded-none bg-white px-[18px] py-3.5 text-[#000123] shadow-none hover:bg-white"
  >
    <span className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-xl font-medium tracking-[-0.4px]">
      {label}
    </span>
    <PixelArrow />
  </Button>
);

export const DarkInterfaceShowcaseSection = (): JSX.Element => {
  return (
    <section className="relative min-h-[1080px] w-full overflow-hidden bg-[#ebf3fe] px-6 py-16 lg:px-[max(24px,calc((100%-1389px)/2))] lg:py-[115px]">
      <div className="mx-auto flex w-full max-w-[1389px] flex-col gap-5">
        <article className="relative isolate overflow-hidden bg-[#4715ff] lg:h-[595px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[calc(50%-1537px)] top-[calc(50%-1217px)] h-[1413px] w-[3075px] rotate-[1.18deg] rounded-[1537.54px/706.32px] bg-[#000123] blur-[254.95px]"
          />
          <div className="relative grid gap-10 px-6 py-12 lg:grid-cols-[724px_401px] lg:gap-[138px] lg:px-0 lg:py-0">
            <img
              className="mt-0 h-auto w-full max-w-[724px] self-start lg:mt-[113px] lg:h-[364px] lg:w-[724px]"
              alt="Group"
              src="/figmaAssets/group-2147257057.png"
            />
            <div className="flex w-full max-w-[401px] flex-col items-start gap-12 lg:pt-[103px]">
              <div className="flex min-h-[285px] w-full flex-col items-start gap-7">
                <div className="flex w-full max-w-[344px] flex-col items-start gap-[18px]">
                  <Badge className="grid h-[27px] w-[181px] grid-cols-[6px_1fr_6px] items-center rounded-none bg-transparent p-0 text-white">
                    <img
                      className="h-7 w-1.5"
                      alt=""
                      src="/figmaAssets/rectangle-34625199-2.svg"
                    />
                    <span className="flex h-[27px] items-center justify-center bg-[#ffffff14] px-[8.82px] py-[5.88px] [font-family:'Geist_Mono',Helvetica] text-[11.8px] font-medium leading-none tracking-normal">
                      CONNECTED FRAUD SIGNALS
                    </span>
                    <img
                      className="h-7 w-1.5"
                      alt=""
                      src="/figmaAssets/rectangle-34625198-5.svg"
                    />
                  </Badge>
                  <h2 className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-5xl font-normal leading-none tracking-[-1.2px] text-white lg:text-6xl">
                    Detect earlier.
                    <br />
                    Stop faster.
                  </h2>
                </div>
                <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-xl font-normal leading-7 tracking-[-0.4px] text-white opacity-60">
                  Verify identities with confidence using advanced KYC, KYB, AML
                  screening, and risk signals .
                </p>
              </div>
              <CtaButton label={callsToAction[0].label} />
            </div>
          </div>
        </article>
        <article className="relative isolate min-h-[235px] overflow-hidden bg-[#000124]">
          <img
            className="pointer-events-none absolute left-[570px] top-0 h-[235px] w-[819px]"
            alt="Group"
            src="/figmaAssets/group-2147257040.png"
          />
          <div className="relative flex min-h-[235px] w-full flex-col items-start justify-center gap-8 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:px-[6.65%] lg:py-0">
            <h2 className="w-full max-w-[642px] [font-family:'Denim-TRIAL-Regular',Helvetica] text-4xl font-normal leading-none tracking-[-0.96px] text-white lg:text-5xl">
              Actionable Intelligence For Modern Fraud And Risk Leaders.
            </h2>
            <CtaButton label={callsToAction[1].label} />
          </div>
        </article>
      </div>
    </section>
  );
};
