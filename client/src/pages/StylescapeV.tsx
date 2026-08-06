import { AnalyticsReportSection } from "./sections/AnalyticsReportSection";
import { ColorPaletteSection } from "./sections/ColorPaletteSection";
import { DarkInterfaceShowcaseSection } from "./sections/DarkInterfaceShowcaseSection";
import { DesignSystemPreviewSection } from "./sections/DesignSystemPreviewSection";
import { DeveloperToolingSection } from "./sections/DeveloperToolingSection";
import { DocumentationPreviewSection } from "./sections/DocumentationPreviewSection";
import { EditorialContentSection } from "./sections/EditorialContentSection";
import { FeaturePreviewSection } from "./sections/FeaturePreviewSection";
import { IllustrationShowcaseSection } from "./sections/IllustrationShowcaseSection";
import { ImagePreviewSection } from "./sections/ImagePreviewSection";
import { MediaGallerySection } from "./sections/MediaGallerySection";
import { MetricsOverviewSection } from "./sections/MetricsOverviewSection";
import { PresentationCoverSection } from "./sections/PresentationCoverSection";
import { ProductDemoSection } from "./sections/ProductDemoSection";
import { ProfileCardSection } from "./sections/ProfileCardSection";
import { ProjectPortfolioSection } from "./sections/ProjectPortfolioSection";
import { ResourceDirectorySection } from "./sections/ResourceDirectorySection";
import { SpeakerProfileSection } from "./sections/SpeakerProfileSection";
import { TeamProfileSection } from "./sections/TeamProfileSection";
import { TemplateGallerySection } from "./sections/TemplateGallerySection";
import { WebsiteShowcaseSection } from "./sections/WebsiteShowcaseSection";
import { WorkspaceHeaderSection } from "./sections/WorkspaceHeaderSection";

export const StylescapeV = (): JSX.Element => {
  return (
    <main className="w-full overflow-hidden bg-white">
      <section
        aria-label="Stylescape showcase"
        className="relative flex min-h-[1080px] w-max items-center"
      >
        <WorkspaceHeaderSection />
        <PresentationCoverSection />
        <SpeakerProfileSection />
        <ImagePreviewSection />
        <ProductDemoSection />
        <IllustrationShowcaseSection />
        <EditorialContentSection />
        <ProfileCardSection />
        <FeaturePreviewSection />
        <MetricsOverviewSection />
        <ProjectPortfolioSection />
        <TemplateGallerySection />
        <ColorPaletteSection />
        <DarkInterfaceShowcaseSection />
        <DeveloperToolingSection />
        <DocumentationPreviewSection />
        <WebsiteShowcaseSection />
        <AnalyticsReportSection />
        <DesignSystemPreviewSection />
        <MediaGallerySection />
        <ResourceDirectorySection />
        <TeamProfileSection />
      </section>
    </main>
  );
};
