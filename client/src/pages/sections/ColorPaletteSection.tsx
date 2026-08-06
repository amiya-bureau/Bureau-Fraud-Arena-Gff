import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const certifications = [
  {
    label: "SOC 2 Type 2",
    image:
      "/figmaAssets/6800782727145f73679a41ad-aicpa-soc2-01-1-201-p-500-png.png",
    imageClassName: "h-[62px] w-[78.21%] opacity-55",
    labelClassName: "text-[11.2px]",
    opacityClassName: "",
  },
  {
    label: "ISO 27001",
    image:
      "/figmaAssets/67e432f221c3a700aa993bd6-iso-27001-final-20logo-p-500-png.png",
    imageClassName: "h-[62px] w-[78.21%] opacity-70",
    labelClassName: "text-[11.1px]",
    opacityClassName: "",
  },
  {
    label: "GDPR Ready",
    image: "/figmaAssets/67dd89a8d8fd350b344cbc60-group-201321316278-png.png",
    imageClassName: "h-[39px] w-[48.89%] opacity-70",
    labelClassName: "text-[11.7px]",
    opacityClassName: "opacity-80",
  },
];

const networkStats = [
  {
    value: "250M+",
    label: "Network signals processed",
  },
  {
    value: "18B+",
    label: "Risk decisions evaluated",
  },
  {
    value: "3.2M+",
    label: "Fraud patterns identified",
  },
  {
    value: "500+",
    label: "Connected businesses",
  },
];

export const ColorPaletteSection = (): JSX.Element => {
  return (
    <section className="grid min-h-[1080px] w-full overflow-hidden bg-[linear-gradient(to_bottom,#000123_0px,#000123_721px,#f5f9ff_721px,#f5f9ff_100%)]">
      <div className="col-start-1 row-start-1 mt-[721px] grid h-[359px] w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
        <img
          className="col-start-1 row-start-1 h-full w-full object-cover"
          alt="Mask group"
          src="/figmaAssets/mask-group-10.png"
        />
        <div className="col-start-1 row-start-1 justify-self-start self-center h-[149px] w-[min(260px,18vw)] rotate-180 bg-[linear-gradient(90deg,rgba(245,249,255,0)_0%,rgba(245,249,255,1)_100%)]" />
        <div className="col-start-1 row-start-1 justify-self-end self-center h-[149px] w-[min(260px,18vw)] bg-[linear-gradient(90deg,rgba(245,249,255,0)_0%,rgba(245,249,255,1)_100%)]" />
      </div>
      <div className="col-start-1 row-start-1 z-10 mx-auto flex w-full max-w-[1449px] flex-col gap-16 px-6 pt-[100px] sm:px-10 lg:px-[100px]">
        <header className="flex flex-col justify-between gap-12 lg:flex-row lg:items-end">
          <div className="flex max-w-[457.59px] flex-col items-start gap-[15.81px]">
            <div className="relative h-[27.2px] w-[180.76px]">
              <Badge className="absolute left-px top-0 h-[27px] rounded-none bg-[#4715ff33] px-[8.82px] py-[5.88px] [font-family:'Geist_Mono',Helvetica] text-[11.8px] font-medium leading-[normal] text-white hover:bg-[#4715ff33]">
                CONNECTED FRAUD SIGNALS
              </Badge>
              <img
                className="absolute left-0 top-0 h-7 w-1.5"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/rectangle-34625199-2.svg"
              />
              <img
                className="absolute left-[175px] top-0 h-7 w-1.5"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/rectangle-34625198-5.svg"
              />
            </div>
            <h2 className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[42px] font-normal leading-[normal] tracking-[-1.04px] text-white sm:text-[52px]">
              Network intelligence, not point solutions.
            </h2>
          </div>
          <aside className="flex w-full max-w-[272.64px] flex-col items-start gap-[18px]">
            <p className="[font-family:'Geist_Mono',Helvetica] text-[13.2px] font-medium leading-[19.1px] tracking-[0.68px] text-white opacity-50">
              PROUDLY CERTIFIED
            </p>
            <div className="flex w-full items-start gap-[18px]">
              {certifications.map((certification) => (
                <Card
                  key={certification.label}
                  className={`w-[78.88px] shrink-0 rounded-none border-0 bg-transparent text-white shadow-none ${certification.opacityClassName}`}
                >
                  <CardContent className="flex p-0 flex-col items-start gap-2">
                    <div className="flex h-[78.88px] w-full items-center justify-center border-[0.88px] border-[#ffffff40]">
                      <div
                        className={`${certification.imageClassName} bg-contain bg-center bg-no-repeat`}
                        style={{
                          backgroundImage: `url(${certification.image})`,
                        }}
                      />
                    </div>
                    <p
                      className={`whitespace-nowrap [font-family:'Denim-TRIAL-Medium',Helvetica] ${certification.labelClassName} font-medium leading-[17.2px] tracking-[-0.37px] text-white`}
                    >
                      {certification.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </aside>
        </header>
        <div className="grid w-full grid-cols-1 border-l border-t border-[#333450] sm:grid-cols-2 lg:grid-cols-4">
          {networkStats.map((stat, index) => (
            <Card
              key={stat.value}
              className="relative min-h-[294px] overflow-hidden rounded-none border-0 border-b border-r border-[#333450] bg-transparent text-white shadow-none"
            >
              {index === 1 && (
                <img
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  alt="Mask group"
                  src="/figmaAssets/mask-group-11.png"
                />
              )}
              <CardContent className="relative z-10 flex h-full min-h-[294px] flex-col justify-end p-10 pb-[54px]">
                <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[68px] font-normal leading-[normal] tracking-[-1.36px] text-white">
                  {stat.value}
                </p>
                <p className="mt-2 max-w-[220px] [font-family:'Denim-TRIAL-Regular',Helvetica] text-lg font-normal leading-[normal] tracking-[-0.36px] text-white opacity-60">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
