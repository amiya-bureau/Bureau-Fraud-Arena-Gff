import aiPortraitOne from '@/assets/ai-quiz/portrait-ai-1.png';
import realPortrait from '@/assets/ai-quiz/portrait-real.png';
import aiPortraitTwo from '@/assets/ai-quiz/portrait-ai-2.png';
import aiPortraitThree from '@/assets/ai-quiz/portrait-ai-3.webp';

/**
 * Visual stand-ins for the four-slot synthetic-media questions.
 *
 * Image 2 is the supplied real photograph. The remaining images are
 * intentionally used as AI-image placeholders until final quiz media arrives.
 */
export const AI_QUIZ_IMAGE_PLACEHOLDERS = [
  { src: aiPortraitOne, label: 'Image 1' },
  { src: realPortrait, label: 'Image 2' },
  { src: aiPortraitTwo, label: 'Image 3' },
  { src: aiPortraitThree, label: 'Image 4' },
] as const;

export function getAiQuizImage(index: number) {
  return AI_QUIZ_IMAGE_PLACEHOLDERS[index - 1] ?? AI_QUIZ_IMAGE_PLACEHOLDERS[0];
}