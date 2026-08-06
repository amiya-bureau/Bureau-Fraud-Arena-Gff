import { Card, CardContent } from "@/components/ui/card";

const networkPaths = [
  {
    src: "/figmaAssets/vector-6482.svg",
    alt: "Network connection",
    className: "absolute -top-0.5 left-[calc(50%+1px)] h-[291px] w-px",
  },
  {
    src: "/figmaAssets/vector-6489.svg",
    alt: "Network connection",
    className: "absolute left-1/2 top-[381px] h-[291px] w-px",
  },
  {
    src: "/figmaAssets/vector-6487.svg",
    alt: "Network connection",
    className: "absolute -top-0.5 left-[calc(50%-205px)] h-[336px] w-px",
  },
  {
    src: "/figmaAssets/vector-6490.svg",
    alt: "Network connection",
    className:
      "absolute left-[calc(50%+206px)] top-[478px] h-[195px] w-[103px]",
  },
  {
    src: "/figmaAssets/vector-6488.svg",
    alt: "Network connection",
    className: "absolute left-[calc(50%-205px)] top-[calc(50%-1px)] h-px w-40",
  },
  {
    src: "/figmaAssets/vector-6483.svg",
    alt: "Network connection",
    className: "absolute left-[306px] top-[-13px] h-[257px] w-[47px]",
  },
  {
    src: "/figmaAssets/vector-6491.svg",
    alt: "Network connection",
    className: "absolute left-[258px] top-[427px] h-[257px] w-[47px]",
  },
  {
    src: "/figmaAssets/vector-6484.svg",
    alt: "Network connection",
    className: "absolute -top-16 left-[258px] h-[257px] w-[47px]",
  },
  {
    src: "/figmaAssets/vector-6492.svg",
    alt: "Network connection",
    className: "absolute left-[306px] top-[477px] h-[257px] w-[47px]",
  },
  {
    src: "/figmaAssets/vector-6485.svg",
    alt: "Network connection",
    className: "absolute -top-16 left-[52px] h-[307px] w-[253px]",
  },
  {
    src: "/figmaAssets/vector-6493.svg",
    alt: "Network connection",
    className: "absolute left-[306px] top-[427px] h-[307px] w-[253px]",
  },
  {
    src: "/figmaAssets/vector-6486.svg",
    alt: "Network connection",
    className: "absolute left-[306px] top-[-113px] h-[307px] w-[253px]",
  },
  {
    src: "/figmaAssets/vector-6494.svg",
    alt: "Network connection",
    className: "absolute left-[52px] top-[476px] h-[307px] w-[253px]",
  },
];

const networkMarkers = [
  {
    className: "absolute left-[56.79%] top-[calc(50%-97px)] h-3 w-0",
  },
  {
    className: "absolute left-[15.49%] top-[calc(50%-97px)] h-3 w-0",
  },
  {
    className: "absolute left-[82.79%] top-[calc(50%+137px)] h-3 w-0",
  },
  {
    className: "absolute left-[49.14%] top-[calc(50%+137px)] h-3 w-0",
  },
];

export const AnalyticsReportSection = (): JSX.Element => {
  return (
    <section className="w-full bg-[#000123] px-4 py-16 sm:px-8 lg:px-[9.5%] lg:py-[185px]">
      <Card className="mx-auto w-full max-w-[1263px] rounded-none border-0 bg-white shadow-none">
        <CardContent className="grid min-h-[711px] grid-cols-1 items-center gap-12 p-8 sm:p-12 lg:grid-cols-[413px_minmax(0,611px)] lg:gap-[160px] lg:px-[58px] lg:py-[21px]">
          <div className="flex h-full min-h-[595px] flex-col justify-between py-[37px]">
            <header className="flex flex-col gap-[23px]">
              <div className="relative h-[41px] w-[256px]">
                <div className="absolute left-0 top-px inline-flex h-10 items-center justify-center gap-[11px] bg-[#ebf3fe] px-[13px] py-[9px]">
                  <span className="[font-family:'Geist_Mono',Helvetica] text-[17.4px] font-medium leading-none text-[#4715ff]">
                    BEYOND FRAUD DETECTION
                  </span>
                </div>
                <img
                  className="absolute -top-px -left-px h-[41px] w-[9px]"
                  alt=""
                  src="/figmaAssets/rectangle-34625199-10.svg"
                />
                <img
                  className="absolute -top-px left-[247px] h-[41px] w-[9px]"
                  alt=""
                  src="/figmaAssets/rectangle-34625198-4.svg"
                />
              </div>
              <h2 className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[clamp(42px,4.9vw,60.7px)] font-normal leading-[1.02] tracking-[-1.21px] text-[#000123]">
                Unified platform
                <br />
                that sees the
                <br />
                full picture.
              </h2>
            </header>
            <img
              className="h-[35px] w-[172px] object-contain"
              alt=""
              src="/figmaAssets/mask-group-13.png"
            />
          </div>
          <figure
            aria-label="Network match visualization"
            className="relative h-[669px] w-full overflow-hidden bg-[#ebf3fe]"
          >
            <div className="absolute left-[calc(50%-1385px)] top-[calc(50%-33px)] h-[929px] w-[2772px] rounded-[1385.81px/464.66px] bg-[#d1dff9] opacity-60 blur-[167.59px]" />
            <div className="absolute left-[calc(50%-46px)] top-[calc(50%-46px)] h-[93px] w-[93px] border-[1.75px] border-[#bfd3f8] bg-[#ebf3fe]" />
            <img
              className="absolute left-[calc(50%-46px)] top-[calc(50%-46px)] h-[93px] w-[93px]"
              alt=""
              src="/figmaAssets/group-2147257047.png"
            />
            <div className="absolute left-[412px] top-[326px] w-[107px] [font-family:'Geist_Mono',Helvetica] text-[14.7px] font-medium leading-normal text-[#4715ff]">
              NETWORK MATCH FOUND
            </div>
            <img
              className="absolute left-[306px] top-[334px] h-0.5 w-[97px]"
              alt=""
              src="/figmaAssets/line-324.svg"
            />
            {networkPaths.map((path) => (
              <img
                key={path.src}
                className={path.className}
                alt={path.alt}
                src={path.src}
              />
            ))}

            {networkMarkers.map((marker, index) => (
              <img
                key={`network-marker-${index}`}
                className={marker.className}
                alt=""
                src="/figmaAssets/vector-3.svg"
              />
            ))}
          </figure>
        </CardContent>
      </Card>
    </section>
  );
};
