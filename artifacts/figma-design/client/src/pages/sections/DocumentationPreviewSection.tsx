import { Button } from "@/components/ui/button";

const signalLabel = "CONNECTED FRAUD SIGNALS";
const heading = "Connecting Signals. Powering Intelligence.";
const description =
  "Verify identities with confidence using advanced KYC, KYB, AML screening, and risk signals .";
const buttonLabel = "Explore Bureau";

const arrowPixels = [
  "self-start",
  "self-end",
  "mt-[5px] self-center",
  "self-center",
  "mb-[5px] self-center",
];

export const DocumentationPreviewSection = (): JSX.Element => {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#000123] px-[7.57%] py-[184px]"
      aria-labelledby="documentation-preview-heading"
    >
      <div className="relative min-h-[711px] w-full overflow-hidden bg-[#4715ff]">
        <div
          className="pointer-events-none absolute left-1/2 top-[-1472px] h-[1688px] w-[3362px] -translate-x-1/2 rotate-[-9.71deg] rounded-[1680.77px/843.81px] bg-[#010439] blur-[304.58px]"
          aria-hidden="true"
        />
        <img
          className="pointer-events-none absolute bottom-[-12px] right-px h-[422px] w-[885px] max-w-none"
          alt="Group"
          src="/figmaAssets/group-2147257043.png"
        />
        <img
          className="pointer-events-none absolute bottom-[-1px] right-[65px] h-[657px] w-[701px] max-w-none"
          alt="Rectangle"
          src="/figmaAssets/rectangle.png"
        />
        <div className="relative z-10 flex w-full max-w-[479px] flex-col items-start gap-[57.34px] px-[30px] py-[125px] sm:px-[60px] lg:ml-[100px] lg:px-0">
          <div className="flex w-full flex-col items-start gap-[33.45px]">
            <div className="flex w-full max-w-[643.92px] flex-col items-start gap-[21.5px]">
              <div className="relative h-[33px] w-[216px]">
                <div className="absolute inset-x-px top-px flex h-8 items-center justify-center gap-[8.78px] bg-[#ffffff14] px-[10.54px] py-[7.03px]">
                  <span className="mt-[-0.66px] whitespace-nowrap text-[14.1px] font-medium leading-none text-white [font-family:'Geist_Mono',Helvetica]">
                    {signalLabel}
                  </span>
                </div>
                <img
                  className="absolute left-0 top-0 h-[33px] w-[7px]"
                  alt=""
                  src="/figmaAssets/rectangle-34625199-3.svg"
                />
                <img
                  className="absolute left-[209px] top-0 h-[33px] w-[7px]"
                  alt=""
                  src="/figmaAssets/rectangle-34625198-1.svg"
                />
              </div>
              <h2
                id="documentation-preview-heading"
                className="max-w-[643.92px] text-[52px] font-normal leading-[0.98] tracking-[-1.43px] text-white sm:text-[61px] lg:text-[71.7px] [font-family:'Denim-TRIAL-Regular',Helvetica]"
              >
                {heading}
              </h2>
            </div>
            <p className="max-w-[479px] text-[23.9px] font-normal leading-[33.5px] tracking-[-0.48px] text-white opacity-60 [font-family:'Denim-TRIAL-Regular',Helvetica]">
              {description}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-auto rounded-none bg-white px-[21.5px] py-[16.73px] text-[#000123] hover:bg-white/90"
          >
            <span className="flex items-center gap-[14.34px]">
              <span className="text-[23.9px] font-medium leading-none tracking-[-0.48px] [font-family:'Denim-TRIAL-Medium',Helvetica]">
                {buttonLabel}
              </span>
              <span
                className="grid h-[23.89px] w-[14.34px] grid-rows-5"
                aria-hidden="true"
              >
                {arrowPixels.map((position, index) => (
                  <span
                    key={`arrow-pixel-${index}`}
                    className={`h-[5px] w-[5px] bg-[#000123] ${position}`}
                  />
                ))}
              </span>
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
};
