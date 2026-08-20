export type ImageQuizOption = {
  id: string;
  src: string;
  label: string;
  isSpoofed: boolean;
};

type PoolImage = Omit<ImageQuizOption, "label">;

const fakeAssets = import.meta.glob(
  "../assets/image-quiz/fake/*.{jpg,jpeg,png,webp}",
  { eager: true, import: "default", query: "?url" },
) as Record<string, string>;

const realAssets = import.meta.glob(
  "../assets/image-quiz/real/*.{jpg,jpeg,png,webp}",
  { eager: true, import: "default", query: "?url" },
) as Record<string, string>;

function toPool(assets: Record<string, string>, isSpoofed: boolean): PoolImage[] {
  return Object.entries(assets)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, src]) => ({ id, src, isSpoofed }));
}

const FAKE_IMAGE_POOL = toPool(fakeAssets, true);
const REAL_IMAGE_POOL = toPool(realAssets, false);

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function takeRandom<T>(pool: readonly T[], count: number, label: string): T[] {
  if (pool.length < count) {
    throw new Error(`The ${label} image pool needs at least ${count} images.`);
  }
  return shuffle(pool).slice(0, count);
}

/**
 * Builds the four visual choices for a generic image round.
 *
 * A single-select round draws one spoofed/AI image and three real images.
 * A two-select round draws two spoofed/AI images and two real images.
 * Adding a file to either asset folder automatically expands its pool.
 */
export function drawImageQuizOptions(
  selectCount: number,
  excludedImageIds: ReadonlySet<string> = new Set(),
): ImageQuizOption[] {
  const totalChoices = 4;
  const realCount = totalChoices - selectCount;

  if (!Number.isInteger(selectCount) || selectCount < 1 || realCount < 1) {
    throw new Error("Image quiz rounds must select between one and three images.");
  }

  const availableFakeImages = FAKE_IMAGE_POOL.filter((image) => !excludedImageIds.has(image.id));
  const availableRealImages = REAL_IMAGE_POOL.filter((image) => !excludedImageIds.has(image.id));

  return shuffle([
    ...takeRandom(availableFakeImages, selectCount, "Fake"),
    ...takeRandom(availableRealImages, realCount, "Real"),
  ]).map((image, index) => ({
    ...image,
    label: `Image ${index + 1}`,
  }));
}