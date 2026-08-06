import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

const solutionCards = [
  {
    title: "Network Intelligence",
    description:
      "Reveal hidden connections across merchants to identify coordinated fraud.",
  },
  {
    title: "Risk Decisioning",
    description:
      "Combine every signal into faster, more accurate fraud decisions.",
  },
  {
    title: "Lifecycle Monitoring",
    description:
      "Continuously monitor risk beyond onboarding as threats evolve.",
  },
  {
    title: "AML Screening",
    description:
      "Screen against global watchlists and compliance requirements.",
  },
];

const intelligenceLabels = [
  {
    label: "Device Intelligence",
    className: "left-[158px]",
  },
  {
    label: "Behavioral Intelligence",
    className: "left-[570px]",
  },
  {
    label: "Transaction Monitoring",
    className: "left-[1011px]",
  },
];

const connectorLines = [
  {
    className: "top-16 left-[679px]",
  },
  {
    className: "top-[175px] left-[679px]",
  },
  {
    className: "top-[175px] left-[1123px]",
  },
  {
    className: "top-[175px] left-[253px]",
  },
];

const connectorNodes = [
  {
    className: "left-[248px] bg-[#b082ff]",
  },
  {
    className: "left-[674px] bg-[#fd763a]",
  },
  {
    className: "left-[1118px] bg-[#5244fc]",
  },
];

export const ProfileCardSection = (): JSX.Element => {
  return (
    <section className="relative min-h-[1080px] w-full overflow-hidden bg-white py-[130px]">
      <img
        className="absolute left-px top-0 h-[125.59%] w-[533px] object-cover"
        alt="Group"
        src="/figmaAssets/group-8.png"
      />
      <img
        className="absolute right-px top-0 h-[125.59%] w-[533px] object-cover"
        alt="Group"
        src="/figmaAssets/group-9.png"
      />
      <div className="absolute inset-x-0 bottom-[104px] h-[761px] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,1)_45%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-[1394px] flex-col items-center gap-20 px-6 2xl:px-0">
        <header className="flex w-full max-w-[942px] flex-col items-center gap-6 text-center">
          <h2 className="m-0 [font-family:'Denim-TRIAL-Regular',Helvetica] text-6xl font-normal leading-[1.12] tracking-[-1.2px] text-[#000123]">
            One platform connecting every signal to stop fraud with confidence.
          </h2>
          <p className="m-0 [font-family:'Denim-TRIAL-Regular',Helvetica] text-2xl font-normal leading-normal tracking-[-0.48px] text-[#000123]">
            powered by network-level intelligence.
          </p>
        </header>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1394px]">
            <div className="relative h-[235px]">
              <img
                className="absolute left-[254px] top-8 h-[92px] w-[871px]"
                alt="Rectangle"
                src="/figmaAssets/rectangle-34625280.svg"
              />
              <div className="absolute left-[648px] top-0 flex h-16 w-16 items-start bg-[#4715ff] px-[19px] pb-4 pt-[17px]">
                <img
                  className="h-[30.59px] w-[26px]"
                  alt="Mask group"
                  src="/figmaAssets/mask-group-4.png"
                />
              </div>
              {intelligenceLabels.map((item) => (
                <div
                  key={item.label}
                  className={`absolute top-[124px] inline-flex items-center justify-center gap-2.5 border border-solid border-[#d1dff9] bg-[#f5f9ff] px-[18px] py-3.5 ${item.className}`}
                >
                  <span className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-xl font-normal leading-normal tracking-[-0.4px] text-[#000123] opacity-70 whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              ))}

              {connectorLines.map((line, index) => (
                <img
                  key={`connector-line-${index}`}
                  className={`absolute h-[60px] w-px ${line.className}`}
                  alt=""
                  aria-hidden="true"
                  src="/figmaAssets/line-304.svg"
                />
              ))}
            </div>
            <div className="relative h-[314px] border border-dashed border-[#999aa7] px-[18px] pt-[17px]">
              {connectorNodes.map((node, index) => (
                <div
                  key={`connector-node-${index}`}
                  className={`absolute -top-[6px] h-3 w-3 ${node.className}`}
                  aria-hidden="true"
                />
              ))}

              <div className="grid grid-cols-4 gap-[18px]">
                {solutionCards.map((card) => (
                  <Card
                    key={card.title}
                    className="flex h-[278px] w-[326px] flex-col justify-between rounded-none border-0 bg-[#f5f9ff] p-10 shadow-none"
                  >
                    <CardContent className="flex flex-col gap-[18px] p-0">
                      <h3 className="m-0 [font-family:'Denim-TRIAL-Medium',Helvetica] text-2xl font-medium leading-normal tracking-[-0.48px] text-[#000123]">
                        {card.title}
                      </h3>
                      <p className="m-0 [font-family:'Denim-TRIAL-Regular',Helvetica] text-xl font-normal leading-[25.6px] tracking-[-0.4px] text-[#000123] opacity-70">
                        {card.description}
                      </p>
                    </CardContent>
                    <CardFooter className="p-0">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 [font-family:'Denim-TRIAL-Regular',Helvetica] text-xl font-normal leading-[25.6px] tracking-[-0.4px] text-[#000123] opacity-70 underline underline-offset-0"
                      >
                        Learn more
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
