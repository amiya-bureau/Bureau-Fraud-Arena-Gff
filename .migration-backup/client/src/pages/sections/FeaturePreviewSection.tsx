import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const workflowSteps = [
  {
    title: "Transaction initiated",
    description: "Incoming payment, account activity",
    icon: "/figmaAssets/group-48099741-1.png",
    position: "top-[100px]",
  },
  {
    title: "Analyze network signals",
    description: "Identity, device & intelligence",
    icon: "/figmaAssets/group-48099744-1.png",
    position: "top-[247px]",
  },
  {
    title: "Calculate fraud risk",
    description: "Real-time network-level assessment",
    icon: "/figmaAssets/group-48099743-1.png",
    position: "top-[395px]",
  },
  {
    title: "Risk ≥ 20 → Trigger investigation",
    description: "Potential fraud detected",
    icon: "/figmaAssets/group-48099742-1.png",
    position: "top-[542px]",
  },
];

const signalBenefits = [
  {
    title: "Unify every fraud signal",
    description:
      "Bring identity, device, behavioral, and transaction signals together in one platform for a complete view of risk.",
  },
  {
    title: "Hidden Risk Detection",
    description:
      "Uncover coordinated fraud patterns and hidden connections before they become costly threats to your business.",
  },
];

export const FeaturePreviewSection = (): JSX.Element => {
  const [selectedStep, setSelectedStep] = useState(0);

  return (
    <section className="w-full overflow-hidden bg-[#000123] px-6 py-20 lg:min-h-[1080px] lg:px-12 lg:py-[176px]">
      <div className="mx-auto flex max-w-[1484px] flex-col gap-16 lg:flex-row lg:items-end lg:gap-[120px]">
        <div className="relative mx-auto h-[min(728.78px,calc(100vw-48px))] w-full max-w-[727.59px] shrink-0 overflow-hidden bg-[#4715ff] lg:mx-0 lg:h-[728.78px]">
          <img
            className="absolute top-0 right-[-65px] h-[174.22%] w-[433px]"
            alt=""
            src="/figmaAssets/group-10.png"
          />
          <img
            className="absolute top-0 right-[229px] h-[174.22%] w-[306px]"
            alt=""
            src="/figmaAssets/group-11.png"
          />
          <img
            className="absolute top-[187px] left-[364px] h-[356px] w-0.5"
            alt=""
            src="/figmaAssets/line-311-1.svg"
          />
          {workflowSteps.map((step, index) => (
            <Card
              key={step.title}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedStep(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedStep(index);
                }
              }}
              className={`absolute left-40 ${step.position} w-[409px] cursor-pointer rounded-none border-0 bg-white p-0 shadow-none transition-none`}
            >
              <CardContent className="p-[16.02px]">
                <div className="flex w-full items-center gap-[19.22px]">
                  <img
                    className="h-[54.47px] w-[54.47px] shrink-0"
                    alt=""
                    src={step.icon}
                  />
                  <div className="flex min-w-0 flex-col items-start gap-[6.41px]">
                    <p className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-[19.2px] font-medium leading-normal text-[#000123]">
                      {step.title}
                    </p>
                    <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[19.2px] font-normal leading-normal text-[#000123] opacity-60">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {[0, 1, 2].map((index) => (
            <span
              key={`workflow-marker-${index}`}
              className={`absolute left-[359px] h-3 w-3 bg-[#fd763a] ${
                index === 0
                  ? "top-[242px]"
                  : index === 1
                    ? "top-[389px]"
                    : "top-[536px]"
              }`}
              aria-hidden="true"
            />
          ))}

          <span className="sr-only">
            Selected workflow step: {workflowSteps[selectedStep].title}
          </span>
        </div>
        <div className="flex w-full max-w-[636.58px] flex-col items-start gap-20 lg:gap-[150px]">
          <header className="flex w-full flex-col items-start gap-[22px]">
            <div className="relative h-[37.84px] w-[221.71px]">
              <div className="relative top-px left-px h-[38px] w-[222px]">
                <div className="absolute top-px left-px inline-flex h-[38px] items-center justify-center gap-[10.23px] bg-[#4715ff33] px-[12.27px] py-[8.18px]">
                  <span className="[font-family:'Geist_Mono',Helvetica] mt-[-0.78px] text-[16.4px] font-medium leading-normal text-white">
                    NETWORK INTELLIGENCE
                  </span>
                </div>
                <img
                  className="absolute -top-px left-[214px] h-[39px] w-[9px]"
                  alt=""
                  src="/figmaAssets/rectangle-34625198-6.svg"
                />
                <img
                  className="absolute -top-px -left-px h-[39px] w-[9px]"
                  alt=""
                  src="/figmaAssets/rectangle-34625199-9.svg"
                />
              </div>
            </div>
            <h2 className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-5xl font-normal leading-none tracking-[-1.44px] text-white lg:text-7xl">
              Every Decision Starts With Better Signals.
            </h2>
          </header>
          <div className="flex w-full flex-col items-start gap-12">
            <div className="flex w-full flex-col items-start gap-7">
              {signalBenefits.map((benefit, index) => (
                <div key={benefit.title} className="w-full">
                  {index > 0 && (
                    <img
                      className="mb-7 h-px w-full"
                      alt=""
                      src="/figmaAssets/line-312.svg"
                    />
                  )}
                  <article className="flex max-w-[589.14px] flex-col items-start gap-[18px]">
                    <h3 className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-2xl font-medium leading-normal tracking-[-0.48px] text-white">
                      {benefit.title}
                    </h3>
                    <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[22px] font-normal leading-[30.8px] tracking-[-0.44px] text-white opacity-70">
                      {benefit.description}
                    </p>
                  </article>
                </div>
              ))}
            </div>
            <Button
              variant="link"
              className="[font-family:'Denim-TRIAL-Medium',Helvetica] h-auto p-0 text-left text-2xl font-medium leading-normal tracking-[-0.48px] text-white underline underline-offset-2 hover:text-white"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
