import { Card, CardContent } from "@/components/ui/card";

type Swatch = {
  color: string;
  label: string;
  labelColor: string;
  flex: number;
  title?: string;
  titleColor?: string;
};

type PaletteColumn = {
  swatches: Swatch[];
};

const paletteColumns: PaletteColumn[] = [
  {
    swatches: [
      {
        color: "#000123",
        label: "#000224",
        labelColor: "text-white",
        flex: 540,
        title: "Black Russian",
        titleColor: "text-white",
      },
      {
        color: "#010439",
        label: "#010439",
        labelColor: "text-white",
        flex: 167,
      },
      {
        color: "#111962",
        label: "#111962",
        labelColor: "text-white",
        flex: 167,
      },
      {
        color: "#203592",
        label: "#203592",
        labelColor: "text-white",
        flex: 166,
      },
    ],
  },
  {
    swatches: [
      {
        color: "#4715ff",
        label: "#4715FF",
        labelColor: "text-white",
        flex: 707,
        title: "Electric Violet",
        titleColor: "text-white",
      },
      {
        color: "#5244fc",
        label: "#5244FC",
        labelColor: "text-white",
        flex: 167,
      },
      {
        color: "#706cff",
        label: "#706CFF",
        labelColor: "text-white",
        flex: 166,
      },
    ],
  },
  {
    swatches: [
      {
        color: "#01ffff",
        label: "#01FFFF",
        labelColor: "text-[#000123]",
        flex: 707,
        title: "Cyan",
        titleColor: "text-[#4715ff]",
      },
      {
        color: "#a5fffd",
        label: "#A5FFFD",
        labelColor: "text-[#000123]",
        flex: 167,
      },
      {
        color: "#e1fffd",
        label: "#E1FFFD",
        labelColor: "text-[#000123]",
        flex: 166,
      },
    ],
  },
  {
    swatches: [
      {
        color: "#fe988c",
        label: "#FE988C",
        labelColor: "text-[#000123]",
        flex: 707,
      },
      {
        color: "#ffa8a1",
        label: "#FFA8A1",
        labelColor: "text-[#000123]",
        flex: 167,
      },
      {
        color: "#ffc4c0",
        label: "#FFC4C0",
        labelColor: "text-[#000123]",
        flex: 166,
      },
    ],
  },
  {
    swatches: [
      {
        color: "#fedec7",
        label: "#FEDEC7",
        labelColor: "text-[#000123]",
        flex: 707,
      },
      {
        color: "#ffe8da",
        label: "#FFE8DA",
        labelColor: "text-[#000123]",
        flex: 167,
      },
      {
        color: "#fcf1eb",
        label: "#FCF1EB",
        labelColor: "text-[#000123]",
        flex: 166,
      },
    ],
  },
  {
    swatches: [
      {
        color: "#d1dff9",
        label: "#D1DFF9",
        labelColor: "text-[#000123]",
        flex: 707,
      },
      {
        color: "#ebf3fe",
        label: "#EBF3FE",
        labelColor: "text-[#000123]",
        flex: 167,
      },
      {
        color: "#ffffff",
        label: "#FFFFFF",
        labelColor: "text-[#000123]",
        flex: 166,
      },
    ],
  },
  {
    swatches: [
      {
        color: "#fd763a",
        label: "#FD763A",
        labelColor: "text-[#000123]",
        flex: 333,
      },
      {
        color: "#b082ff",
        label: "#B082FF",
        labelColor: "text-white",
        flex: 333,
      },
      {
        color: "#c1f0aa",
        label: "#C1F0AA",
        labelColor: "text-[#000123]",
        flex: 333,
      },
    ],
  },
];

export const TemplateGallerySection = (): JSX.Element => {
  return (
    <section
      aria-label="Color palette"
      className="w-full overflow-hidden bg-white p-5 aspect-[2402/1080]"
    >
      <div
        className="grid h-full gap-5"
        style={{
          gridTemplateColumns: "1.8067fr 1.8067fr 1.8067fr 1fr 1fr 1fr 1fr",
        }}
      >
        {paletteColumns.map((column, columnIndex) => (
          <section
            key={`palette-column-${columnIndex}`}
            className="flex min-w-0 flex-col gap-0"
            aria-label={`Palette column ${columnIndex + 1}`}
          >
            {column.swatches.map((swatch, _swatchIndex) => (
              <article
                key={swatch.label}
                className="min-h-0"
                style={{ flex: `${swatch.flex} 1 0%` }}
              >
                <Card
                  className="h-full overflow-hidden rounded-none border-0 shadow-none"
                  style={{ backgroundColor: swatch.color }}
                >
                  <CardContent className="flex h-full flex-col justify-between p-5">
                    {swatch.title ? (
                      <h2
                        className={`[font-family:'Denim-TRIAL-Regular',Helvetica] text-5xl font-normal tracking-[-0.96px] leading-[normal] whitespace-nowrap ${swatch.titleColor}`}
                      >
                        {swatch.title}
                      </h2>
                    ) : (
                      <span aria-hidden="true" />
                    )}
                    <p
                      className={`opacity-60 [font-family:'Geist_Mono',Helvetica] text-base font-medium tracking-[0] leading-[normal] ${swatch.labelColor}`}
                    >
                      {swatch.label}
                    </p>
                  </CardContent>
                </Card>
              </article>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
};
