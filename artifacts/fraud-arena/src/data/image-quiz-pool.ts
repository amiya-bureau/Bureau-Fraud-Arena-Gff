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
 * Supplies randomized real/Fake media for one authored visual question.
 *
 * The question bank remains the scoring authority: every listed correct option
 * receives a random Fake asset, while every other option receives a random Real
 * asset. The calling game can shuffle the cards without breaking that mapping.
 */
export function drawImageQuizOptions(
  totalChoices: number,
  correctOptionIndices: readonly number[],
): ImageQuizOption[] {
  const fakeCount = correctOptionIndices.length;
  const realCount = totalChoices - fakeCount;

  if (
    !Number.isInteger(totalChoices) ||
    totalChoices < 2 ||
    fakeCount < 1 ||
    realCount < 1 ||
    new Set(correctOptionIndices).size !== fakeCount ||
    correctOptionIndices.some((index) => !Number.isInteger(index) || index < 1 || index > totalChoices)
  ) {
    throw new Error("Visual quiz rounds need valid real and Fake answer positions.");
  }

  const fakeImages = takeRandom(FAKE_IMAGE_POOL, fakeCount, "Fake");
  const realImages = takeRandom(REAL_IMAGE_POOL, realCount, "Real");
  let fakeIndex = 0;
  let realIndex = 0;
  const correct = new Set(correctOptionIndices);

  return Array.from({ length: totalChoices }, (_, index) => {
    const optionIndex = index + 1;
    const image = correct.has(optionIndex)
      ? fakeImages[fakeIndex++]
      : realImages[realIndex++];

    return {
      ...image,
      label: `Image ${optionIndex}`,
    };
  });
}