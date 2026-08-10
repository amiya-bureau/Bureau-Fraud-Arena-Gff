/**
 * Lifeline Question bank.
 *
 * All questions are Bureau-focused at very low difficulty — the right answer
 * is always Bureau or something directly verifiable at the booth. Correct
 * option positions are deliberately varied so players cannot pattern-match
 * on position. `correctIndex` is always 0-based relative to `options`.
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
    type: 'logo',
    stem: 'Look at the banner or kiosk screen in front of you. Which company is running this fraud game?',
    options: ['Razorpay', 'Bureau', 'Paytm', 'NPCI'],
    correctIndex: 1,
  },
  {
    id: 'LQ-02',
    type: 'mcq',
    stem: 'Whose fraud-detection platform powers every game at this booth?',
    options: ['Bureau', 'Experian', 'CIBIL', 'Equifax'],
    correctIndex: 0,
  },
  {
    id: 'LQ-03',
    type: 'mcq',
    stem: 'The Spoof the System challenge dares you to fool a deepfake detector. Whose detector is it?',
    options: ['Google Vision', 'Amazon Rekognition', 'Bureau', 'Microsoft Azure'],
    correctIndex: 2,
  },
  {
    id: 'LQ-04',
    type: 'mcq',
    stem: 'Bureau detects fraud rings by reading the links between identities, devices and accounts. What kind of company is Bureau?',
    options: ['A credit bureau', 'A payment gateway', 'A core banking system', 'A fraud and identity intelligence company'],
    correctIndex: 3,
  },
  {
    id: 'LQ-05',
    type: 'logo',
    stem: 'The app on this phone was built by one company. Which one?',
    options: ['Setu', 'Cashfree', 'Bureau', 'Juspay'],
    correctIndex: 2,
  },
  {
    id: 'LQ-06',
    type: 'mcq',
    stem: 'What is "Faceguard"?',
    options: ["A Bureau product for liveness and deepfake detection", 'A government ID verification scheme', 'A UPI fraud alert', 'A credit bureau product'],
    correctIndex: 0,
  },
  {
    id: 'LQ-07',
    type: 'mcq',
    stem: "The Fraud Detective game asks you to spot mule rings in a transaction graph. Who built that game?",
    options: ['Visa', 'Mastercard', 'SWIFT', 'Bureau'],
    correctIndex: 3,
  },
  {
    id: 'LQ-08',
    type: 'mcq',
    stem: "Bureau's platform combines four signal families into one decision. Which of these is NOT one of them?",
    options: ['Identity', 'Device', 'Credit score', 'Network'],
    correctIndex: 2,
  },
  {
    id: 'LQ-09',
    type: 'logo',
    stem: 'You are at a booth at Global Fintech Fest 2026. Which company is hosting this Arena?',
    options: ['Bureau', 'HDFC Bank', 'Visa', 'ICICI Lombard'],
    correctIndex: 0,
  },
  {
    id: 'LQ-10',
    type: 'mcq',
    stem: 'Bureau was founded to solve a specific problem. What is it?',
    options: ['Slow UPI transfers', 'High data roaming costs', 'Fraud, identity abuse and mule networks', 'Low credit penetration in rural India'],
    correctIndex: 2,
  },
  {
    id: 'LQ-11',
    type: 'mcq',
    stem: 'Which of these websites would you visit to learn more about the company running this booth?',
    options: ['cibil.com', 'bureau.id', 'rbi.org.in', 'npci.org.in'],
    correctIndex: 1,
  },
  {
    id: 'LQ-12',
    type: 'mcq',
    stem: 'Bureau reads links between entities to catch fraud rings. Which technology does this most closely resemble?',
    options: ['Document OCR', 'Credit scoring', 'Graph intelligence', 'SMS OTP'],
    correctIndex: 2,
  },
  {
    id: 'LQ-13',
    type: 'logo',
    stem: "One company's name appears on every screen in this game. What is it?",
    options: ['Perfios', 'FinBox', 'Bureau', 'Signzy'],
    correctIndex: 2,
  },
  {
    id: 'LQ-14',
    type: 'mcq',
    stem: 'If a mule ring passes every individual KYC check, what does Bureau do that a standard KYC vendor cannot?',
    options: ['Re-runs the KYC with stricter rules', 'Reads the network connections between all the entities', 'Flags the applicant on the credit bureau', 'Sends an OTP to the applicant'],
    correctIndex: 1,
  },
  {
    id: 'LQ-15',
    type: 'mcq',
    stem: 'Spot the Fraud, Spoof the System, Fraud Detective — all three games in this Arena are powered by:',
    options: ['Open-source ML models', 'Bureau', 'RBI APIs', 'Google Cloud Vision'],
    correctIndex: 1,
  },
];
