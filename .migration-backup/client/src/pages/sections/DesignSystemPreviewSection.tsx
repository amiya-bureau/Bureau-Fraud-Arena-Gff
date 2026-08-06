import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const articles = [
  {
    category: "NETWORK INTELLIGENCE",
    categoryColor: "text-[#fd763a]",
    title: "Why Connected Intelligence Outperforms Isolated Fraud Detection",
    image: "/figmaAssets/frame-2147257636.svg",
    imageAlt: "Frame",
    visual: "network",
  },
  {
    category: "FRAUD DETECTION",
    categoryColor: "text-[#4715ff]",
    title:
      "How Network Intelligence Reveals Hidden Fraud Connections in Real Time",
    image: "/figmaAssets/group-48099756.png",
    imageAlt: "Group",
    visual: "fraud",
  },
] as const;

export const DesignSystemPreviewSection = (): JSX.Element => {
  return (
    <section className="w-full bg-white px-6 py-20 sm:px-10 lg:px-[148px] lg:py-[147px]">
      <div className="mx-auto grid max-w-[1196px] grid-cols-1 gap-12 lg:grid-cols-2">
        {articles.map((article) => (
          <article key={article.category} className="min-w-0">
            <Card className="overflow-visible border-0 bg-transparent p-0 shadow-none">
              <CardContent className="p-0">
                {article.visual === "network" ? (
                  <img
                    className="block h-auto w-full"
                    alt={article.imageAlt}
                    src={article.image}
                  />
                ) : (
                  <div className="relative aspect-[574/442] w-full overflow-hidden bg-[#4715ff]">
                    <div className="absolute left-1/2 top-[-452px] h-[796px] w-[1438px] -translate-x-1/2 rounded-[719px/398px] bg-[#010439] blur-[143.55px]" />
                    <img
                      className="absolute inset-0 h-full w-full"
                      alt={article.imageAlt}
                      src={article.image}
                    />
                    <div className="absolute left-1/2 top-1/2 flex w-[115px] -translate-x-1/2 -translate-y-1/2 flex-col gap-[13.6px]">
                      <img
                        className="h-[89.4px] w-[89.41px]"
                        alt="Group"
                        src="/figmaAssets/group-48099711-2.png"
                      />
                      <span className="h-10 w-[112.73px] text-[15.5px] font-medium leading-[normal] tracking-[0] text-white [font-family:'Geist_Mono',Helvetica]">
                        NETWORK MATCH FOUND
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-12 flex max-w-[464px] flex-col items-start gap-12">
                  <header className="flex w-full flex-col items-start gap-[18px]">
                    <p
                      className={`w-full text-base font-medium leading-[normal] tracking-[0] [font-family:'Geist_Mono',Helvetica] ${article.categoryColor}`}
                    >
                      {article.category}
                    </p>
                    <h2 className="w-full text-[40px] font-normal leading-[51.2px] tracking-[-0.8px] text-[#000123] [font-family:'Denim-TRIAL-Regular',Helvetica]">
                      {article.title}
                    </h2>
                  </header>
                  <Button
                    asChild
                    variant="link"
                    className="h-auto p-0 text-left text-2xl font-normal leading-[30.7px] tracking-[-0.48px] text-[#000123] opacity-70 underline underline-offset-0 [font-family:'Denim-TRIAL-Regular',Helvetica]"
                  >
                    <a href="#read-more">Read more</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </article>
        ))}
      </div>
    </section>
  );
};
