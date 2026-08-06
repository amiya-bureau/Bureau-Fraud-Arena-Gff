import { Button } from "@/components/ui/button";

const mediaGalleryContent = {
  eyebrow: "FRAUD INTELLIGENCE",
  heading: "Turn Every Signal Into A Smarter Decision.",
  cta: "Explore Bureau",
  photo: "/figmaAssets/group-48099767.png",
  background: "/figmaAssets/mask-group-14.png",
  leftEyebrowDecoration: "/figmaAssets/rectangle-34625199-7.svg",
  rightEyebrowDecoration: "/figmaAssets/rectangle-34625198-9.svg",
};

export const MediaGallerySection = (): JSX.Element => {
  return (
    <section className="flex w-full flex-col overflow-hidden">
      <img
        className="h-auto w-full"
        alt="Group"
        src={mediaGalleryContent.photo}
      />
      <div
        className="min-h-[359px] w-full bg-[#000123] bg-[url('/figmaAssets/mask-group-14.png')] bg-[length:100%_100%] bg-no-repeat px-[6.7%] py-[86px]"
        style={{ backgroundImage: `url(${mediaGalleryContent.background})` }}
      >
        <div className="mx-auto flex w-full max-w-[1255px] flex-col items-start justify-between gap-12 lg:flex-row lg:items-end lg:gap-10">
          <div className="flex max-w-[532px] flex-col items-start gap-6">
            <div className="grid h-[30px] w-[158px]">
              <div className="col-start-1 row-start-1 flex h-[29px] items-center justify-center gap-[7.94px] bg-[#4715ff33] px-[9.53px] py-[6.35px]">
                <span className="mt-[-0.95px] whitespace-nowrap [font-family:'Geist_Mono',Helvetica] text-[12.7px] font-medium leading-none text-white">
                  {mediaGalleryContent.eyebrow}
                </span>
              </div>
              <img
                className="col-start-1 row-start-1 h-[30px] w-[7px] self-start"
                alt=""
                aria-hidden="true"
                src={mediaGalleryContent.leftEyebrowDecoration}
              />
              <img
                className="col-start-1 row-start-1 h-[30px] w-[7px] justify-self-end self-start"
                alt=""
                aria-hidden="true"
                src={mediaGalleryContent.rightEyebrowDecoration}
              />
            </div>
            <h2 className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[clamp(42px,4vw,58px)] font-normal leading-[1.05] tracking-[-1.16px] text-white">
              {mediaGalleryContent.heading}
            </h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-auto rounded-none bg-white px-[17.62px] py-[15.66px] text-[#000123] hover:bg-white"
          >
            <span className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-[19.6px] font-medium leading-none tracking-[-0.39px]">
              {mediaGalleryContent.cta}
            </span>
            <span
              className="relative ml-[11.75px] block h-[19.58px] w-[11.75px]"
              aria-hidden="true"
            >
              <span className="absolute left-px top-0 h-1 w-1 bg-[#000123]" />
              <span className="absolute left-px top-4 h-1 w-1 bg-[#000123]" />
              <span className="absolute left-1 top-1 h-1 w-1 bg-[#000123]" />
              <span className="absolute left-1 top-3 h-1 w-1 bg-[#000123]" />
              <span className="absolute left-2 top-2 h-1 w-1 bg-[#000123]" />
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
};
