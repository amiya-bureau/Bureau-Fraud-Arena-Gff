import { KeyboardEvent, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const customerStories = [
  {
    id: "leading-digital-bank",
    name: "Leading Digital Bank",
    quote:
      "\"The biggest shift wasn't catching more fraud it was finally seeing how isolated events were actually connected. Bureau gave us the visibility our previous tools simply couldn't.\"",
    person: "Amit Sharma",
    role: "Chief Risk Officer, Leading Digital Bank",
  },
];

const customerLogos = [
  { id: "leading-digital-bank", label: "Leading Digital Bank" },
  { id: "dropbox", label: "Dropbox" },
  { id: "logo-three", label: "Customer story three" },
  { id: "logo-four", label: "Customer story four" },
  { id: "logo-five", label: "Customer story five" },
];

export const SpeakerProfileSection = (): JSX.Element => {
  const [activeStoryId, setActiveStoryId] = useState(customerStories[0].id);
  const activeStory =
    customerStories.find((story) => story.id === activeStoryId) ??
    customerStories[0];

  const selectStory = (id: string) => {
    if (customerStories.some((story) => story.id === id)) {
      setActiveStoryId(id);
    }
  };

  const handleLogoKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectStory(id);
    }
  };

  const _renderLogo = (id: string) => {
    switch (id) {
      case "leading-digital-bank":
        return (
          <div className="relative h-[83.65px] w-full bg-[url('/figmaAssets/group-48099720.png')] bg-[100%_100%]">
            <div className="absolute left-[73px] top-[29px] h-[26px] w-[123px]">
              <img
                className="absolute left-[31.05%] top-[14.31%] h-[66.41%] w-[68.39%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-11.svg"
              />
              <img
                className="absolute left-[2.02%] top-0 h-[42.92%] w-[21.87%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-12.svg"
              />
              <img
                className="absolute left-[13.78%] top-[29.48%] h-[67.72%] w-[11.57%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-16.svg"
              />
              <img
                className="absolute left-0 top-[29.66%] h-[46.26%] w-[11.13%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-8.svg"
              />
              <img
                className="absolute left-0 top-[29.66%] h-[30.71%] w-[10.94%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-20.svg"
              />
            </div>
            <span className="absolute bottom-0 left-0 h-0.5 w-[110px] bg-[#706cff]" />
          </div>
        );
      case "dropbox":
        return (
          <div className="flex h-[83.65px] items-center justify-center">
            <img
              className="h-[27px] w-[140px]"
              alt="Dropbox logo"
              src="/figmaAssets/dropbox-logo-svg-150px.svg"
            />
          </div>
        );
      case "logo-three":
        return (
          <div className="flex h-[83.65px] items-center justify-center">
            <div className="h-7 w-[126px] bg-[url('/figmaAssets/group-3.png')] bg-[100%_100%]" />
          </div>
        );
      case "logo-four":
        return (
          <div className="flex h-[83.65px] items-center justify-center">
            <div className="relative h-[21px] w-[157px] overflow-hidden">
              <img
                className="absolute left-[59.87%] top-[18.07%] h-[63.85%] w-[9.17%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-18.svg"
              />
              <img
                className="absolute left-[90.88%] top-[17.68%] h-[63.85%] w-[9.12%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-14.svg"
              />
              <img
                className="absolute left-[46.08%] top-[17.68%] h-[63.85%] w-[11.84%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-17.svg"
              />
              <img
                className="absolute left-[26.14%] top-[16.15%] h-[67.31%] w-[8.92%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-13.svg"
              />
              <img
                className="absolute left-[36.44%] top-[17.68%] h-[63.85%] w-[7.89%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-22.svg"
              />
              <img
                className="absolute left-[80.68%] top-[16.15%] h-[67.31%] w-[8.92%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-13.svg"
              />
              <img
                className="absolute left-[70.17%] top-[17.68%] h-[65.77%] w-[9.07%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-9.svg"
              />
              <img
                className="absolute left-0 top-0 h-full w-[22.19%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/vector-19.svg"
              />
            </div>
          </div>
        );
      case "logo-five":
        return (
          <div className="flex h-[83.65px] items-center justify-center">
            <div className="relative h-7 w-[126px]">
              <img
                className="absolute left-0 top-0 h-full w-[99.55%]"
                alt=""
                aria-hidden="true"
                src="/figmaAssets/group-4.png"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="w-full bg-white px-6 py-24 sm:px-10 lg:px-16 xl:py-[216px]">
      <div className="mx-auto flex w-full max-w-[1409px] flex-col items-center gap-20">
        <header className="flex w-full max-w-[938px] flex-col items-center gap-[18px]">
          <div className="relative h-[38px] w-[178px]">
            <div className="inline-flex items-center justify-center gap-2.5 bg-[#ebf3fe] px-3 py-2">
              <span className="[font-family:'Geist_Mono',Helvetica] text-base font-medium leading-[normal] tracking-[0] text-[#4715ff]">
                CUSTOMER STORIES
              </span>
            </div>
            <img
              className="absolute left-0 top-0 h-[38px] w-2"
              alt=""
              aria-hidden="true"
              src="/figmaAssets/rectangle-34625199.svg"
            />
            <img
              className="absolute left-[170px] top-0 h-[38px] w-2"
              alt=""
              aria-hidden="true"
              src="/figmaAssets/rectangle-34625198-3.svg"
            />
          </div>
          <h2 className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-center text-4xl font-normal leading-[normal] tracking-[-1.2px] text-[#000123] sm:text-5xl lg:text-6xl">
            See why leading fintechs trust Bureau to stay ahead of fraud.
          </h2>
        </header>
        <div className="flex w-full flex-col gap-4">
          <nav
            className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
            aria-label="Customer stories"
          >
            {customerLogos.map((logo) => {
              const isActive = logo.id === activeStoryId;

              return (
                <Card
                  key={logo.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${logo.label} customer story`}
                  aria-pressed={isActive}
                  onClick={() => selectStory(logo.id)}
                  onKeyDown={(event) => handleLogoKeyDown(event, logo.id)}
                  className={`cursor-pointer rounded-none border border-[#d1dff9] shadow-none transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4715ff] focus-visible:ring-offset-2 ${
                    isActive ? "border-transparent" : "hover:opacity-80"
                  }`}
                >
                  <CardContent className="p-0"></CardContent>
                </Card>
              );
            })}
          </nav>
          <article className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,839px)_minmax(0,554px)]">
            <Card className="min-h-[489px] rounded-none border-0 bg-[#ebf3fe]/50 shadow-none">
              <CardContent className="flex h-full min-h-[489px] flex-col justify-between p-8 sm:p-[60px]">
                <blockquote className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[28px] font-normal leading-[1.28] tracking-[-0.68px] text-[#000123] sm:text-[34px] sm:leading-[43.5px]">
                  {activeStory.quote}
                </blockquote>
                <footer className="flex w-full max-w-[286px] flex-col gap-1.5">
                  <cite className="[font-family:'Denim-TRIAL-Medium',Helvetica] text-lg font-medium not-italic leading-[23px] tracking-[-0.36px] text-[#000123]">
                    {activeStory.person}
                  </cite>
                  <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-lg font-normal leading-[23px] tracking-[-0.36px] text-[#000123]">
                    {activeStory.role}
                  </p>
                </footer>
              </CardContent>
            </Card>
            <figure className="min-h-[320px] overflow-hidden lg:min-h-[489px]">
              <img
                className="h-full min-h-[320px] w-full object-cover lg:min-h-[489px]"
                alt="Ascii magic"
                src="/figmaAssets/ascii-magic-1-1.png"
              />
            </figure>
          </article>
        </div>
      </div>
    </section>
  );
};
