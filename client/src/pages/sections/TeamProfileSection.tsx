import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const performanceBenefits = [
  {
    title: "Reduce False Positives",
    description:
      "Approve more legitimate customers without compromising fraud protection.",
  },
  {
    title: "Detect Fraud Earlier",
    description:
      "Reveal coordinated attacks before they become costly incidents.",
  },
  {
    title: "Scale With Confidence",
    description:
      "Expand across markets with one unified fraud intelligence platform.",
  },
  {
    title: "Decision Confidence",
    description:
      "Reveal coordinated attacks before they become costly incidents.",
  },
];

export const TeamProfileSection = (): JSX.Element => {
  return (
    <section
      className="w-full overflow-hidden bg-[#000123]"
      aria-label="Bureau fraud intelligence platform"
    >
      <div className="mx-auto w-full max-w-[1320px]">
        <section className="relative min-h-[453px] bg-[#000123] px-6 py-16 sm:px-12 lg:h-[453px] lg:px-[84px] lg:py-[92px]">
          <div className="flex flex-col gap-14 lg:flex-row lg:gap-0">
            <div className="flex w-full flex-col items-start gap-[60px] lg:w-[396px]">
              <img
                className="h-[21.73px] w-[159.05px]"
                alt="Group"
                src="/figmaAssets/group-14.png"
              />
              <div className="relative h-[187.48px] w-[312.47px]">
                <p className="whitespace-nowrap [font-family:'Denim-TRIAL-Regular',Helvetica] text-[100px] font-normal leading-none tracking-[-2.8px] text-white sm:text-[140px]">
                  98%
                </p>
                <img
                  className="absolute left-[265px] top-9 h-11 w-11"
                  alt="Group"
                  src="/figmaAssets/group-48099778.png"
                />
                <p className="absolute bottom-0 left-0 whitespace-nowrap opacity-70 [font-family:'Denim-TRIAL-Regular',Helvetica] text-2xl font-normal leading-[33.6px] tracking-[-0.48px] text-white">
                  Decision Confidence
                </p>
              </div>
            </div>
            <div className="relative flex-1 lg:border-l lg:border-white/20 lg:pl-[86px]">
              <img
                className="pointer-events-none absolute left-0 top-0 hidden h-[269px] w-px lg:block"
                alt="Line"
                src="/figmaAssets/line-322.svg"
              />
              <img
                className="pointer-events-none absolute left-[86px] top-[134px] hidden h-px w-[670px] lg:block"
                alt="Line"
                src="/figmaAssets/line-321.svg"
              />
              <div className="grid gap-10 sm:grid-cols-2 lg:gap-x-[74px] lg:gap-y-[106px]">
                {performanceBenefits.map((benefit) => (
                  <article
                    key={benefit.title}
                    className="flex max-w-[298px] flex-col items-start gap-4"
                  >
                    <h2 className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-lg font-medium leading-[25.2px] tracking-[-0.36px] text-white">
                      {benefit.title}
                    </h2>
                    <p className="opacity-70 [font-family:'Denim-TRIAL-Regular',Helvetica] text-lg font-normal leading-[25.2px] tracking-[-0.36px] text-white">
                      {benefit.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="relative min-h-[627px] overflow-hidden bg-[#000124]">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            alt="Ascii magic"
            src="/figmaAssets/ascii-magic-3-2.png"
          />
          <img
            className="pointer-events-none absolute bottom-0 right-0 h-[266px] w-[482px] max-w-full"
            alt="Group"
            src="/figmaAssets/group-48099776.png"
          />
          <Card className="relative z-10 ml-auto min-h-[458px] w-full rounded-none border-0 bg-white shadow-none sm:w-[550px]">
            <CardContent className="flex min-h-[458px] gap-[46.1px] p-0">
              <div className="ml-[54.9px] mt-[58px] flex w-[387.59px] flex-col items-start gap-12">
                <div className="flex w-full flex-col items-start gap-[18px]">
                  <h2 className="w-full [-webkit-text-stroke:0.2px_#000124] [font-family:'Denim-TRIAL-Regular',Helvetica] text-[39.9px] font-normal leading-[41.3px] tracking-normal text-[#000124]">
                    Detect More.
                    <br />
                    Respond Faster.
                  </h2>
                  <p className="w-full opacity-60 [font-family:'Denim-TRIAL-Regular',Helvetica] text-lg font-normal leading-[25.2px] tracking-[0.09px] text-[#000124]">
                    Bring identity, device, behavioral, and transaction data
                    together to uncover what isolated fraud tools leave behind.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="h-auto w-auto gap-[8.91px] rounded-none p-0 [font-family:'Denim-TRIAL-Medium',Helvetica] text-[14.8px] font-medium leading-normal tracking-[-0.3px] text-[#000123] hover:bg-transparent hover:text-[#000123]"
                >
                  Explore Bureau
                  <span
                    className="grid h-[14.85px] w-[8.91px] grid-cols-3 grid-rows-5 items-center justify-items-center"
                    aria-hidden="true"
                  >
                    <span className="col-start-1 row-start-1 h-[3px] w-[3px] bg-[#000123]" />
                    <span className="col-start-2 row-start-2 h-[3px] w-[3px] bg-[#000123]" />
                    <span className="col-start-2 row-start-3 h-[3px] w-[3px] bg-[#000123]" />
                    <span className="col-start-2 row-start-4 h-[3px] w-[3px] bg-[#000123]" />
                    <span className="col-start-1 row-start-5 h-[3px] w-[3px] bg-[#000123]" />
                  </span>
                </Button>
              </div>
              <span
                className="mt-[319.7px] h-[7.77px] w-[7.77px] shrink-0 bg-[#706cff]"
                aria-hidden="true"
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </section>
  );
};
