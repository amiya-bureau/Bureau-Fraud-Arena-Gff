import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const eventDetails = [
  { label: "Date", value: "October 28, 2026" },
  { label: "Time", value: "12:00 PM UTC" },
];

export const IllustrationShowcaseSection = (): JSX.Element => {
  return (
    <section className="w-full bg-[#d1dff9] px-6 py-12 2xl:min-h-[1080px] 2xl:px-[7.5%] 2xl:py-[136px]">
      <div className="mx-auto grid w-full max-w-[1543px] overflow-hidden 2xl:grid-cols-[283px_minmax(0,611px)_minmax(450px,649px)]">
        <aside className="relative min-h-[480px] overflow-hidden bg-[#000123] 2xl:min-h-[807px]">
          <img
            className="h-full w-full object-cover"
            alt="Mask group"
            src="/figmaAssets/mask-group-2.png"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[73.5%] bg-[linear-gradient(180deg,rgba(0,2,36,0)_0%,rgba(0,2,36,1)_100%)]" />
          <img
            className="absolute bottom-[65px] left-[45px] w-[194px]"
            alt="Mask group"
            src="/figmaAssets/mask-group-3.png"
          />
        </aside>
        <section className="bg-white">
          <figure className="m-0">
            <img
              className="block h-auto w-full"
              alt="Ascii magic"
              src="/figmaAssets/ascii-magic-2-1.png"
            />
          </figure>
          <div className="px-[52px] py-[47px] 2xl:h-[171px]">
            <h2 className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-[24.8px] font-medium leading-[31.7px] tracking-[-0.5px] text-[#000123]">
              ALEX CARTER
            </h2>
            <p className="mt-[7.43px] [font-family:'Geist_Mono',Helvetica] text-[22px] font-normal leading-[28.2px] tracking-[-0.44px] text-[#000123] opacity-50">
              VP OF RISK INTELLIGENCE
            </p>
          </div>
        </section>
        <Card className="rounded-none border-0 bg-[#ebf3fe] shadow-none 2xl:h-[807px]">
          <CardContent className="flex h-full flex-col justify-between p-8 2xl:px-[99.11px] 2xl:py-[51.41px]">
            <div>
              <div className="relative h-[39px] w-[143px]">
                <Badge className="absolute inset-y-0 left-[4px] z-10 h-[38px] rounded-none border-0 bg-white px-[12.27px] py-[8.18px] [font-family:'Geist_Mono',Helvetica] text-[16.4px] font-medium leading-normal text-[#4715ff] shadow-none hover:bg-white">
                  LIVE WEBINAR
                </Badge>
                <img
                  className="absolute -top-px left-0 z-20 h-[39px] w-[9px]"
                  alt="Rectangle"
                  src="/figmaAssets/rectangle-34625199-9.svg"
                />
                <img
                  className="absolute -top-px right-0 z-20 h-[39px] w-[9px]"
                  alt="Rectangle"
                  src="/figmaAssets/rectangle-34625198-6.svg"
                />
              </div>
              <h1 className="mt-[37.17px] [font-family:'Denim-TRIAL-Regular',Helvetica] text-5xl font-normal leading-none tracking-[-0.72px] text-[#000123] 2xl:text-6xl">
                Detect More.
                <br />
                Respond Faster.
                <br />
                <span className="text-[#00012380]">Stop Fraud Earlier.</span>
              </h1>
            </div>
            <div className="mt-12 2xl:mt-0">
              {eventDetails.map((detail, index) => (
                <div key={detail.label}>
                  <img
                    className={
                      index === 0
                        ? "block h-px w-full"
                        : "mt-[24.78px] block h-px w-full"
                    }
                    alt="Line"
                    src="/figmaAssets/line-302.svg"
                  />
                  <dl className="mt-[24.78px] flex items-center justify-between gap-4">
                    <dt className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-[24.8px] font-medium leading-[31.7px] tracking-[-0.5px] text-[#000123]">
                      {detail.label}
                    </dt>
                    <dd className="m-0 whitespace-nowrap text-right [font-family:'Denim-TRIAL-Medium',Helvetica] text-[24.8px] font-medium leading-[31.7px] tracking-[-0.5px] text-[#000123]">
                      {detail.value}
                    </dd>
                  </dl>
                </div>
              ))}

              <Button className="mt-[24.78px] flex h-auto w-full items-center justify-between rounded-none bg-[#000123] px-[20.15px] py-[17.91px] [font-family:'Denim-TRIAL-Medium',Helvetica] text-[22.4px] font-medium leading-normal tracking-[-0.45px] text-white hover:bg-[#000123]">
                <span>Reserve Your Spot</span>
                <span
                  className="grid h-[22px] w-[14px] grid-cols-3 grid-rows-5"
                  aria-hidden="true"
                >
                  <span className="col-start-1 row-start-1 h-1 w-1 bg-white" />
                  <span className="col-start-2 row-start-2 h-1 w-1 bg-white" />
                  <span className="col-start-3 row-start-3 h-1 w-1 bg-white" />
                  <span className="col-start-2 row-start-4 h-1 w-1 bg-white" />
                  <span className="col-start-1 row-start-5 h-1 w-1 bg-white" />
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
