import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const demoAssets = {
  background: "/figmaAssets/group-48099710.png",
  bureauPreview: "/figmaAssets/group-5.png",
  networkMarker: "/figmaAssets/group-48099711.png",
  secondaryMarker: "/figmaAssets/group-48099712.png",
  labelStart: "/figmaAssets/rectangle-34625199.svg",
  labelEnd: "/figmaAssets/rectangle-34625198-3.svg",
};

export const ProductDemoSection = (): JSX.Element => {
  return (
    <section className="relative isolate w-full overflow-hidden bg-[#000123] aspect-[77/45]">
      <img
        className="absolute inset-0 h-full w-full"
        alt=""
        aria-hidden="true"
        src={demoAssets.background}
      />
      <Card className="absolute left-[9.52%] top-[16.3%] h-[67.4%] w-[80.95%] overflow-hidden rounded-none border-0 bg-white shadow-none">
        <CardContent className="relative h-full p-0">
          <div className="absolute left-[4.68%] top-[10.71%] flex w-[46.46%] flex-col items-start gap-[28.6%]">
            <div className="flex w-full flex-col items-start gap-[18px]">
              <div className="relative h-[38px] w-[216px]">
                <Badge className="relative z-0 h-[37px] w-[216px] justify-center rounded-none border-0 bg-[#ebf3fe] px-3 py-2 [font-family:'Geist_Mono',Helvetica] text-base font-medium tracking-[0] text-[#4715ff] hover:bg-[#ebf3fe]">
                  UNIFIED INTELLIGENCE
                </Badge>
                <img
                  className="absolute left-0 top-0 z-10 h-[38px] w-2"
                  alt=""
                  aria-hidden="true"
                  src={demoAssets.labelStart}
                />
                <img
                  className="absolute right-0 top-0 z-10 h-[38px] w-2"
                  alt=""
                  aria-hidden="true"
                  src={demoAssets.labelEnd}
                />
              </div>
              <h2 className="w-full [font-family:'Denim-TRIAL-Regular',Helvetica] text-[clamp(2rem,2.92vw,54px)] font-normal leading-[normal] tracking-[-1.08px]">
                <span className="tracking-[-0.58px] text-[#000123]">
                  Reveal hidden connections across every interaction to make
                  faster.{" "}
                </span>
                <span className="tracking-[-0.58px] text-[#00012366]">
                  more confident risk decisions.
                </span>
              </h2>
            </div>
            <Button
              type="button"
              className="h-auto rounded-none border-0 bg-[#000123] px-[18px] py-4 [font-family:'Denim-TRIAL-Medium',Helvetica] text-xl font-medium leading-[normal] tracking-[-0.4px] text-white hover:bg-[#000123]"
            >
              <span>Explore Bureau</span>
              <span className="relative ml-3 block h-5 w-3" aria-hidden="true">
                <span className="absolute left-0 top-0 h-1 w-1 bg-white" />
                <span className="absolute left-0 top-4 h-1 w-1 bg-white" />
                <span className="absolute left-1 top-1 h-1 w-1 bg-white" />
                <span className="absolute left-1 top-3 h-1 w-1 bg-white" />
                <span className="absolute left-2 top-2 h-1 w-1 bg-white" />
              </span>
            </Button>
          </div>
          <img
            className="absolute left-[49.93%] top-[9.75%] h-[80.5%] w-[65.51%]"
            alt=""
            aria-hidden="true"
            src={demoAssets.bureauPreview}
          />
          <img
            className="absolute left-[65.98%] top-[29.26%] h-[12.64%] w-[6.15%]"
            alt=""
            aria-hidden="true"
            src={demoAssets.networkMarker}
          />
          <img
            className="absolute left-[82.49%] top-[67.86%] h-[6.32%] w-[3.07%]"
            alt=""
            aria-hidden="true"
            src={demoAssets.secondaryMarker}
          />
          <p className="absolute left-[65.98%] top-[43.82%] w-[116px] [font-family:'Geist_Mono',Helvetica] text-base font-medium leading-[normal] tracking-[0] text-[#4715ff]">
            NETWORK MATCH FOUND
          </p>
        </CardContent>
      </Card>
    </section>
  );
};
