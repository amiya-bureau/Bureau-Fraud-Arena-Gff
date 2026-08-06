import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const accentPoints = [
  { className: "top-[539px] left-[317px] bg-[#4715ff]" },
  { className: "top-[558px] left-[675px] bg-[#4715ff]" },
  { className: "top-[210px] left-[582px] bg-[#fd763a]" },
  { className: "top-[717px] left-[430px] bg-[#c7b0fe]" },
];

const headerLines = [
  { className: "left-[21px] w-[133px]", src: "/figmaAssets/line-307.svg" },
  { className: "left-[162px] w-[133px]", src: "/figmaAssets/line-307.svg" },
  { className: "left-[303px] w-[133px]", src: "/figmaAssets/line-307.svg" },
];

const arrowPixels = [
  "top-px left-0",
  "top-[15px] left-0",
  "top-1 left-1",
  "top-[11px] left-1",
  "top-[7px] left-[7px]",
];

export const MetricsOverviewSection = (): JSX.Element => {
  return (
    <section
      aria-label="Bureau network overview"
      className="relative w-full overflow-hidden bg-[url('/figmaAssets/ascii-magic-3-1.png')] bg-[100%_100%] bg-no-repeat py-[140px]"
    >
      <div className="mx-auto grid w-full max-w-[1267px] grid-cols-1 gap-6 px-6 lg:grid-cols-[minmax(0,811px)_456px] lg:px-0">
        <Card className="relative min-h-[811px] overflow-hidden rounded-none border-0 bg-white shadow-none">
          <CardContent className="relative h-[811px] p-0">
            <img
              className="absolute top-[121px] left-[238px] h-[690px] w-[573px] max-w-none"
              alt="Network visualization"
              src="/figmaAssets/group-48099734.png"
            />
            <img
              className="absolute top-[707px] left-[60px] h-11 w-[214px]"
              alt=""
              src="/figmaAssets/mask-group-5.png"
            />
            <h2 className="absolute top-[38px] left-[60px] w-[575px] [font-family:'Denim-TRIAL-Regular',Helvetica] text-[88px] font-normal leading-[normal] tracking-[-1.76px] text-[#000123]">
              Understanding The Network Behind Every Attack.
            </h2>
            {accentPoints.map((point) => (
              <span
                key={point.className}
                aria-hidden="true"
                className={`absolute h-2.5 w-2.5 ${point.className}`}
              />
            ))}
          </CardContent>
        </Card>
        <Card className="relative min-h-[811px] overflow-hidden rounded-none border-0 bg-[#000123] shadow-none">
          <CardContent className="relative h-[811px] p-0">
            {headerLines.map((line) => (
              <img
                key={line.className}
                className={`absolute top-[21px] h-px ${line.className}`}
                alt=""
                src={line.src}
              />
            ))}
            <img
              className="absolute top-[21px] left-[21px] h-px w-[62px]"
              alt=""
              src="/figmaAssets/line-310.svg"
            />
            <div className="absolute top-[43px] left-[21px] flex items-center gap-3">
              <div className="relative flex h-[37px] w-[37px] items-center justify-center rounded-full bg-[#4715ff]">
                <img
                  className="h-[17px] w-3.5"
                  alt=""
                  src="/figmaAssets/mask-group-6.png"
                />
              </div>
              <p className="w-fit whitespace-nowrap [font-family:'Denim-TRIAL-Regular',Helvetica] text-center text-lg font-normal leading-[normal] tracking-[-0.36px] text-white">
                Bureau.id
              </p>
            </div>
            <div className="absolute top-[120px] left-[21px] z-10 flex w-[383px] flex-col items-start gap-12">
              <h2 className="w-full [font-family:'Denim-TRIAL-Regular',Helvetica] text-5xl font-normal leading-[normal] tracking-[-0.96px] text-white">
                Understanding The Network Behind Every Attack.
              </h2>
              <Button
                type="button"
                variant="ghost"
                className="h-auto rounded-none bg-white px-[16.75px] py-[14.89px] [font-family:'Denim-TRIAL-Medium',Helvetica] text-[18.6px] font-medium leading-[normal] tracking-[-0.37px] text-[#000123] hover:bg-white hover:text-[#000123]"
              >
                <span>Explore Bureau</span>
                <span
                  aria-hidden="true"
                  className="relative ml-[11.17px] h-[18.61px] w-[11.16px]"
                >
                  {arrowPixels.map((position) => (
                    <span
                      key={position}
                      className={`absolute h-1 w-1 bg-[#000123] ${position}`}
                    />
                  ))}
                </span>
              </Button>
            </div>
            <img
              className="absolute bottom-0 left-0 h-[344px] w-full"
              alt="Network visualization"
              src="/figmaAssets/ascii-magic-4-1.png"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
