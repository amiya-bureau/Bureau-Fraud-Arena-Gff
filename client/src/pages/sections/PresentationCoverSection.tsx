import { Card, CardContent } from "@/components/ui/card";

const legendItems = [
  { label: "SCANS", color: "bg-[#706cff]" },
  { label: "PREVIOUS", color: "bg-[#203592]" },
];

const metrics = [
  { value: "118", label: "+19% SCANS" },
  { value: "51", label: "+21% USER" },
];

export const PresentationCoverSection = (): JSX.Element => {
  return (
    <section
      className="relative isolate w-full overflow-hidden bg-[#000123]"
      aria-labelledby="presentation-cover-title"
    >
      <div className="relative mx-auto aspect-[873/1080] w-full max-w-[873px] overflow-hidden">
        <img
          className="absolute left-0 top-[47.13%] h-[54.07%] w-[170.37%] max-w-none"
          alt="Group"
          src="/figmaAssets/group-1.png"
        />
        <img
          className="absolute right-[-70.33%] top-0 h-[54.07%] w-full max-w-none"
          alt="Group"
          src="/figmaAssets/group-2.png"
        />
        <Card className="absolute left-[20.62%] top-[16.67%] h-[66.67%] w-[58.76%] rounded-none border-[#d1dff9] bg-[#000123] shadow-none">
          <CardContent className="flex h-full flex-col p-0">
            <header className="px-[9.36%] pt-[6.25%]">
              <h1
                id="presentation-cover-title"
                className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[clamp(2rem,7.79vw,4.25rem)] font-normal leading-[1.02] tracking-[0] text-white"
              >
                Threat
                <br />
                Intelligence
              </h1>
            </header>
            <div className="mt-[12.78%] px-[9.36%]">
              <img
                className="block h-px w-full"
                alt="Line"
                src="/figmaAssets/line-291.svg"
              />
              <div
                className="mt-[3.84%] flex items-center gap-[18px]"
                aria-label="Chart legend"
              >
                {legendItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <span
                      className={`h-[11px] w-[11px] shrink-0 ${item.color}`}
                      aria-hidden="true"
                    />
                    <span className="[font-family:'Geist_Mono',Helvetica] text-base font-medium leading-normal text-white">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <img
                className="mt-[15.15%] block h-auto w-full"
                alt="Frame"
                src="/figmaAssets/frame-2085664783.svg"
              />
              <img
                className="mt-[6.46%] block h-px w-full"
                alt="Line"
                src="/figmaAssets/line-291.svg"
              />
              <footer className="mt-[2.88%] flex justify-between gap-[8%]">
                <p className="mt-[3.12%] max-w-[154px] [font-family:'Geist_Mono',Helvetica] text-base font-medium leading-normal text-white">
                  EVOLUTION WITHIN
                  <br />
                  CURRENT PERIOD
                </p>
                <dl className="flex shrink-0 items-start gap-10">
                  {metrics.map((metric) => (
                    <div key={metric.label}>
                      <dt className="sr-only">{metric.label}</dt>
                      <dd className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[clamp(2rem,7.79vw,4.25rem)] font-normal leading-[1.02] tracking-[0] text-white">
                        {metric.value}
                      </dd>
                      <dd className="[font-family:'Geist_Mono',Helvetica] text-sm font-medium leading-normal text-white">
                        {metric.label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </footer>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
