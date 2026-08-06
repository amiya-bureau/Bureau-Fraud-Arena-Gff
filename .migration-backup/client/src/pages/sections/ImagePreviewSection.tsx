import { Card, CardContent } from "@/components/ui/card";

const guideVectors = [
  {
    src: "/figmaAssets/vector-2.svg",
    alt: "Vector",
    className: "col-start-1 row-start-1 mt-[9px] justify-self-end self-start",
  },
  {
    src: "/figmaAssets/vector-7.svg",
    alt: "Vector",
    className: "col-start-3 row-start-1 mt-[9px] justify-self-start self-start",
  },
  {
    src: "/figmaAssets/vector-1.svg",
    alt: "Vector",
    className: "col-start-1 row-start-1 mt-[635px] justify-self-end self-start",
  },
  {
    src: "/figmaAssets/vector.svg",
    alt: "Vector",
    className:
      "col-start-3 row-start-1 mt-[635px] justify-self-start self-start",
  },
];

export const ImagePreviewSection = (): JSX.Element => {
  return (
    <section className="w-full min-h-[1080px] overflow-hidden bg-[#d1dff9] pt-[125px]">
      <div className="mx-auto grid w-full max-w-[821px] grid-cols-[minmax(0,1fr)_minmax(0,571px)_minmax(0,1fr)]">
        {guideVectors.map((vector) => (
          <img
            key={vector.src}
            className={`pointer-events-none h-[13px] w-0 ${vector.className}`}
            alt={vector.alt}
            src={vector.src}
          />
        ))}

        <figure className="col-start-2 row-start-1 grid aspect-[571/657] w-full overflow-hidden bg-[#000123]">
          <img
            className="col-start-1 row-start-1 mt-[77px] ml-[47px] w-[487px] max-w-[calc(100%-47px)] self-start"
            alt="Group"
            src="/figmaAssets/group-48099714.png"
          />
          <img
            className="col-start-1 row-start-1 mt-[68px] w-[232px] max-w-[calc(100%-175px)] translate-x-[5.5px] justify-self-center self-start"
            alt="Image"
            src="/figmaAssets/image-2727.png"
          />
          <figcaption className="col-start-1 row-start-1 mt-[52px] w-fit translate-x-[5.5px] justify-self-center self-start bg-[#d1dff9] p-[3.95px] [font-family:'Geist_Mono',Helvetica] text-[7px] leading-[normal] font-medium tracking-[0] text-[#000123]">
            PERSON 1.0
          </figcaption>
        </figure>
        <Card className="col-start-2 row-start-2 h-[173px] rounded-none border-0 bg-white shadow-none">
          <CardContent className="flex items-end gap-[92px] overflow-visible px-[44px] pt-[38px] pb-0">
            <p className="w-[340px] shrink-0 [font-family:'Denim-TRIAL-Regular',Helvetica] text-[42px] leading-[normal] font-normal tracking-[-0.84px] text-[#000123]">
              Intelligence Beyond The Individual.
            </p>
            <img
              className="mb-1 shrink-0"
              alt="Frame"
              src="/figmaAssets/frame-2085664797.svg"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
