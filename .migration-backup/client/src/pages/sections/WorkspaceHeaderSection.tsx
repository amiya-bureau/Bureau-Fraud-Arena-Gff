import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  { label: "Products", dropdown: true },
  { label: "Solutions", dropdown: true },
  { label: "Industries", dropdown: true },
  { label: "Resources", dropdown: false },
  { label: "Company", dropdown: false },
];

const processSteps = [
  {
    title: "Transaction initiated",
    description: "Incoming payment, account activity",
    icon: "/figmaAssets/group-48099741.png",
  },
  {
    title: "Analyze network signals",
    description: "Identity, device & intelligence",
    icon: "/figmaAssets/group-48099744.png",
  },
  {
    title: "Calculate fraud risk",
    description: "Real-time network-level assessment",
    icon: "/figmaAssets/group-48099743.png",
  },
  {
    title: "Risk ≥ 20 → Trigger investigation",
    description: "Potential fraud detected",
    icon: "/figmaAssets/group-48099742.png",
  },
];

const BureauMark = () => (
  <span
    className="grid h-[21px] w-[13px] grid-cols-3 grid-rows-5"
    aria-hidden="true"
  >
    <span className="col-start-1 row-start-1 h-1 w-1 bg-white" />
    <span className="col-start-1 row-start-2 h-1 w-1 bg-white" />
    <span className="col-start-1 row-start-4 h-1 w-1 bg-white" />
    <span className="col-start-1 row-start-5 h-1 w-1 bg-white" />
    <span className="col-start-3 row-start-3 h-1 w-1 bg-white" />
  </span>
);

const ExploreButton = () => (
  <Button
    type="button"
    className="h-auto rounded-none bg-[#000123] px-[19px] py-[13px] text-[17px] tracking-[-0.34px] hover:bg-[#000123]"
  >
    <span className="[font-family:'Denim-TRIAL-Medium',Helvetica] font-medium">
      Explore Bureau
    </span>
    <BureauMark />
  </Button>
);

export const WorkspaceHeaderSection = (): JSX.Element => {
  return (
    <section className="relative isolate w-full overflow-hidden bg-white text-[#000123]">
      <img
        className="pointer-events-none absolute left-px top-0 -z-10 hidden h-[108.14%] w-[459px] max-w-none xl:block"
        alt=""
        src="/figmaAssets/group.png"
      />
      <img
        className="pointer-events-none absolute right-px top-px -z-10 hidden h-[921px] w-[459px] max-w-none xl:block"
        alt=""
        src="/figmaAssets/group-2147257041.png"
      />
      <header>
        <aside className="flex min-h-[43px] items-center justify-center bg-[#000123] px-5 text-center text-white">
          <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-base tracking-[-0.32px]">
            What fraud and risk teams in india must prepare for in 2026
          </p>
          <a
            className="ml-[30px] [font-family:'Geist_Mono',Helvetica] text-base underline"
            href="#bureau"
          >
            READ MORE
          </a>
        </aside>
        <nav
          className="mx-auto flex min-h-[85px] max-w-[1384px] items-center justify-between gap-8 border-b border-[#000123]/15 px-6 lg:px-0"
          aria-label="Main navigation"
        >
          <a href="#bureau" aria-label="Bureau home">
            <img
              className="h-[30px] w-[147px]"
              alt="Bureau"
              src="/figmaAssets/mask-group.png"
            />
          </a>
          <div className="hidden items-center gap-[51px] lg:flex">
            {navigationItems.map((item) =>
              item.dropdown ? (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto gap-[11px] rounded-none p-0 [font-family:'Denim-TRIAL-Regular',Helvetica] text-[17px] font-normal tracking-[-0.34px] text-[#000123] hover:bg-transparent hover:text-[#000123]"
                    >
                      {item.label}
                      <img
                        className="h-[19px] w-[19px]"
                        alt=""
                        src="/figmaAssets/caretdown.svg"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>{item.label}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <a
                  key={item.label}
                  className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[17px] tracking-[-0.34px]"
                  href="#bureau"
                >
                  {item.label}
                </a>
              ),
            )}
          </div>
          <div className="hidden lg:block">
            <ExploreButton />
          </div>
        </nav>
      </header>
      <main>
        <section
          id="bureau"
          className="mx-auto flex max-w-[930px] flex-col items-center px-6 pb-[78px] pt-[69px] text-center"
        >
          <div className="flex flex-col items-center gap-[26px]">
            <div className="relative flex h-[35px] items-center justify-center bg-[#ebf3fe] px-[11px] py-[7px]">
              <img
                className="absolute left-0 top-0 h-[35px] w-2"
                alt=""
                src="/figmaAssets/rectangle-34625199-1.svg"
              />
              <span className="[font-family:'Geist_Mono',Helvetica] text-[15px] font-medium text-[#4715ff]">
                BEYOND FRAUD DETECTION
              </span>
              <img
                className="absolute right-0 top-0 h-[35px] w-2"
                alt=""
                src="/figmaAssets/rectangle-34625198.svg"
              />
            </div>
            <h1 className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[48px] font-normal leading-[1.15] tracking-[-1.45px] sm:text-[60px] lg:text-[72px] lg:leading-[92px]">
              The Intelligence Behind Every Trusted Connection.
            </h1>
          </div>
          <p className="mt-[26px] max-w-[579px] [font-family:'Denim-TRIAL-Regular',Helvetica] text-[19px] leading-[30px] tracking-[-0.43px] opacity-60 lg:text-[21px]">
            Traditional fraud tools analyze individual accounts. Bureau reveals
            the network behind every attack
          </p>
          <div className="mt-[51px]">
            <ExploreButton />
          </div>
        </section>
        <section className="mx-auto grid max-w-[1384px] grid-cols-1 lg:grid-cols-[602px_minmax(0,1fr)]">
          <article className="min-h-[602px] bg-[#d1dff9] px-6 py-[72px] sm:px-[112px] sm:py-[112px]">
            <div className="relative mx-auto max-w-[378px]">
              <img
                className="pointer-events-none absolute left-1/2 top-20 z-0 h-[179px] w-0.5 -translate-x-1/2"
                alt=""
                src="/figmaAssets/line-311.svg"
              />
              <ol className="relative z-10 flex flex-col gap-[56px]">
                {processSteps.map((step, index) => (
                  <li key={step.title} className="relative">
                    {index > 0 && (
                      <span
                        className="absolute -top-[5px] left-1/2 h-[11px] w-[11px] -translate-x-1/2 bg-[#fd763a]"
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex min-h-20 items-center gap-[18px] bg-white p-[15px]">
                      <img
                        className="h-[50px] w-[50px] shrink-0"
                        alt=""
                        src={step.icon}
                      />
                      <div className="min-w-0">
                        <h2 className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-[18px] font-medium leading-tight">
                          {step.title}
                        </h2>
                        <p className="mt-[6px] [font-family:'Denim-TRIAL-Regular',Helvetica] text-[18px] leading-tight opacity-60">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </article>
          <article className="relative min-h-[376px] overflow-hidden bg-[#000123]">
            <img
              className="h-full min-h-[371px] w-full object-cover object-left"
              alt=""
              src="/figmaAssets/mask-group-1.png"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[65%] bg-[linear-gradient(270deg,rgba(0,2,36,0.4)_0%,rgba(0,2,36,0)_100%)]" />
          </article>
        </section>
      </main>
    </section>
  );
};
