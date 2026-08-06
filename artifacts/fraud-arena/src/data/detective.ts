// Captured from Bureau's Investigation Sandbox. Points rescaled to 16/case so the game caps at 100.

export interface DetectiveCase {
  id: string; order: number; sector: string; title: string; clues: string[];
  brief: string; instruction: string; nodes: string[];
  clusters: Record<string, string[]>; edges: [string, string][];
  edgeLabels?: Record<string, string>; nodeLabels?: Record<string, string>;
  answer: string[]; explanation: string; hook: string;
}

export const PRIMER = {"title": "What is Community Detection?", "body": ["In any network of accounts, transactions, or connections, some groups of nodes are far more tightly linked to each other than they are to the rest of the graph. Those tight-knit groups are communities.", "Fraud rings behave the same way. The accounts running a scheme transact with each other far more than they do with random legitimate accounts. Community detection algorithms find these dense clusters automatically - nobody has to tell the system what a ring looks like in advance.", "Once the communities are visible, the patterns jump out: a single account bridging two clusters that should never touch, a hub with unusually high in-degree, a cluster that formed suspiciously fast. That is exactly what the cases below are testing you on."]};

export const CASES: DetectiveCase[] = [
  {
    id: "FD-01", order: 1, sector: "BANKING", title: "The Bridge",
    clues: ["Ring A cluster: six banking customers opened accounts within an 11-day window, same onboarding device fingerprint.", "Ring B cluster: different city, different device cluster, opened four months later.", "One login session in the last 30 days doesn't match either cluster's usual device pattern."],
    brief: "Two banking customer clusters, formed months apart, show no business reason to ever touch. But somewhere in this graph, exactly one account sits between them. Find the account bridging the two communities.",
    instruction: "Tap the account you believe is bridging the two rings, then submit.",
    nodes: ["AC-1001", "AC-1002", "AC-1003", "AC-1004", "AC-1005", "AC-1006", "AC-3390", "AC-2001", "AC-2002", "AC-2003", "AC-2004", "AC-2005", "AC-2006"],
    clusters: {"Ring A": ["AC-1001", "AC-1002", "AC-1003", "AC-1004", "AC-1005", "AC-1006"], "Ring B": ["AC-2001", "AC-2002", "AC-2003", "AC-2004", "AC-2005", "AC-2006"], "Bridge": ["AC-3390"]},
    edges: [["AC-1001", "AC-1006"], ["AC-1001", "AC-1004"], ["AC-1005", "AC-1006"], ["AC-1005", "AC-1004"], ["AC-1002", "AC-1004"], ["AC-1002", "AC-1003"], ["AC-1002", "AC-1005"], ["AC-2001", "AC-2006"], ["AC-2001", "AC-2002"], ["AC-2002", "AC-2005"], ["AC-2002", "AC-2003"], ["AC-2003", "AC-2004"], ["AC-2005", "AC-2006"], ["AC-3390", "AC-1006"], ["AC-3390", "AC-2001"]],
    answer: ["AC-3390"],
    explanation: "AC-3390 is the only account with edges into both Ring A and Ring B. A single node linking two otherwise isolated communities is the signature of a bridge account - usually a mule or cut-out used to move value across rings built to look unrelated. Bureau's graph layer flags this as a cross-community edge the moment it forms.",
    hook: "Network intelligence - cross-community edge detection",
  },
  {
    id: "FD-02", order: 2, sector: "LENDING · DEALER FRAUD", title: "The Dealer Ring",
    clues: ["Six loan applications were submitted by the same dealer this month, each for a different named borrower.", "None of the six borrowers has ever visited the branch or spoken with a loan officer.", "All six disbursements, once released, ended up at the same downstream account."],
    brief: "One auto dealer submitted six loan applications this month - six different customers, six different PANs, all approved. But every one of those loans has to be funded somewhere once it's disbursed. Find where the money actually lands.",
    instruction: "Tap the account you believe all six disbursements reconverge on, then submit.",
    nodes: ["DLR-4402", "LN-7101", "LN-7102", "LN-7103", "LN-7104", "LN-7105", "LN-7106", "AC-9931", "AC-9950", "LN-7201", "AC-9401", "LN-7202", "AC-9402"],
    clusters: {"Dealer": ["DLR-4402"], "Ring loans": ["LN-7101", "LN-7102", "LN-7103", "LN-7104", "LN-7105", "LN-7106"], "Fan-in": ["AC-9931"], "Control group": ["AC-9950", "LN-7201", "AC-9401", "LN-7202", "AC-9402"]},
    edges: [["DLR-4402", "LN-7101"], ["DLR-4402", "LN-7102"], ["DLR-4402", "LN-7103"], ["DLR-4402", "LN-7104"], ["DLR-4402", "LN-7105"], ["DLR-4402", "LN-7106"], ["LN-7101", "AC-9931"], ["LN-7102", "AC-9931"], ["LN-7103", "AC-9931"], ["LN-7104", "AC-9931"], ["LN-7105", "AC-9931"], ["LN-7106", "AC-9931"], ["LN-7201", "AC-9401"], ["LN-7202", "AC-9402"], ["AC-9950", "LN-7201"]],
    edgeLabels: {"LN-7101|AC-9931": "$285,000", "LN-7102|AC-9931": "$310,000", "LN-7103|AC-9931": "$265,000", "LN-7104|AC-9931": "$295,000", "LN-7105|AC-9931": "$275,000", "LN-7106|AC-9931": "$305,000", "LN-7201|AC-9401": "$220,000", "LN-7202|AC-9402": "$240,000"},
    nodeLabels: {"AC-9931": "$1,735,000"},
    answer: ["AC-9931"],
    explanation: "All six loans reference different borrowers, but every disbursement lands on AC-9931 - an account the dealer controls. This is a classic cash-funding scheme: a dealer manufactures paperwork for borrowers who don't really exist, or never see the money, and redirects every disbursement back to itself. The fan-in pattern gives it away long before any single loan file would.",
    hook: "Network intelligence - fan-in / beneficiary convergence",
  },
  {
    id: "FD-03", order: 3, sector: "LENDING · CIRCULAR GUARANTEE", title: "The Guarantor Chain",
    clues: ["Three loan files each list a different person as their guarantor.", "Two of those guarantor relationships lead to genuine third parties with no loans of their own.", "One guarantor relationship leads back to a borrower who already appears earlier in the same chain."],
    brief: "Three loan files each name a guarantor - standard practice. But trace the guarantees far enough on one of these chains, and the backing turns out to be circular: nobody outside the group is actually on the hook. Find the file that closes the circle.",
    instruction: "Tap the loan file whose guarantee leads back into its own chain, then submit.",
    nodes: ["LN-8801", "LN-8802", "LN-8803", "LN-8804", "LN-8805", "GRT-001", "LN-8806", "GRT-002"],
    clusters: {"Circular chain": ["LN-8801", "LN-8802", "LN-8803"], "Clean chains": ["LN-8804", "LN-8805", "GRT-001", "LN-8806", "GRT-002"]},
    edges: [["LN-8801", "LN-8802"], ["LN-8802", "LN-8803"], ["LN-8803", "LN-8801"], ["LN-8804", "GRT-001"], ["LN-8805", "GRT-001"], ["LN-8806", "GRT-002"]],
    edgeLabels: {"LN-8801|LN-8802": "guarantees", "LN-8802|LN-8803": "guarantees", "LN-8803|LN-8801": "guarantees", "LN-8804|GRT-001": "guarantees", "LN-8805|GRT-001": "guarantees", "LN-8806|GRT-002": "guarantees"},
    answer: ["LN-8803"],
    explanation: "LN-8803 lists LN-8801 as its guarantor - the same borrower that opened this chain three hops earlier. A circular guarantee like this means there is no real external backing at all: three borrowers are just vouching for each other in a loop, each one's security being another loan that is just as unsecured. Bureau's graph flags this the moment a guarantee edge closes a cycle instead of terminating at a genuine third party.",
    hook: "Network intelligence - cycle detection on guarantee edges",
  },
  {
    id: "FD-04", order: 4, sector: "E-COMMERCE · ATO", title: "The Kingpin Device",
    clues: ["Seven customer accounts, all in good standing for over a year, logged in from a device none of them had ever used before.", "All seven logins happened within the same six-hour window.", "One high-value order was placed and shipped before any of the seven customers noticed anything unusual."],
    brief: "Seven loyal e-commerce accounts - different customers, different cities, years of normal order history - all logged in from the same unfamiliar device within hours of each other. Find the device that's really behind the wheel.",
    instruction: "Tap the device you believe is common to all seven accounts, then submit.",
    nodes: ["AC-6601", "AC-6602", "AC-6603", "AC-6604", "AC-6605", "AC-6606", "AC-6607", "DEV-88F2", "AC-6690", "AC-6611", "AC-6612", "DEV-3B10", "AC-6691"],
    clusters: {"Compromised accounts": ["AC-6601", "AC-6602", "AC-6603", "AC-6604", "AC-6605", "AC-6606", "AC-6607"], "Attacker device": ["DEV-88F2"], "Control group": ["AC-6690", "AC-6611", "AC-6612", "DEV-3B10", "AC-6691"]},
    edges: [["AC-6601", "DEV-88F2"], ["AC-6602", "DEV-88F2"], ["AC-6603", "DEV-88F2"], ["AC-6604", "DEV-88F2"], ["AC-6605", "DEV-88F2"], ["AC-6606", "DEV-88F2"], ["AC-6607", "DEV-88F2"], ["DEV-88F2", "AC-6690"], ["AC-6611", "DEV-3B10"], ["AC-6612", "DEV-3B10"], ["DEV-3B10", "AC-6691"]],
    edgeLabels: {"DEV-88F2|AC-6690": "$86,400", "DEV-3B10|AC-6691": "$1,200"},
    answer: ["DEV-88F2"],
    explanation: "Every one of the seven long-standing accounts authenticated from DEV-88F2 inside a six-hour window, and that same device pushed the high-value order out to AC-6690. A device with a sudden high in-degree across unrelated, previously clean accounts is account takeover at scale - the accounts are real, the history is real, and only the device is new. Bureau's device intelligence catches the shared fingerprint on login number two, not after the order ships.",
    hook: "Device intelligence - shared-device in-degree spike",
  },
  {
    id: "FD-05", order: 5, sector: "E-COMMERCE · SELF-DEALING", title: "The Fake Storefront",
    clues: ["Five 'different' buyers all purchased from the same seller within 48 hours, each leaving a five-star review.", "None of the five buyer accounts have ever ordered from any other seller.", "All five refunds eventually route to the same payout account the seller already uses."],
    brief: "Five buyer accounts, five different names, all bought from the same seller this week and all left glowing reviews. All five also requested refunds. Find where those refunds actually end up.",
    instruction: "Tap the account you believe all five refunds land on, then submit.",
    nodes: ["SLR-3081", "AC-8801", "AC-8802", "AC-8803", "AC-8804", "AC-8805", "AC-2210", "AC-8890", "AC-2298", "AC-8891", "AC-2299"],
    clusters: {"Seller": ["SLR-3081"], "Sock-puppet buyers": ["AC-8801", "AC-8802", "AC-8803", "AC-8804", "AC-8805"], "Payout account": ["AC-2210"], "Control group": ["AC-8890", "AC-2298", "AC-8891", "AC-2299"]},
    edges: [["AC-8801", "SLR-3081"], ["AC-8802", "SLR-3081"], ["AC-8803", "SLR-3081"], ["AC-8804", "SLR-3081"], ["AC-8805", "SLR-3081"], ["AC-8801", "AC-2210"], ["AC-8802", "AC-2210"], ["AC-8803", "AC-2210"], ["AC-8804", "AC-2210"], ["AC-8805", "AC-2210"], ["SLR-3081", "AC-2210"], ["AC-8890", "AC-2298"], ["AC-8891", "AC-2299"]],
    edgeLabels: {"AC-8801|AC-2210": "$1,850", "AC-8802|AC-2210": "$2,100", "AC-8803|AC-2210": "$1,650", "AC-8804|AC-2210": "$1,975", "AC-8805|AC-2210": "$1,725", "AC-8890|AC-2298": "$1,400", "AC-8891|AC-2299": "$1,900"},
    answer: ["AC-2210"],
    explanation: "All five buyers paid seller SLR-3081 - and every one of their refunds lands on AC-2210, the exact account the seller uses for its own payouts. This is a self-dealing ring: one seller generating its own sales, its own five-star reviews, and its own refunds, using accounts that only ever transact with this one seller. Real buyers touch many sellers over time; these five touch exactly one.",
    hook: "Network intelligence - closed transaction loop / self-dealing",
  },
];

export const BONUS = {"id": "FD-BONUS", "title": "The Center of Hollywood", "badge": "PURE FILM TRIVIA - NO FRAUD HERE", "brief": "Kevin Bacon once said he'd worked with everybody in Hollywood - or someone who has. Below are four legends from completely different eras, industries and continents. Guess how close each one really sits to him, then watch them snap into place.", "instruction": "Tap the ring on the web where you think they land.", "rings": [{"degree": 1, "label": "1 degree - worked together directly"}, {"degree": 2, "label": "2 degrees - one film apart"}, {"degree": 3, "label": "3 degrees - still pretty close"}], "questions": [{"n": 1, "subject": "Amitabh Bachchan", "answer": 2, "note": "Bachchan connects through his Hollywood crossover work in two hops - a reminder that the film graph is far denser than it looks from the outside. VERIFY against the Oracle of Bacon before the event."}, {"n": 2, "subject": "Charlie Chaplin", "answer": 3, "note": "Different era entirely, still only three hops. VERIFY before the event."}, {"n": 3, "subject": "Bruce Lee", "answer": 3, "note": "Different continent and industry, still three hops. VERIFY before the event."}, {"n": 4, "subject": "Marilyn Monroe", "answer": 3, "note": "Died six years before Bacon was born, still three hops via co-stars who outlived her. VERIFY before the event."}], "payoff": "Almost nobody in film is more than three hops from anybody else, which is the whole point. A fraud graph behaves the same way - which is why 'these two accounts have no connection' is almost never true, and why the interesting question is not whether a path exists but how short and how deliberate it is.", "hook": "Network intelligence - small-world graphs and path length", "caution": "The four degree values above are placeholders pending verification against the Oracle of Bacon (oracleofbacon.org). Confirm each one before the event - a wrong trivia answer at a booth full of film buffs is an avoidable embarrassment."};
