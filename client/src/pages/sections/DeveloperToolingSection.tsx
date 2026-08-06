import { ArrowUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const footerColumns = [
  {
    title: "Product",
    width: "w-[124.35px]",
    links: [
      "Fraud Prevention",
      "Identity Intelligence",
      "Device Intelligence",
      "Transaction Monitoring",
    ],
  },
  {
    title: "Solutions",
    width: "w-[102.12px]",
    links: ["Banking & Fintech", "Digital Payments", "Lending", "Marketplaces"],
  },
  {
    title: "Resources",
    width: "w-[124.35px]",
    links: ["Case Studies", "State of Fraud Report", "Blog", "Documentation"],
  },
  {
    title: "Company",
    width: "w-[75.76px]",
    links: ["About Bureau", "Careers", "Partners", "Contact"],
  },
  {
    title: "Legal",
    width: "w-[89.76px]",
    links: ["Privacy Policy", "Terms of Service", "Security", "Compliance"],
  },
];

export const DeveloperToolingSection = (): JSX.Element => {
  return (
    <section className="w-full bg-white px-4 py-12 sm:px-8 md:py-[134px]">
      <Card className="relative mx-auto min-h-[812px] w-full max-w-[1164px] overflow-hidden rounded-none border-0 bg-[#000123] shadow-none">
        <img
          className="pointer-events-none absolute right-0 top-0 h-auto w-[74.74%] max-w-[870px]"
          alt="Group"
          src="/figmaAssets/group-12.png"
        />
        <div className="pointer-events-none absolute left-[23.28%] top-0 h-[342px] w-[54.21%] bg-[linear-gradient(90deg,rgba(0,2,36,1)_0%,rgba(0,2,36,0)_100%)]" />
        <CardContent className="relative z-10 mx-auto flex w-full max-w-[1037px] flex-col gap-[92.24px] px-6 py-16 sm:px-10 md:px-0 md:py-[92px]">
          <div className="flex flex-col gap-[52.71px]">
            <header className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
              <h2 className="w-full max-w-[377.1px] [font-family:'Denim-TRIAL-Regular',Helvetica] text-[39.5px] font-normal leading-[normal] tracking-[-0.79px] text-white">
                Where Signals Become Intelligence.
              </h2>
              <div className="flex w-full max-w-[319.33px] flex-col items-start gap-7">
                <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[13.2px] font-normal leading-[18.4px] tracking-[-0.26px] text-white opacity-70">
                  Bring identity, device, behavioral, and transaction data
                  together to uncover what isolated fraud tools leave behind.
                </p>
                <div className="flex flex-wrap items-start gap-[9.88px]">
                  <Button
                    type="button"
                    className="h-auto rounded-none bg-white px-[10.92px] py-[9.71px] [font-family:'Denim-TRIAL-Medium',Helvetica] text-[12.1px] font-medium leading-[normal] tracking-[-0.24px] text-[#000123] hover:bg-white/90"
                  >
                    Book a Demo
                    <ArrowUpRightIcon className="ml-[7.28px] h-[12.14px] w-[12.14px] stroke-[1.5]" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto rounded-none border-[0.61px] border-[#ffffff99] bg-[#000123] px-[10.92px] py-[9.71px] [font-family:'Denim-TRIAL-Medium',Helvetica] text-[12.1px] font-medium leading-[normal] tracking-[-0.24px] text-white hover:bg-white/10 hover:text-white"
                  >
                    Explore more
                  </Button>
                </div>
              </div>
            </header>
            <nav
              aria-label="Footer navigation"
              className="flex flex-col gap-[39.53px]"
            >
              <img
                className="h-px w-full"
                alt="Line"
                src="/figmaAssets/line-316.svg"
              />
              <div className="overflow-x-auto pb-1">
                <div className="flex min-w-[1037px] items-start gap-[65.06px]">
                  {footerColumns.map((column, index) => (
                    <div
                      key={column.title}
                      className="flex items-start gap-[65.06px]"
                    >
                      {index > 0 && (
                        <img
                          className="h-[139.18px] w-px"
                          alt="Line"
                          src="/figmaAssets/line-319.svg"
                        />
                      )}

                      <div
                        className={`flex flex-col items-start gap-[23.06px] ${column.width}`}
                      >
                        <h3 className="w-full [font-family:'Denim-TRIAL-Medium',Helvetica] text-[13.2px] font-medium leading-[18.4px] tracking-[-0.26px] text-white">
                          {column.title}
                        </h3>
                        <div className="flex w-full flex-col items-start gap-[9.88px]">
                          {column.links.map((link) => (
                            <Button
                              key={link}
                              type="button"
                              variant="ghost"
                              className="h-auto w-full justify-start rounded-none p-0 [font-family:'Denim-TRIAL-Regular',Helvetica] text-[13.2px] font-normal leading-[18.4px] tracking-[-0.26px] text-white opacity-70 hover:bg-transparent hover:text-white hover:opacity-100"
                            >
                              {link}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </nav>
          </div>
          <footer className="flex flex-col gap-[19.76px]">
            <img
              className="h-auto w-full"
              alt="Group"
              src="/figmaAssets/group-2147257036.png"
            />
            <div className="flex flex-col gap-[19.76px]">
              <img
                className="h-px w-full"
                alt="Line"
                src="/figmaAssets/line-317-1.svg"
              />
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[13.2px] font-normal leading-[18.4px] tracking-[-0.26px] text-white opacity-40">
                  © 2026 Bureau. All Rights Reserved.
                </p>
                <p className="[font-family:'Denim-TRIAL-Regular',Helvetica] text-[13.2px] font-normal leading-[18.4px] tracking-[-0.26px] text-white opacity-40">
                  SOC 2 Type II Certified • ISO 27001 Certified
                </p>
              </div>
            </div>
          </footer>
        </CardContent>
      </Card>
    </section>
  );
};
