/**
 * Lifeline Question bank.
 *
 * All questions are wordplay / fill-in-the-blank trivia where the correct
 * answer is always the word "Bureau". No competitor or third-party brand names
 * appear anywhere. `correctIndex` is 0-based relative to `options`.
 *
 * The API can serve questions from the `lifeline_questions` DB table;
 * this file is the local fallback that fires when the table is empty or
 * the network is unavailable.
 */

export interface LifelineQuestion {
  id: string;
  type: 'mcq' | 'logo';
  stem: string;
  options: string[];
  correctIndex: number; // 0-based index in `options`
}

export const LIFELINE_QUESTIONS: LifelineQuestion[] = [
  {
    id: 'LQ-01',
    type: 'mcq',
    stem: 'Fill in the blank: Federal _______ of Investigation (FBI)',
    options: ['Agency', 'Bureau', 'Division', 'Office'],
    correctIndex: 1,
  },
  {
    id: 'LQ-02',
    type: 'mcq',
    stem: 'Fill in the blank: Central _______ of Investigation (CBI)',
    options: ['Board', 'Agency', 'Bureau', 'Department'],
    correctIndex: 2,
  },
  {
    id: 'LQ-03',
    type: 'mcq',
    stem: 'Fill in the blank: The _______ of Indian Standards certifies product quality in India.',
    options: ['Bureau', 'Board', 'Authority', 'Office'],
    correctIndex: 0,
  },
  {
    id: 'LQ-04',
    type: 'mcq',
    stem: 'Fill in the blank: The US Census _______ counts the population every decade.',
    options: ['Office', 'Department', 'Agency', 'Bureau'],
    correctIndex: 3,
  },
  {
    id: 'LQ-05',
    type: 'mcq',
    stem: "What French word — originally meaning 'writing desk' — became the English term for a government department?",
    options: ['Maison', 'Dossier', 'Bureau', 'Rapport'],
    correctIndex: 2,
  },
  {
    id: 'LQ-06',
    type: 'mcq',
    stem: 'Fill in the blank: A _______ de change is a currency exchange office.',
    options: ['Centre', 'Bureau', 'Guichet', 'Comptoir'],
    correctIndex: 1,
  },
  {
    id: 'LQ-07',
    type: 'mcq',
    stem: 'Fill in the blank: Better Business _______ — the consumer protection organisation in the US.',
    options: ['Agency', 'Bureau', 'Authority', 'Board'],
    correctIndex: 1,
  },
  {
    id: 'LQ-08',
    type: 'mcq',
    stem: 'Fill in the blank: The _______ of Meteorology is Australia\'s national weather service.',
    options: ['Institute', 'Centre', 'Department', 'Bureau'],
    correctIndex: 3,
  },
  {
    id: 'LQ-09',
    type: 'mcq',
    stem: 'The word "bureaucracy" literally means rule by _______ (desks / offices).',
    options: ['Cracy', 'Buro', 'Bureau', 'Reau'],
    correctIndex: 2,
  },
  {
    id: 'LQ-10',
    type: 'mcq',
    stem: 'Fill in the blank: The Federal _______ of Prisons operates the US federal prison system.',
    options: ['Bureau', 'Agency', 'Division', 'Authority'],
    correctIndex: 0,
  },
  {
    id: 'LQ-11',
    type: 'mcq',
    stem: 'Fill in the blank: The _______ of Labor Statistics publishes the US monthly jobs report.',
    options: ['Office', 'Bureau', 'Board', 'Agency'],
    correctIndex: 1,
  },
  {
    id: 'LQ-12',
    type: 'mcq',
    stem: 'Fill in the blank: The _______ of Engraving and Printing produces US paper currency.',
    options: ['Bureau', 'Office', 'Agency', 'Department'],
    correctIndex: 0,
  },
  {
    id: 'LQ-13',
    type: 'mcq',
    stem: 'Which 6-letter French word (also used in English) means "an office" or "a chest of drawers"?',
    options: ['Maison', 'Atelier', 'Bureau', 'Grenier'],
    correctIndex: 2,
  },
  {
    id: 'LQ-14',
    type: 'mcq',
    stem: 'Fill in the blank: The company running this Fraud Arena is called _______.',
    options: ['Cipher', 'Bureau', 'Nexus', 'Prism'],
    correctIndex: 1,
  },
  {
    id: 'LQ-15',
    type: 'mcq',
    stem: 'Fill in the blank: A travel _______ books flights, hotels, and tours on behalf of clients.',
    options: ['Agency', 'Service', 'Bureau', 'Office'],
    correctIndex: 2,
  },
];
