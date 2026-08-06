import { Card, CardContent } from "@/components/ui/card";

const typefaceWeights = [
  {
    label: "REGULAR",
    className: "[font-family:'Denim-TRIAL-Regular',Helvetica] font-normal",
  },
  {
    label: "MEDIUM",
    className: "[font-family:'Denim-TRIAL-Medium',Helvetica] font-medium",
  },
  {
    label: "SEMI-BOLD",
    className: "[font-family:'Denim-TRIAL-SemiBold',Helvetica] font-semibold",
  },
];

export const WebsiteShowcaseSection = (): JSX.Element => {
  return (
    <section
      aria-label="Typeface showcase"
      className="grid aspect-[2498/1080] w-full grid-cols-[991fr_891fr_577fr] gap-0 bg-white p-5"
    >
      <section
        aria-label="Denim letterform examples"
        className="grid min-h-0 min-w-0 grid-cols-1 grid-rows-1 overflow-hidden"
      >
        <img
          className="col-start-1 row-start-1 h-full w-full object-cover"
          alt="Group"
          src="/figmaAssets/group-48099765.png"
        />
        <Card className="col-start-1 row-start-1 z-10 ml-[20%] mt-[14.3%] h-[71.4%] w-[60%] rounded-none border border-solid border-[#d1dff9] bg-white shadow-none">
          <CardContent className="h-full p-0" />
        </Card>
        <img
          className="col-start-1 row-start-1 z-20 ml-[32.5%] mt-[26.2%] h-auto w-[34.9%] self-start justify-self-start"
          alt="Aa"
          src="/figmaAssets/aa.png"
        />
        <img
          className="col-start-1 row-start-1 z-20 ml-[33.2%] mt-[52%] h-auto w-[33.6%] self-start justify-self-start"
          alt="Bb"
          src="/figmaAssets/bb.png"
        />
      </section>
      <section
        aria-labelledby="denim-typeface-title"
        className="flex min-h-0 min-w-0 flex-col items-start gap-[13.85%] bg-[#f5f9ff] pl-[18.2%] pt-[10.9%]"
      >
        <header className="flex w-[65.1%] flex-col items-start gap-[13px]">
          <p className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-2xl font-medium tracking-[4.32px] text-[#000123]">
            TYPEFACE
          </p>
          <h2
            id="denim-typeface-title"
            className="w-full text-center [font-family:'Denim-TRIAL-Regular',Helvetica] text-[clamp(44px,4.8vw,120px)] font-normal leading-none tracking-[-2.4px] text-[#000123]"
          >
            Denim
          </h2>
        </header>
        <div className="flex w-[65.1%] flex-col items-start gap-[29px]">
          <img
            className="h-px w-full"
            alt="Line"
            src="/figmaAssets/line-314.svg"
          />
          <div className="flex w-full items-center justify-between gap-4">
            {typefaceWeights.map((weight) => (
              <p
                key={weight.label}
                className={`whitespace-nowrap text-center text-2xl leading-none tracking-normal text-[#000123] ${weight.className}`}
              >
                {weight.label}
              </p>
            ))}
          </div>
          <img
            className="h-px w-full"
            alt="Line"
            src="/figmaAssets/line-314.svg"
          />
        </div>
        <div className="flex w-[50.9%] flex-col items-start gap-[60px]">
          <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[clamp(20px,1.6vw,40px)] font-normal leading-[1.28] tracking-[-0.8px] text-[#000123]">
            The quick brown fox jumps over the lazy dog
          </p>
          <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[clamp(20px,1.6vw,40px)] font-normal leading-[1.28] tracking-[-0.8px] text-[#000123]">
            1234567890
            <br />
            ~!@#$%^&amp;*()_+
          </p>
        </div>
      </section>
      <section
        aria-labelledby="geist-typeface-title"
        className="grid min-h-0 min-w-0 grid-cols-1 grid-rows-1 overflow-hidden bg-[#000123]"
      >
        <img
          className="col-start-1 row-start-1 h-full w-full object-cover"
          alt="Mask group"
          src="/figmaAssets/mask-group-12.png"
        />
        <div className="col-start-1 row-start-1 z-10 ml-[20.8%] mt-[10.8%] flex w-[58.4%] flex-col items-center gap-[11.44%] self-start">
          <header className="flex w-[60.2%] flex-col items-center gap-3">
            <p className="w-full [font-family:'Geist_Mono',Helvetica] text-xl font-normal leading-none tracking-[-0.8px] text-white opacity-60">
              SECONDARY TYPEFACE
            </p>
            <h2
              id="geist-typeface-title"
              className="w-full text-center [font-family:'Geist_Mono',Helvetica] text-[clamp(18px,1.36vw,34px)] font-normal leading-none tracking-[-1.36px] text-white"
            >
              GEIST MONO
            </h2>
          </header>
          <p className="w-full text-center [font-family:'Geist_Mono',Helvetica] text-[clamp(92px,10.93vw,273px)] font-normal leading-none tracking-[-10.92px] text-[#333450]">
            Aa
          </p>
          <div className="flex w-full flex-col items-start gap-7">
            <p className="w-full text-center [font-family:'Geist_Mono',Helvetica] text-[clamp(14px,0.88vw,22px)] font-normal leading-[1.28] tracking-[-0.44px] text-white">
              THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG
            </p>
            <p className="w-full text-center [font-family:'Geist_Mono',Helvetica] text-[clamp(14px,0.88vw,22px)] font-normal leading-[1.28] tracking-[-0.44px] text-white">
              1234567890
              <br />
              ~!@#$%^&amp;*()_+
            </p>
          </div>
        </div>
      </section>
    </section>
  );
};
