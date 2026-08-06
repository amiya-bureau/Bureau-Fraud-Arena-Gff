import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const signalMarkers = [
  "top-[263px] left-[526px]",
  "top-[185px] left-[321px]",
  "top-[311px] left-32",
  "top-[355px] left-[183px]",
  "top-[197px] left-[551px]",
];

const transactionMarkers = [
  { className: "top-[221px] left-[266px] bg-[#4715ff]" },
  { className: "top-[270px] left-[266px] bg-[#fd763a]" },
  { className: "top-[334px] left-[483px] bg-[#fd763a]" },
  { className: "top-[238px] left-[483px] bg-[#4715ff]" },
];

const networkMarkers = [
  "top-[234px] left-[559px]",
  "top-[559px] left-[559px]",
  "top-[397px] left-[72px]",
  "top-[234px] left-[235px]",
  "top-[721px] left-[397px]",
  "top-[397px] left-[721px]",
];

export const ProjectPortfolioSection = (): JSX.Element => {
  return (
    <section className="w-full min-h-[1080px] overflow-x-auto bg-[#000123] px-6 py-[140px] md:px-[150px]">
      <div className="grid w-max grid-cols-[811px_614.37px_810.79px] items-start gap-6">
        <article className="relative h-[811px] w-[811px] overflow-hidden">
          <div className="absolute left-0 top-0 h-[381px] w-[578px] bg-[#ebf3fe]" />
          <img
            className="absolute left-0 top-0 h-[381px] w-[578px]"
            alt="Mask group"
            src="/figmaAssets/mask-group-7.png"
          />
          <div className="absolute left-0 top-[381px] h-[430px] w-[811px] bg-white" />
          <div className="absolute left-[578px] top-0 h-[381px] w-[233px] rotate-180 bg-[#4715ff]" />
          <img
            className="absolute left-[578px] top-0 h-[381px] w-[233px]"
            alt="Mask group"
            src="/figmaAssets/mask-group-8.png"
          />
          <p className="absolute left-[54px] top-[42px] whitespace-nowrap [font-family:'Denim-TRIAL-Regular',Helvetica] text-[117.9px] font-normal leading-[normal] tracking-[-2.36px] text-[#000123]">
            12.8M
          </p>
          {signalMarkers.map((markerClass) => (
            <span
              key={markerClass}
              aria-hidden="true"
              className={`absolute h-2 w-2 bg-[#babeca] ${markerClass}`}
            />
          ))}

          <div className="absolute left-[54px] top-[435px] flex h-[323px] w-[704px] flex-col items-start justify-between">
            <h2 className="w-[359.87px] [font-family:'Denim-TRIAL-Regular',Helvetica] text-[45.6px] font-normal leading-[normal] tracking-[-0.91px] text-[#000123]">
              Network signals analyzed every day
            </h2>
            <div className="flex w-full items-end justify-between">
              <img
                className="h-[38.12px] w-[184.56px]"
                alt="Mask group"
                src="/figmaAssets/mask-group-9.png"
              />
              <p className="whitespace-nowrap opacity-50 [font-family:'Denim-TRIAL-Regular',Helvetica] text-[21.4px] font-normal leading-[normal] tracking-[-0.43px] text-[#000123]">
                bureau.id
              </p>
            </div>
          </div>
        </article>
        <div className="flex w-[614.37px] flex-col gap-6">
          <Card className="relative h-[381.3px] w-[614.37px] overflow-hidden rounded-none border-0 bg-white shadow-none">
            <CardContent className="relative h-full p-0">
              <img
                className="absolute left-[13px] top-[197px] h-[170px] w-[589px]"
                alt="Vector"
                src="/figmaAssets/vector-3069.svg"
              />
              <div className="absolute left-8 top-8 flex h-[169px] w-[255px] flex-col items-start gap-[12.89px]">
                <div className="flex h-[117.07px] w-full flex-col">
                  <p className="mt-[-1.07px] [font-family:'Geist_Mono',Helvetica] text-[15px] font-medium leading-[normal] text-[#000123]">
                    TOTAL VALUE
                  </p>
                  <p className="mb-[-1.85px] text-center [font-family:'Denim-TRIAL-Regular',Helvetica] text-[85.9px] font-normal leading-[normal] tracking-[-1.72px] text-[#000123]">
                    $2.9TN
                  </p>
                </div>
                <p className="w-[218.04px] [font-family:'Geist_Mono',Helvetica] text-[15px] font-medium leading-[normal] text-[#000123]">
                  M2M PAYMENT TRANSACTIONS BY OCTOBER 2026
                </p>
              </div>
              <img
                className="absolute left-[13px] top-[196px] h-[171px] w-[589px]"
                alt="Vector"
                src="/figmaAssets/vector-3068.svg"
              />
              <img
                className="absolute left-[13px] top-[273px] h-[93px] w-[589px]"
                alt="Vector"
                src="/figmaAssets/vector-3071.svg"
              />
              <img
                className="absolute left-[13px] top-[272px] h-[95px] w-[589px]"
                alt="Vector"
                src="/figmaAssets/vector-3070.svg"
              />
              {transactionMarkers.map((marker) => (
                <span
                  key={marker.className}
                  aria-hidden="true"
                  className={`absolute h-2 w-2 ${marker.className}`}
                />
              ))}
            </CardContent>
          </Card>
          <img
            className="h-[405.27px] w-full"
            alt="Ascii magic"
            src="/figmaAssets/ascii-magic-1-2.png"
          />
        </div>
        <Card className="relative h-[810.79px] w-[810.79px] overflow-hidden rounded-none border-0 bg-white shadow-none">
          <CardContent className="relative h-full p-0">
            <img
              className="absolute left-0 top-0 h-[811px] w-[811px]"
              alt="Group"
              src="/figmaAssets/group-48099749.png"
            />
            {networkMarkers.map((markerClass) => (
              <span
                key={markerClass}
                aria-hidden="true"
                className={`absolute h-[17px] w-[17px] bg-[#d9d9d9] ${markerClass}`}
              />
            ))}

            <div className="absolute left-1/2 top-[240px] flex w-[550px] -translate-x-1/2 flex-col items-center gap-[36.85px]">
              <div className="flex w-full flex-col items-center gap-[16.55px]">
                <div className="relative h-[29px] w-[163.05px]">
                  <div className="absolute left-px top-0 inline-flex items-center justify-center gap-[7.52px] bg-[#ebf3fe] px-[9.03px] py-[6.02px]">
                    <p className="whitespace-nowrap [font-family:'Geist_Mono',Helvetica] text-xs font-medium leading-[normal] text-[#4715ff]">
                      NETWORK INTELLIGENCE
                    </p>
                  </div>
                  <img
                    className="absolute left-[156px] top-0 h-[29px] w-1.5"
                    alt="Rectangle"
                    src="/figmaAssets/rectangle-34625198-2.svg"
                  />
                  <img
                    className="absolute left-0 top-0 h-[29px] w-1.5"
                    alt="Rectangle"
                    src="/figmaAssets/rectangle-34625199-5.svg"
                  />
                </div>
                <h2 className="w-full text-center [font-family:'Denim-TRIAL-Regular',Helvetica] text-[57.2px] font-normal leading-[normal] tracking-[-1.14px] text-[#000123]">
                  Connect Every Signal.
                  <br />
                  Make Every Decision Smarter.
                </h2>
              </div>
              <Button
                type="button"
                className="h-auto rounded-none bg-[#000123] px-[16.31px] py-[14.5px] text-white hover:bg-[#000123]/90"
              >
                <span className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-[18.1px] font-medium leading-[normal] tracking-[-0.36px]">
                  Read more
                </span>
                <span
                  aria-hidden="true"
                  className="relative ml-[10.87px] h-[18.12px] w-[10.87px]"
                >
                  <span className="absolute left-0 top-px h-1 w-1 bg-white" />
                  <span className="absolute left-0 top-3.5 h-1 w-1 bg-white" />
                  <span className="absolute left-1 top-1 h-1 w-1 bg-white" />
                  <span className="absolute left-1 top-[11px] h-1 w-1 bg-white" />
                  <span className="absolute left-[7px] top-[7px] h-1 w-1 bg-white" />
                </span>
              </Button>
            </div>
            <img
              className="absolute left-[374px] top-[49px] h-[63px] w-[63px]"
              alt="Group"
              src="/figmaAssets/group-48099750.png"
            />
            <img
              className="absolute left-[235px] top-[559px] h-[17px] w-[17px]"
              alt="Group"
              src="/figmaAssets/group-48099751.png"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
