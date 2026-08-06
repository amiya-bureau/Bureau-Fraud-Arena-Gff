// Captured from Bureau's Investigation Sandbox. Points rescaled to 16/case so the game caps at 100.
// Extended cases FD-06 through FD-52 appended below the original five.

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

  // ─── BRIDGE ACCOUNT (FD-06 to FD-13) ─────────────────────────────────────────

  // Case 6
  {
    id: "FD-06", order: 6, sector: "PAYMENTS", title: "The Payment Bridge",
    clues: [
      "Cluster Alpha: five payment wallets opened on the same day, verified with scanned government IDs that share a common printing batch.",
      "Cluster Beta: four wallets registered three weeks later in a different city, different phone carriers.",
      "One account shows login events from both cities within the same hour on three separate occasions.",
    ],
    brief: "Two wallet clusters with no legitimate business link keep exchanging value. Somewhere between them sits one account doing all the bridging. Find it.",
    instruction: "Tap the account you believe bridges the two wallet clusters, then submit.",
    nodes: ["WLT-1101", "WLT-1102", "WLT-1103", "WLT-1104", "WLT-1105", "WLT-2201", "WLT-2202", "WLT-2203", "WLT-2204", "WLT-5501"],
    clusters: { "Cluster Alpha": ["WLT-1101", "WLT-1102", "WLT-1103", "WLT-1104", "WLT-1105"], "Cluster Beta": ["WLT-2201", "WLT-2202", "WLT-2203", "WLT-2204"], "Bridge": ["WLT-5501"] },
    edges: [["WLT-1101", "WLT-1102"], ["WLT-1102", "WLT-1103"], ["WLT-1103", "WLT-1104"], ["WLT-1104", "WLT-1105"], ["WLT-1101", "WLT-1105"], ["WLT-2201", "WLT-2202"], ["WLT-2202", "WLT-2203"], ["WLT-2203", "WLT-2204"], ["WLT-2201", "WLT-2204"], ["WLT-5501", "WLT-1103"], ["WLT-5501", "WLT-2202"]],
    edgeLabels: { "WLT-5501|WLT-1103": "₹18,400", "WLT-5501|WLT-2202": "₹17,900" },
    nodeLabels: { "WLT-5501": "Bridge?" },
    answer: ["WLT-5501"],
    explanation: "WLT-5501 is the only node holding edges into both Cluster Alpha and Cluster Beta. The two clusters have no shared phone carrier, city, or KYC batch — yet value flows between them exclusively through this one account. A bridge node linking otherwise isolated communities is the hallmark of a cut-out account used to obscure the money trail.",
    hook: "Network intelligence - cross-community edge detection",
  },

  // Case 7
  {
    id: "FD-07", order: 7, sector: "UPI", title: "The UPI Middleman",
    clues: [
      "Six UPI IDs were created from the same café Wi-Fi hotspot over a 90-minute window.",
      "Four other UPI IDs were created two weeks later from a co-working space 40 km away.",
      "One VPA appears in the transaction history of both groups but has no retail or business registration.",
    ],
    brief: "Two groups of UPI accounts should have nothing in common, yet money keeps moving between them. Identify the single VPA acting as the covert conduit.",
    instruction: "Tap the UPI account you believe connects the two rings, then submit.",
    nodes: ["AC-3101", "AC-3102", "AC-3103", "AC-3104", "AC-3105", "AC-3106", "AC-4201", "AC-4202", "AC-4203", "AC-4204", "AC-7700"],
    clusters: { "Café Ring": ["AC-3101", "AC-3102", "AC-3103", "AC-3104", "AC-3105", "AC-3106"], "Co-work Ring": ["AC-4201", "AC-4202", "AC-4203", "AC-4204"], "Middleman": ["AC-7700"] },
    edges: [["AC-3101", "AC-3102"], ["AC-3102", "AC-3103"], ["AC-3103", "AC-3104"], ["AC-3104", "AC-3105"], ["AC-3105", "AC-3106"], ["AC-3101", "AC-3106"], ["AC-4201", "AC-4202"], ["AC-4202", "AC-4203"], ["AC-4203", "AC-4204"], ["AC-7700", "AC-3104"], ["AC-7700", "AC-4201"]],
    edgeLabels: { "AC-7700|AC-3104": "₹9,800", "AC-7700|AC-4201": "₹10,200" },
    answer: ["AC-7700"],
    explanation: "AC-7700 holds the only edges that span both the Café Ring and the Co-work Ring. Neither cluster shows any other inter-group transaction. A VPA with no legitimate purpose that bridges two separately-formed fraud communities is the classic bridge-mule pattern — its sole function is to pass value while keeping the two rings appearing unrelated in isolation.",
    hook: "Network intelligence - cross-community bridge mule",
  },

  // Case 8
  {
    id: "FD-08", order: 8, sector: "BANKING", title: "The Silent Connector",
    clues: [
      "Cluster North: seven savings accounts opened in the same branch on the same morning, referral chain traced to one introducer.",
      "Cluster South: five accounts in a different branch, different introducer, different district.",
      "A dormant account reactivated last month and immediately sent funds to one account in each cluster.",
    ],
    brief: "A dormant account just woke up and started transacting. Two otherwise isolated branch clusters now share a single point of contact. Find the newly-active bridge.",
    instruction: "Tap the account you believe is bridging the North and South clusters, then submit.",
    nodes: ["AC-5101", "AC-5102", "AC-5103", "AC-5104", "AC-5105", "AC-5106", "AC-5107", "AC-6201", "AC-6202", "AC-6203", "AC-6204", "AC-6205", "AC-9001"],
    clusters: { "Cluster North": ["AC-5101", "AC-5102", "AC-5103", "AC-5104", "AC-5105", "AC-5106", "AC-5107"], "Cluster South": ["AC-6201", "AC-6202", "AC-6203", "AC-6204", "AC-6205"], "Bridge": ["AC-9001"] },
    edges: [["AC-5101", "AC-5102"], ["AC-5102", "AC-5103"], ["AC-5103", "AC-5104"], ["AC-5104", "AC-5105"], ["AC-5105", "AC-5106"], ["AC-5106", "AC-5107"], ["AC-5101", "AC-5107"], ["AC-6201", "AC-6202"], ["AC-6202", "AC-6203"], ["AC-6203", "AC-6204"], ["AC-6204", "AC-6205"], ["AC-9001", "AC-5104"], ["AC-9001", "AC-6202"]],
    edgeLabels: { "AC-9001|AC-5104": "₹42,000", "AC-9001|AC-6202": "₹38,500" },
    nodeLabels: { "AC-9001": "Reactivated" },
    answer: ["AC-9001"],
    explanation: "AC-9001 sat dormant for over a year before reactivating and immediately placing funds into one node of each cluster. Dormant-to-active bridging is a deliberate obfuscation tactic: the account's long gap in activity makes it appear unrelated to either ring in historical analysis. The cross-community edges it creates expose it instantly in a live graph.",
    hook: "Network intelligence - dormant bridge account reactivation",
  },

  // Case 9
  {
    id: "FD-09", order: 9, sector: "WALLET", title: "The Cross-Border Relay",
    clues: [
      "Ring East: six mobile wallets share a common device manufacturer model and were all topped up via the same prepaid voucher batch.",
      "Ring West: five wallets in a different state, different voucher series.",
      "One wallet has IP geolocation records in both states and zero retail spend — only P2P transfers.",
    ],
    brief: "Two prepaid wallet clusters in different states have no logical reason to interact, yet money is crossing the divide. Identify the relay wallet with a foot in both worlds.",
    instruction: "Tap the wallet you believe is relaying funds between the two rings, then submit.",
    nodes: ["WLT-3301", "WLT-3302", "WLT-3303", "WLT-3304", "WLT-3305", "WLT-3306", "WLT-4401", "WLT-4402", "WLT-4403", "WLT-4404", "WLT-4405", "WLT-8800"],
    clusters: { "Ring East": ["WLT-3301", "WLT-3302", "WLT-3303", "WLT-3304", "WLT-3305", "WLT-3306"], "Ring West": ["WLT-4401", "WLT-4402", "WLT-4403", "WLT-4404", "WLT-4405"], "Relay": ["WLT-8800"] },
    edges: [["WLT-3301", "WLT-3302"], ["WLT-3302", "WLT-3303"], ["WLT-3303", "WLT-3304"], ["WLT-3304", "WLT-3305"], ["WLT-3305", "WLT-3306"], ["WLT-4401", "WLT-4402"], ["WLT-4402", "WLT-4403"], ["WLT-4403", "WLT-4404"], ["WLT-4404", "WLT-4405"], ["WLT-8800", "WLT-3303"], ["WLT-8800", "WLT-4403"]],
    edgeLabels: { "WLT-8800|WLT-3303": "₹15,000", "WLT-8800|WLT-4403": "₹14,600" },
    answer: ["WLT-8800"],
    explanation: "WLT-8800 is the sole node with edges in both Ring East and Ring West, and its transaction history contains only P2P transfers — no retail payments that would justify its activity. A wallet used purely for inter-account movement with dual-state IP presence is a textbook cross-community relay in a layering scheme.",
    hook: "Network intelligence - cross-community relay / layering",
  },

  // Case 10
  {
    id: "FD-10", order: 10, sector: "BNPL", title: "The BNPL Bridge",
    clues: [
      "Group A: four Buy-Now-Pay-Later accounts with identical employer declarations, all approved within the same credit underwriting batch.",
      "Group B: three BNPL accounts approved a month later with a different declared employer but the same device OS fingerprint as Group A.",
      "One BNPL account appears as a shared reference contact for both groups and also receives fund transfers from both.",
    ],
    brief: "Two BNPL borrower groups that appear unrelated to the underwriting system are actually feeding value to a common account. Find the account that bridges them.",
    instruction: "Tap the account you believe connects the two BNPL groups, then submit.",
    nodes: ["AC-7101", "AC-7102", "AC-7103", "AC-7104", "AC-7201", "AC-7202", "AC-7203", "AC-9500"],
    clusters: { "Group A": ["AC-7101", "AC-7102", "AC-7103", "AC-7104"], "Group B": ["AC-7201", "AC-7202", "AC-7203"], "Bridge": ["AC-9500"] },
    edges: [["AC-7101", "AC-7102"], ["AC-7102", "AC-7103"], ["AC-7103", "AC-7104"], ["AC-7201", "AC-7202"], ["AC-7202", "AC-7203"], ["AC-9500", "AC-7101"], ["AC-9500", "AC-7202"]],
    edgeLabels: { "AC-9500|AC-7101": "₹6,200", "AC-9500|AC-7202": "₹5,800" },
    nodeLabels: { "AC-9500": "Shared contact" },
    answer: ["AC-9500"],
    explanation: "AC-9500 is listed as a reference contact in the KYC files of both groups and also appears as a fund-transfer destination from both. Two clusters with different declared employers but the same device fingerprint, converging on a single contact-and-transfer node, indicates a coordinated BNPL fraud ring using a single beneficiary hidden behind forged employer documents.",
    hook: "Network intelligence - KYC reference graph bridge detection",
  },

  // Case 11
  {
    id: "FD-11", order: 11, sector: "INSURANCE", title: "The Claim Router",
    clues: [
      "Policy cluster A: five health insurance policies bought on the same aggregator platform, same agent code.",
      "Policy cluster B: six policies bought through a different platform, different agent, different insurer.",
      "One bank account number appears in the settlement details of both clusters — neither policyholder is named on it.",
    ],
    brief: "Claims from two completely separate insurance policy clusters are being settled to the same undisclosed bank account. Find that common settlement destination.",
    instruction: "Tap the bank account you believe is receiving settlements from both clusters, then submit.",
    nodes: ["AC-8101", "AC-8102", "AC-8103", "AC-8104", "AC-8105", "AC-8201", "AC-8202", "AC-8203", "AC-8204", "AC-8205", "AC-8206", "AC-6660"],
    clusters: { "Policy Cluster A": ["AC-8101", "AC-8102", "AC-8103", "AC-8104", "AC-8105"], "Policy Cluster B": ["AC-8201", "AC-8202", "AC-8203", "AC-8204", "AC-8205", "AC-8206"], "Settlement Hub": ["AC-6660"] },
    edges: [["AC-8101", "AC-8102"], ["AC-8102", "AC-8103"], ["AC-8103", "AC-8104"], ["AC-8104", "AC-8105"], ["AC-8201", "AC-8202"], ["AC-8202", "AC-8203"], ["AC-8203", "AC-8204"], ["AC-8204", "AC-8205"], ["AC-8205", "AC-8206"], ["AC-8101", "AC-6660"], ["AC-8202", "AC-6660"]],
    edgeLabels: { "AC-8101|AC-6660": "₹85,000", "AC-8202|AC-6660": "₹92,000" },
    nodeLabels: { "AC-6660": "Undisclosed payee" },
    answer: ["AC-6660"],
    explanation: "AC-6660 collects claim settlements from two entirely separate insurance clusters operating under different agents and platforms. A bank account unnamed on any policy that receives settlements from multiple disconnected policy groups is a strong indicator of ghost beneficiary fraud — where claims are systematically redirected by a colluding insider or compromised agent.",
    hook: "Network intelligence - ghost beneficiary bridge detection",
  },

  // Case 12
  {
    id: "FD-12", order: 12, sector: "NBFC", title: "The Shadow Lender",
    clues: [
      "Ring P: six NBFC borrowers all submitted income proofs from the same document-printing shop (metadata match).",
      "Ring Q: five borrowers, different NBFC branch, income proofs from a different shop.",
      "One account sits in neither ring's borrower list but received repayment credits from both rings last quarter.",
    ],
    brief: "Two rings of NBFC borrowers with fabricated income documents are both funnelling repayments to an account that doesn't appear in either ring's formal records. Find it.",
    instruction: "Tap the account you believe is the hidden beneficiary bridging both rings, then submit.",
    nodes: ["LOAN-1101", "LOAN-1102", "LOAN-1103", "LOAN-1104", "LOAN-1105", "LOAN-1106", "LOAN-2201", "LOAN-2202", "LOAN-2203", "LOAN-2204", "LOAN-2205", "AC-5500"],
    clusters: { "Ring P": ["LOAN-1101", "LOAN-1102", "LOAN-1103", "LOAN-1104", "LOAN-1105", "LOAN-1106"], "Ring Q": ["LOAN-2201", "LOAN-2202", "LOAN-2203", "LOAN-2204", "LOAN-2205"], "Shadow Lender": ["AC-5500"] },
    edges: [["LOAN-1101", "LOAN-1102"], ["LOAN-1102", "LOAN-1103"], ["LOAN-1103", "LOAN-1104"], ["LOAN-1104", "LOAN-1105"], ["LOAN-1105", "LOAN-1106"], ["LOAN-2201", "LOAN-2202"], ["LOAN-2202", "LOAN-2203"], ["LOAN-2203", "LOAN-2204"], ["LOAN-2204", "LOAN-2205"], ["LOAN-1103", "AC-5500"], ["LOAN-2204", "AC-5500"]],
    edgeLabels: { "LOAN-1103|AC-5500": "₹55,000", "LOAN-2204|AC-5500": "₹47,000" },
    answer: ["AC-5500"],
    explanation: "AC-5500 appears in the repayment flow of both Ring P and Ring Q but is unnamed in either ring's loan files. An account silently collecting repayments from two independent groups of borrowers with forged documents is the hallmark of a shadow-lender or fraudulent intermediary who arranged the loans and is now harvesting the repayments off-ledger.",
    hook: "Network intelligence - hidden intermediary bridge / repayment convergence",
  },

  // Case 13
  {
    id: "FD-13", order: 13, sector: "E-COMMERCE", title: "The Review Farm Bridge",
    clues: [
      "Farm A: five seller accounts that only ever receive five-star reviews from the same set of buyer accounts.",
      "Farm B: four sellers in a different category with their own dedicated review buyers.",
      "One account is listed as both a buyer in Farm A and a seller in Farm B — and routes all its income to the same payout.",
    ],
    brief: "Two separate review-farming clusters serving different product categories share one account that straddles both. Find the node that bridges the two farms.",
    instruction: "Tap the account you believe is acting as the bridge between the two review farms, then submit.",
    nodes: ["MER-5001", "MER-5002", "MER-5003", "MER-5004", "MER-5005", "AC-6101", "AC-6102", "AC-6103", "MER-6001", "MER-6002", "MER-6003", "MER-6004", "AC-7100"],
    clusters: { "Farm A": ["MER-5001", "MER-5002", "MER-5003", "MER-5004", "MER-5005", "AC-6101", "AC-6102", "AC-6103"], "Farm B": ["MER-6001", "MER-6002", "MER-6003", "MER-6004"], "Bridge": ["AC-7100"] },
    edges: [["AC-6101", "MER-5001"], ["AC-6102", "MER-5002"], ["AC-6103", "MER-5003"], ["AC-6101", "MER-5004"], ["AC-6102", "MER-5005"], ["MER-6001", "MER-6002"], ["MER-6002", "MER-6003"], ["MER-6003", "MER-6004"], ["AC-7100", "MER-5003"], ["AC-7100", "MER-6001"]],
    edgeLabels: { "AC-7100|MER-5003": "Review+purchase", "AC-7100|MER-6001": "Listed seller" },
    answer: ["AC-7100"],
    explanation: "AC-7100 appears as a buyer in Farm A's review network and as a seller in Farm B's cluster, making it the only account with edges in both communities. An account that simultaneously participates in two separate review farms across different categories is the operational glue of a coordinated fake-review scheme, enabling the operator to test tactics in one category and replicate them in another.",
    hook: "Network intelligence - dual-role bridge in review farm networks",
  },

  // ─── HUB ACCOUNT (FD-14 to FD-21) ────────────────────────────────────────────

  // Case 14
  {
    id: "FD-14", order: 14, sector: "PAYMENTS", title: "The Payout Funnel",
    clues: [
      "Nine payment accounts received inbound transfers from different merchant MDR refund queues over 48 hours.",
      "All nine accounts were verified using VPAs registered within the same 6-hour window.",
      "One downstream account received a consolidation transfer from all nine within two hours of each inbound credit.",
    ],
    brief: "Nine accounts collected merchant refunds then immediately forwarded everything to one place. Find the single hub receiving all nine transfers.",
    instruction: "Tap the hub account you believe is the common payout destination, then submit.",
    nodes: ["AC-2101", "AC-2102", "AC-2103", "AC-2104", "AC-2105", "AC-2106", "AC-2107", "AC-2108", "AC-2109", "AC-9901"],
    clusters: { "Collector Ring": ["AC-2101", "AC-2102", "AC-2103", "AC-2104", "AC-2105", "AC-2106", "AC-2107", "AC-2108", "AC-2109"], "Hub": ["AC-9901"] },
    edges: [["AC-2101", "AC-9901"], ["AC-2102", "AC-9901"], ["AC-2103", "AC-9901"], ["AC-2104", "AC-9901"], ["AC-2105", "AC-9901"], ["AC-2106", "AC-9901"], ["AC-2107", "AC-9901"], ["AC-2108", "AC-9901"], ["AC-2109", "AC-9901"]],
    edgeLabels: { "AC-2101|AC-9901": "₹12,000", "AC-2102|AC-9901": "₹11,500", "AC-2103|AC-9901": "₹13,200", "AC-2104|AC-9901": "₹10,800", "AC-2105|AC-9901": "₹12,600", "AC-2106|AC-9901": "₹11,900", "AC-2107|AC-9901": "₹10,400", "AC-2108|AC-9901": "₹13,800", "AC-2109|AC-9901": "₹12,100" },
    nodeLabels: { "AC-9901": "₹1,08,300" },
    answer: ["AC-9901"],
    explanation: "AC-9901 has an in-degree of nine — one edge from every collector in the ring — and no outward edges visible in this window. A single account aggregating rapid-sequence inbound transfers from many newly-registered accounts is the fan-in signature of a coordinated cash-out hub. Bureau's velocity engine would flag this pattern within minutes of the second transfer arriving.",
    hook: "Network intelligence - fan-in hub / cash-out aggregation",
  },

  // Case 15
  {
    id: "FD-15", order: 15, sector: "UPI", title: "The Star Receiver",
    clues: [
      "Eight UPI IDs sent peer-to-peer transfers in a 90-minute window, each under ₹10,000 to stay below reporting thresholds.",
      "The senders have no prior transaction history with each other — they appear to be strangers.",
      "All eight transfers resolved to the same UPI handle, which has no linked merchant or business registration.",
    ],
    brief: "Eight strangers all sent money to the same unregistered UPI handle in one 90-minute burst. That hub is your target.",
    instruction: "Tap the account you believe is the common UPI destination, then submit.",
    nodes: ["AC-3301", "AC-3302", "AC-3303", "AC-3304", "AC-3305", "AC-3306", "AC-3307", "AC-3308", "AC-8801"],
    clusters: { "Sender Cluster": ["AC-3301", "AC-3302", "AC-3303", "AC-3304", "AC-3305", "AC-3306", "AC-3307", "AC-3308"], "Hub": ["AC-8801"] },
    edges: [["AC-3301", "AC-8801"], ["AC-3302", "AC-8801"], ["AC-3303", "AC-8801"], ["AC-3304", "AC-8801"], ["AC-3305", "AC-8801"], ["AC-3306", "AC-8801"], ["AC-3307", "AC-8801"], ["AC-3308", "AC-8801"]],
    edgeLabels: { "AC-3301|AC-8801": "₹9,900", "AC-3302|AC-8801": "₹9,500", "AC-3303|AC-8801": "₹9,800", "AC-3304|AC-8801": "₹9,700", "AC-3305|AC-8801": "₹9,400", "AC-3306|AC-8801": "₹9,600", "AC-3307|AC-8801": "₹9,200", "AC-3308|AC-8801": "₹9,850" },
    nodeLabels: { "AC-8801": "Unregistered" },
    answer: ["AC-8801"],
    explanation: "AC-8801 receives eight sub-threshold transfers from mutually-unconnected senders within 90 minutes — a classic structuring pattern where individual amounts are kept below reporting limits but the aggregate far exceeds them. The star topology, with one high-in-degree node and no outward edges visible in the window, is the defining graph signature of a UPI cash-out hub.",
    hook: "Network intelligence - structuring / sub-threshold fan-in",
  },

  // Case 16
  {
    id: "FD-16", order: 16, sector: "BANKING", title: "The Salary Ghost",
    clues: [
      "Seven accounts each received a credit labeled 'SALARY' from a corporate account on the same date.",
      "The corporate account's registration address is a virtual office; no employees are on payroll with any EPFO record.",
      "All seven 'employees' withdrew the full salary amount within 30 minutes of receipt, then forwarded it onward.",
    ],
    brief: "A ghost company is paying 'salaries' to seven accounts that immediately forward the money. Find where all seven forward their funds.",
    instruction: "Tap the account you believe all seven salary-recipients forward money to, then submit.",
    nodes: ["AC-4401", "AC-4402", "AC-4403", "AC-4404", "AC-4405", "AC-4406", "AC-4407", "AC-1100", "AC-9090"],
    clusters: { "Ghost Payroll": ["AC-4401", "AC-4402", "AC-4403", "AC-4404", "AC-4405", "AC-4406", "AC-4407"], "Corporate Source": ["AC-1100"], "Hub": ["AC-9090"] },
    edges: [["AC-1100", "AC-4401"], ["AC-1100", "AC-4402"], ["AC-1100", "AC-4403"], ["AC-1100", "AC-4404"], ["AC-1100", "AC-4405"], ["AC-1100", "AC-4406"], ["AC-1100", "AC-4407"], ["AC-4401", "AC-9090"], ["AC-4402", "AC-9090"], ["AC-4403", "AC-9090"], ["AC-4404", "AC-9090"], ["AC-4405", "AC-9090"], ["AC-4406", "AC-9090"], ["AC-4407", "AC-9090"]],
    edgeLabels: { "AC-1100|AC-4401": "₹50,000", "AC-1100|AC-4402": "₹50,000", "AC-1100|AC-4403": "₹50,000", "AC-1100|AC-4404": "₹50,000", "AC-1100|AC-4405": "₹50,000", "AC-1100|AC-4406": "₹50,000", "AC-1100|AC-4407": "₹50,000" },
    nodeLabels: { "AC-9090": "True beneficiary", "AC-1100": "Ghost Corp" },
    answer: ["AC-9090"],
    explanation: "The ghost corporate account distributes identical salary credits to seven accounts, each of which immediately reconverges on AC-9090. The two-hop layering structure — source → mule layer → beneficiary — disguises a single large transfer as seven legitimate payroll payments. AC-9090's high in-degree at hop 2 is the giveaway.",
    hook: "Network intelligence - payroll layering / two-hop fan-in",
  },

  // Case 17
  {
    id: "FD-17", order: 17, sector: "LENDING", title: "The Loan Harvester",
    clues: [
      "Ten personal loan disbursements were made to different borrower accounts across three lenders in one week.",
      "All ten borrowers share the same phone number prefix block and the same pincode — statistically unusual.",
      "Within 72 hours of each disbursement, the full amount was forwarded to a single account not named in any loan file.",
    ],
    brief: "Ten loan disbursements across three lenders are all draining to one undisclosed account. Find the harvester.",
    instruction: "Tap the account you believe is collecting all ten loan disbursements, then submit.",
    nodes: ["LOAN-3101", "LOAN-3102", "LOAN-3103", "LOAN-3104", "LOAN-3105", "LOAN-3106", "LOAN-3107", "LOAN-3108", "LOAN-3109", "LOAN-3110", "AC-7777"],
    clusters: { "Borrower Accounts": ["LOAN-3101", "LOAN-3102", "LOAN-3103", "LOAN-3104", "LOAN-3105", "LOAN-3106", "LOAN-3107", "LOAN-3108", "LOAN-3109", "LOAN-3110"], "Harvester": ["AC-7777"] },
    edges: [["LOAN-3101", "AC-7777"], ["LOAN-3102", "AC-7777"], ["LOAN-3103", "AC-7777"], ["LOAN-3104", "AC-7777"], ["LOAN-3105", "AC-7777"], ["LOAN-3106", "AC-7777"], ["LOAN-3107", "AC-7777"], ["LOAN-3108", "AC-7777"], ["LOAN-3109", "AC-7777"], ["LOAN-3110", "AC-7777"]],
    edgeLabels: { "LOAN-3101|AC-7777": "₹1,00,000", "LOAN-3102|AC-7777": "₹1,00,000", "LOAN-3103|AC-7777": "₹1,00,000", "LOAN-3104|AC-7777": "₹1,00,000", "LOAN-3105|AC-7777": "₹1,00,000" },
    nodeLabels: { "AC-7777": "₹10,00,000" },
    answer: ["AC-7777"],
    explanation: "AC-7777 is the convergence point for all ten loan disbursements across three lenders — a total of ₹10,00,000 funnelled from accounts that share suspicious demographic clustering. This is an organised loan fraud where fraudsters use synthetic or stolen identities to draw down multiple loans, then drain every account to one controlled beneficiary before lenders can compare notes.",
    hook: "Network intelligence - cross-lender fan-in / loan stacking",
  },

  // Case 18
  {
    id: "FD-18", order: 18, sector: "WALLET", title: "The Wallet Drain",
    clues: [
      "Twelve prepaid wallet accounts each received top-ups from different prepaid card numbers over a single weekend.",
      "The prepaid cards were purchased with cash at different retail outlets across five cities.",
      "Within one hour of each top-up, the full balance was transferred out to the same destination wallet.",
    ],
    brief: "Twelve wallets were topped up with cash-purchased prepaid cards and immediately emptied to one place. Find the drain hub.",
    instruction: "Tap the wallet you believe is receiving all twelve balance transfers, then submit.",
    nodes: ["WLT-5501", "WLT-5502", "WLT-5503", "WLT-5504", "WLT-5505", "WLT-5506", "WLT-5507", "WLT-5508", "WLT-5509", "WLT-5510", "WLT-5511", "WLT-5512", "WLT-9000"],
    clusters: { "Top-up Wallets": ["WLT-5501", "WLT-5502", "WLT-5503", "WLT-5504", "WLT-5505", "WLT-5506", "WLT-5507", "WLT-5508", "WLT-5509", "WLT-5510", "WLT-5511", "WLT-5512"], "Drain Hub": ["WLT-9000"] },
    edges: [["WLT-5501", "WLT-9000"], ["WLT-5502", "WLT-9000"], ["WLT-5503", "WLT-9000"], ["WLT-5504", "WLT-9000"], ["WLT-5505", "WLT-9000"], ["WLT-5506", "WLT-9000"], ["WLT-5507", "WLT-9000"], ["WLT-5508", "WLT-9000"], ["WLT-5509", "WLT-9000"], ["WLT-5510", "WLT-9000"], ["WLT-5511", "WLT-9000"], ["WLT-5512", "WLT-9000"]],
    edgeLabels: { "WLT-5501|WLT-9000": "₹4,800", "WLT-5502|WLT-9000": "₹4,950", "WLT-5503|WLT-9000": "₹4,700", "WLT-5504|WLT-9000": "₹4,600" },
    nodeLabels: { "WLT-9000": "Drain Hub" },
    answer: ["WLT-9000"],
    explanation: "WLT-9000 receives twelve consecutive full-balance transfers from wallets that were each loaded from cash-purchased prepaid cards in different cities. The pattern — disperse cash loading across many cards and locations, then funnel everything to one wallet — is a classic smurfing-to-hub structure designed to defeat geographic and amount-based monitoring.",
    hook: "Network intelligence - smurfing / prepaid-card fan-in hub",
  },

  // Case 19
  {
    id: "FD-19", order: 19, sector: "E-COMMERCE", title: "The Return Sponge",
    clues: [
      "Eight e-commerce accounts filed return requests for high-value electronics within 24 hours of delivery.",
      "The returned items were all reshipped to the same warehouse address — not the original shipping addresses.",
      "All eight refunds were credited to one bank account rather than back to the original payment sources.",
    ],
    brief: "Eight customers requested returns on expensive electronics, and every refund landed at one account — not theirs. Find that refund sponge.",
    instruction: "Tap the account you believe absorbed all eight refunds, then submit.",
    nodes: ["AC-6601", "AC-6602", "AC-6603", "AC-6604", "AC-6605", "AC-6606", "AC-6607", "AC-6608", "AC-3330"],
    clusters: { "Return Accounts": ["AC-6601", "AC-6602", "AC-6603", "AC-6604", "AC-6605", "AC-6606", "AC-6607", "AC-6608"], "Refund Hub": ["AC-3330"] },
    edges: [["AC-6601", "AC-3330"], ["AC-6602", "AC-3330"], ["AC-6603", "AC-3330"], ["AC-6604", "AC-3330"], ["AC-6605", "AC-3330"], ["AC-6606", "AC-3330"], ["AC-6607", "AC-3330"], ["AC-6608", "AC-3330"]],
    edgeLabels: { "AC-6601|AC-3330": "₹28,000", "AC-6602|AC-3330": "₹31,500", "AC-6603|AC-3330": "₹29,000", "AC-6604|AC-3330": "₹33,000", "AC-6605|AC-3330": "₹27,500", "AC-6606|AC-3330": "₹30,000", "AC-6607|AC-3330": "₹32,000", "AC-6608|AC-3330": "₹29,500" },
    nodeLabels: { "AC-3330": "₹2,40,500" },
    answer: ["AC-3330"],
    explanation: "AC-3330 receives refunds from eight separate return accounts — accounts that each filed a return the same day as delivery, shipped items to the same warehouse, and had refunds routed away from the original payment source. This is a coordinated return-fraud ring: accounts are used once to generate a refund, which is siphoned to the ring controller via AC-3330.",
    hook: "Network intelligence - return fraud fan-in / refund hijacking",
  },

  // Case 20
  {
    id: "FD-20", order: 20, sector: "INSURANCE", title: "The Claim Aggregator",
    clues: [
      "Seven motor insurance claims were filed across three different insurance companies in one month, all for minor accidents.",
      "Each claim named a different vehicle owner, but the repair shop listed on every claim is the same single garage.",
      "All seven claim payouts were directed to one bank account held in the garage's name.",
    ],
    brief: "Seven insurance claims across three insurers are all paying out to one garage account. Find that aggregator.",
    instruction: "Tap the account you believe is collecting all seven claim payouts, then submit.",
    nodes: ["AC-7701", "AC-7702", "AC-7703", "AC-7704", "AC-7705", "AC-7706", "AC-7707", "MER-8800"],
    clusters: { "Claimant Accounts": ["AC-7701", "AC-7702", "AC-7703", "AC-7704", "AC-7705", "AC-7706", "AC-7707"], "Garage Hub": ["MER-8800"] },
    edges: [["AC-7701", "MER-8800"], ["AC-7702", "MER-8800"], ["AC-7703", "MER-8800"], ["AC-7704", "MER-8800"], ["AC-7705", "MER-8800"], ["AC-7706", "MER-8800"], ["AC-7707", "MER-8800"]],
    edgeLabels: { "AC-7701|MER-8800": "₹45,000", "AC-7702|MER-8800": "₹38,000", "AC-7703|MER-8800": "₹52,000", "AC-7704|MER-8800": "₹41,000", "AC-7705|MER-8800": "₹47,000", "AC-7706|MER-8800": "₹39,000", "AC-7707|MER-8800": "₹43,000" },
    nodeLabels: { "MER-8800": "₹3,05,000" },
    answer: ["MER-8800"],
    explanation: "MER-8800 appears on all seven claim files as the repair shop and receives every payout — a fan-in of seven claims from different insurers converging on one merchant account. A single repair garage cited across multiple insurers at unusually high claim frequency is the classic vehicle insurance fraud pattern: the garage inflates or fabricates repairs while routing the payout to itself.",
    hook: "Network intelligence - insurance claim fan-in / repair fraud hub",
  },

  // Case 21
  {
    id: "FD-21", order: 21, sector: "NBFC", title: "The DSA Funnel",
    clues: [
      "A direct selling agent (DSA) submitted nine loan applications in one fortnight, all for home renovation.",
      "Each application listed a different contractor as payee for the disbursed funds.",
      "All nine contractors are registered to the same GST address — a vacant plot.",
    ],
    brief: "Nine home-renovation loans disbursed to nine 'contractors' that all trace to one empty plot. Find the common payee account collecting all disbursements.",
    instruction: "Tap the account you believe all nine loan disbursements ultimately flow to, then submit.",
    nodes: ["LOAN-4101", "LOAN-4102", "LOAN-4103", "LOAN-4104", "LOAN-4105", "LOAN-4106", "LOAN-4107", "LOAN-4108", "LOAN-4109", "AC-2222"],
    clusters: { "Loan Accounts": ["LOAN-4101", "LOAN-4102", "LOAN-4103", "LOAN-4104", "LOAN-4105", "LOAN-4106", "LOAN-4107", "LOAN-4108", "LOAN-4109"], "DSA Funnel": ["AC-2222"] },
    edges: [["LOAN-4101", "AC-2222"], ["LOAN-4102", "AC-2222"], ["LOAN-4103", "AC-2222"], ["LOAN-4104", "AC-2222"], ["LOAN-4105", "AC-2222"], ["LOAN-4106", "AC-2222"], ["LOAN-4107", "AC-2222"], ["LOAN-4108", "AC-2222"], ["LOAN-4109", "AC-2222"]],
    edgeLabels: { "LOAN-4101|AC-2222": "₹2,00,000", "LOAN-4102|AC-2222": "₹2,00,000", "LOAN-4103|AC-2222": "₹2,00,000" },
    nodeLabels: { "AC-2222": "₹18,00,000", "LOAN-4101": "Contractor A" },
    answer: ["AC-2222"],
    explanation: "Nine supposedly distinct contractors all map to the same GST address and all forward disbursements to AC-2222 — the DSA's controlled account. The fan-in pattern across nine loans submitted by a single DSA, with contractor names as a thin disguise, is a textbook DSA-collusion fraud where the agent manufactures loan demand and pockets the proceeds through shell contractors.",
    hook: "Network intelligence - DSA collusion fan-in / shell contractor convergence",
  },

  // ─── MONEY MULE CHAIN (FD-22 to FD-28) ──────────────────────────────────────

  // Case 22
  {
    id: "FD-22", order: 22, sector: "BANKING", title: "The Three-Hop Chain",
    clues: [
      "A scam victim transferred ₹75,000 to an account that presented itself as a customer care number.",
      "The receiving account forwarded the full amount within 4 minutes — before any recall request could be processed.",
      "Two more hops followed in quick succession; each forwarding account belongs to a recruited mule.",
    ],
    brief: "Money entered a mule chain at the victim end. After three hops it exits to the fraudster's withdrawal point. Find the final account in the chain.",
    instruction: "Tap the exit node you believe is the end of the mule chain, then submit.",
    nodes: ["AC-1001", "AC-1002", "AC-1003", "AC-1004", "AC-1005"],
    clusters: { "Victim": ["AC-1001"], "Mule Chain": ["AC-1002", "AC-1003", "AC-1004"], "Exit": ["AC-1005"] },
    edges: [["AC-1001", "AC-1002"], ["AC-1002", "AC-1003"], ["AC-1003", "AC-1004"], ["AC-1004", "AC-1005"]],
    edgeLabels: { "AC-1001|AC-1002": "₹75,000", "AC-1002|AC-1003": "₹74,800", "AC-1003|AC-1004": "₹74,600", "AC-1004|AC-1005": "₹74,400" },
    nodeLabels: { "AC-1001": "Victim", "AC-1005": "Exit?" },
    answer: ["AC-1005"],
    explanation: "Each hop strips a small fee while passing the near-full amount forward. AC-1005 is the terminal node — it receives the final transfer and has no outward edge in this window. In a mule chain built for speed, the exit account is typically the only one actually controlled by the fraud organiser; the intermediate mules are recruited third parties unaware they are committing an offence.",
    hook: "Network intelligence - linear mule chain / exit node detection",
  },

  // Case 23
  {
    id: "FD-23", order: 23, sector: "UPI", title: "The UPI Relay Race",
    clues: [
      "A pig-butchering victim sent ₹3,20,000 to an 'investment platform' UPI handle.",
      "The platform handle forwarded funds through four intermediary UPI IDs in under 8 minutes.",
      "The last UPI ID in the chain converted the balance to crypto via a P2P exchange listing.",
    ],
    brief: "A UPI mule chain of four hops is obscuring the path from an investment scam victim to the crypto off-ramp. Find the crypto exit account.",
    instruction: "Tap the account you believe is the crypto off-ramp at the end of the UPI chain, then submit.",
    nodes: ["AC-5501", "AC-5502", "AC-5503", "AC-5504", "AC-5505", "AC-5506"],
    clusters: { "Victim": ["AC-5501"], "Relay Chain": ["AC-5502", "AC-5503", "AC-5504", "AC-5505"], "Crypto Exit": ["AC-5506"] },
    edges: [["AC-5501", "AC-5502"], ["AC-5502", "AC-5503"], ["AC-5503", "AC-5504"], ["AC-5504", "AC-5505"], ["AC-5505", "AC-5506"]],
    edgeLabels: { "AC-5501|AC-5502": "₹3,20,000", "AC-5502|AC-5503": "₹3,18,000", "AC-5503|AC-5504": "₹3,16,000", "AC-5504|AC-5505": "₹3,14,000", "AC-5505|AC-5506": "₹3,12,000" },
    nodeLabels: { "AC-5501": "Victim", "AC-5506": "P2P Exchange?" },
    answer: ["AC-5506"],
    explanation: "AC-5506 is the terminal node in a five-hop UPI relay. Each intermediate account held the funds for under two minutes — a velocity pattern that defeats T+1 recall mechanisms. The terminal account's linkage to a P2P crypto listing confirms it as the off-ramp: once funds convert to crypto, recovery becomes near-impossible, which is why identifying AC-5506 before settlement is critical.",
    hook: "Network intelligence - UPI relay / crypto off-ramp detection",
  },

  // Case 24
  {
    id: "FD-24", order: 24, sector: "WALLET", title: "The Wallet Hop",
    clues: [
      "A work-from-home scam collected ₹18,000 from a victim via a wallet top-up link.",
      "The funds hopped through three intermediate wallets, each registered to a different mobile number.",
      "The fourth wallet immediately cashed out to a prepaid card at a retail kiosk.",
    ],
    brief: "Four wallet hops separate the victim from the fraudster's cash-out. Find the wallet that turns digital money into physical cash.",
    instruction: "Tap the wallet you believe is the cash-out endpoint of this chain, then submit.",
    nodes: ["WLT-1001", "WLT-1002", "WLT-1003", "WLT-1004", "WLT-1005"],
    clusters: { "Victim Wallet": ["WLT-1001"], "Hop Chain": ["WLT-1002", "WLT-1003", "WLT-1004"], "Cash-out": ["WLT-1005"] },
    edges: [["WLT-1001", "WLT-1002"], ["WLT-1002", "WLT-1003"], ["WLT-1003", "WLT-1004"], ["WLT-1004", "WLT-1005"]],
    edgeLabels: { "WLT-1001|WLT-1002": "₹18,000", "WLT-1002|WLT-1003": "₹17,800", "WLT-1003|WLT-1004": "₹17,600", "WLT-1004|WLT-1005": "₹17,400" },
    nodeLabels: { "WLT-1005": "Kiosk cash-out" },
    answer: ["WLT-1005"],
    explanation: "WLT-1005 is the terminal wallet in a four-hop chain and the only one showing a kiosk redemption event. Wallet-to-kiosk is the physical cash-out step that breaks the digital audit trail. Each intermediate hop is designed to make tracing backward from the kiosk harder — identifying the chain exit early allows a freeze before the kiosk transaction completes.",
    hook: "Network intelligence - wallet hop chain / kiosk cash-out",
  },

  // Case 25
  {
    id: "FD-25", order: 25, sector: "PAYMENTS", title: "The Branching Mule",
    clues: [
      "A business email compromise victim wired ₹5,20,000 to what appeared to be a trusted supplier account.",
      "The receiving account split the amount across three mule accounts within 6 minutes.",
      "Each of the three mule accounts forwarded their share to the same final withdrawal account.",
    ],
    brief: "A BEC fraud splits proceeds across three mules who then reconverge on one exit. Find the exit account.",
    instruction: "Tap the account you believe all three mule branches converge on, then submit.",
    nodes: ["AC-1010", "AC-1011", "AC-1012", "AC-1013", "AC-1014", "AC-9999"],
    clusters: { "Victim": ["AC-1010"], "Splitter": ["AC-1011"], "Mule Layer": ["AC-1012", "AC-1013", "AC-1014"], "Exit": ["AC-9999"] },
    edges: [["AC-1010", "AC-1011"], ["AC-1011", "AC-1012"], ["AC-1011", "AC-1013"], ["AC-1011", "AC-1014"], ["AC-1012", "AC-9999"], ["AC-1013", "AC-9999"], ["AC-1014", "AC-9999"]],
    edgeLabels: { "AC-1010|AC-1011": "₹5,20,000", "AC-1011|AC-1012": "₹1,73,000", "AC-1011|AC-1013": "₹1,73,000", "AC-1011|AC-1014": "₹1,74,000", "AC-1012|AC-9999": "₹1,72,000", "AC-1013|AC-9999": "₹1,72,000", "AC-1014|AC-9999": "₹1,73,000" },
    nodeLabels: { "AC-9999": "Exit", "AC-1011": "Splitter" },
    answer: ["AC-9999"],
    explanation: "The fraud uses a split-and-reconverge topology: one splitter account fans out to three mules, creating three parallel audit trails, which then reconverge at AC-9999 for withdrawal. This pattern is designed to defeat linear chain-following tools — but graph analysis exposes the funnel structure at AC-9999 through its in-degree of three from previously unrelated accounts.",
    hook: "Network intelligence - split-reconverge mule topology",
  },

  // Case 26
  {
    id: "FD-26", order: 26, sector: "BNPL", title: "The BNPL Mule Exit",
    clues: [
      "Six BNPL credit limits were drawn down simultaneously across three lending apps using the same device.",
      "The proceeds were each forwarded through one intermediate account.",
      "All six intermediate accounts sent their balance to the same recipient — who has no credit file of their own.",
    ],
    brief: "Six BNPL drawdowns are laundered through one hop each before landing at a single exit. Find that exit account.",
    instruction: "Tap the exit account you believe received all six forwarded BNPL amounts, then submit.",
    nodes: ["AC-2001", "AC-2002", "AC-2003", "AC-2004", "AC-2005", "AC-2006", "AC-3001", "AC-3002", "AC-3003", "AC-3004", "AC-3005", "AC-3006", "AC-8000"],
    clusters: { "BNPL Accounts": ["AC-2001", "AC-2002", "AC-2003", "AC-2004", "AC-2005", "AC-2006"], "Mule Layer": ["AC-3001", "AC-3002", "AC-3003", "AC-3004", "AC-3005", "AC-3006"], "Exit": ["AC-8000"] },
    edges: [["AC-2001", "AC-3001"], ["AC-2002", "AC-3002"], ["AC-2003", "AC-3003"], ["AC-2004", "AC-3004"], ["AC-2005", "AC-3005"], ["AC-2006", "AC-3006"], ["AC-3001", "AC-8000"], ["AC-3002", "AC-8000"], ["AC-3003", "AC-8000"], ["AC-3004", "AC-8000"], ["AC-3005", "AC-8000"], ["AC-3006", "AC-8000"]],
    edgeLabels: { "AC-3001|AC-8000": "₹25,000", "AC-3002|AC-8000": "₹25,000", "AC-3003|AC-8000": "₹25,000", "AC-3004|AC-8000": "₹25,000", "AC-3005|AC-8000": "₹25,000", "AC-3006|AC-8000": "₹25,000" },
    nodeLabels: { "AC-8000": "₹1,50,000" },
    answer: ["AC-8000"],
    explanation: "AC-8000 sits at the end of a two-layer structure: six BNPL accounts each forwarding through a dedicated mule account before converging on the exit. The in-degree of six at AC-8000 from accounts that share a device fingerprint at the BNPL layer is the graph signature of coordinated credit-limit fraud with a shared beneficiary.",
    hook: "Network intelligence - BNPL stacking / two-hop fan-in exit",
  },

  // Case 27
  {
    id: "FD-27", order: 27, sector: "BANKING", title: "The Five-Hop Laundry",
    clues: [
      "Proceeds from a phishing attack (₹1,10,000) entered the banking system at Account A.",
      "Funds traversed five different accounts over 25 minutes, each hop in a different bank.",
      "The fifth account immediately initiated an RTGS to an overseas correspondent — the last step before the money leaves jurisdiction.",
    ],
    brief: "A five-bank mule chain ends with an RTGS to an overseas account. Identify the account that initiates the cross-border transfer.",
    instruction: "Tap the account you believe initiates the overseas RTGS, then submit.",
    nodes: ["AC-1111", "AC-2222", "AC-3333", "AC-4444", "AC-5555", "AC-6666"],
    clusters: { "Entry": ["AC-1111"], "Chain": ["AC-2222", "AC-3333", "AC-4444", "AC-5555"], "Cross-border Exit": ["AC-6666"] },
    edges: [["AC-1111", "AC-2222"], ["AC-2222", "AC-3333"], ["AC-3333", "AC-4444"], ["AC-4444", "AC-5555"], ["AC-5555", "AC-6666"]],
    edgeLabels: { "AC-1111|AC-2222": "₹1,10,000", "AC-2222|AC-3333": "₹1,09,500", "AC-3333|AC-4444": "₹1,09,000", "AC-4444|AC-5555": "₹1,08,500", "AC-5555|AC-6666": "₹1,08,000 RTGS" },
    nodeLabels: { "AC-6666": "RTGS→Overseas", "AC-1111": "Phishing entry" },
    answer: ["AC-6666"],
    explanation: "AC-6666 is the terminal node that initiates an RTGS wire to an overseas correspondent — the irreversible step that takes the funds out of domestic jurisdiction. The five intermediate hops across different banks are designed to exhaust the 30-minute RTGS recall window before any single bank can piece together the chain. Detecting AC-6666 in the chain before the RTGS settles is the only intervention point.",
    hook: "Network intelligence - cross-bank mule chain / RTGS exit node",
  },

  // Case 28
  {
    id: "FD-28", order: 28, sector: "UPI", title: "The Impersonation Exit",
    clues: [
      "A senior citizen received a call from someone claiming to be from the tax department and transferred ₹60,000.",
      "The receiving handle relayed the funds through two more UPI IDs under 5 minutes each.",
      "The third UPI ID withdrew the cash via a QR code at a petrol station.",
    ],
    brief: "A government-impersonation scam drains ₹60,000 through three hops before a QR cash-out. Find the QR withdrawal account.",
    instruction: "Tap the account you believe executed the QR code cash withdrawal, then submit.",
    nodes: ["AC-7001", "AC-7002", "AC-7003", "AC-7004"],
    clusters: { "Victim": ["AC-7001"], "Relay": ["AC-7002", "AC-7003"], "QR Exit": ["AC-7004"] },
    edges: [["AC-7001", "AC-7002"], ["AC-7002", "AC-7003"], ["AC-7003", "AC-7004"]],
    edgeLabels: { "AC-7001|AC-7002": "₹60,000", "AC-7002|AC-7003": "₹59,800", "AC-7003|AC-7004": "₹59,600" },
    nodeLabels: { "AC-7004": "QR cash-out", "AC-7001": "Victim - Senior" },
    answer: ["AC-7004"],
    explanation: "AC-7004 is the endpoint of a three-hop UPI chain initiated by a government-impersonation call. The QR code cash withdrawal at a petrol station converts the digital balance to physical cash with no recipient identity check — making AC-7004 the critical node to freeze. Identifying the exit account in a short hop-chain is a standard step for the cyber police 1930 helpline process.",
    hook: "Network intelligence - impersonation scam / QR cash-out exit",
  },

  // ─── SELF-DEALING RING (FD-29 to FD-34) ──────────────────────────────────────

  // Case 29
  {
    id: "FD-29", order: 29, sector: "E-COMMERCE", title: "The Rating Farm Payout",
    clues: [
      "Six buyer accounts each ordered from the same seller three times in two weeks, all with five-star ratings.",
      "None of the six buyer accounts have ever transacted with any seller other than this one.",
      "All purchase amounts were refunded in full; the refunds bypassed the original payment method and went to a separate bank account.",
    ],
    brief: "A seller is manufacturing its own ratings using buyer accounts that only exist to transact with it. Find the single payout account where all refunds land.",
    instruction: "Tap the payout account you believe collects all the self-dealing refunds, then submit.",
    nodes: ["SLR-1001", "AC-4401", "AC-4402", "AC-4403", "AC-4404", "AC-4405", "AC-4406", "AC-5500"],
    clusters: { "Seller": ["SLR-1001"], "Sock-puppet Buyers": ["AC-4401", "AC-4402", "AC-4403", "AC-4404", "AC-4405", "AC-4406"], "Payout": ["AC-5500"] },
    edges: [["AC-4401", "SLR-1001"], ["AC-4402", "SLR-1001"], ["AC-4403", "SLR-1001"], ["AC-4404", "SLR-1001"], ["AC-4405", "SLR-1001"], ["AC-4406", "SLR-1001"], ["AC-4401", "AC-5500"], ["AC-4402", "AC-5500"], ["AC-4403", "AC-5500"], ["AC-4404", "AC-5500"], ["AC-4405", "AC-5500"], ["AC-4406", "AC-5500"], ["SLR-1001", "AC-5500"]],
    edgeLabels: { "AC-4401|AC-5500": "₹3,600", "AC-4402|AC-5500": "₹4,100", "AC-4403|AC-5500": "₹3,800" },
    answer: ["AC-5500"],
    explanation: "AC-5500 sits at the centre of a closed loop: six buyers purchase from SLR-1001 and all refunds route to AC-5500 rather than back to the buyers. The buyers have zero cross-seller history. The seller, the buyers, and the payout account form a self-dealing ring — the seller is both seller and ultimate beneficiary of its own fake transactions, while the platform's rating algorithm is gamed upward.",
    hook: "Network intelligence - closed self-dealing loop / rating manipulation",
  },

  // Case 30
  {
    id: "FD-30", order: 30, sector: "E-COMMERCE", title: "The Phantom Auction",
    clues: [
      "Seven bidder accounts participated in an online auction for a high-value watch, driving the price up.",
      "Six of the seven bidders have no other auction history; the seventh is the eventual seller.",
      "The winning bid came from an eighth account, and payment was wired directly to the seller's main bank account — the same one linked to five of the losing bidders.",
    ],
    brief: "Six shill bidders inflated an auction, and the winning bidder's payment went straight to an account shared by the seller and the shills. Find that payout account.",
    instruction: "Tap the payout account you believe is shared by the seller and the shill network, then submit.",
    nodes: ["SLR-2001", "AC-3101", "AC-3102", "AC-3103", "AC-3104", "AC-3105", "AC-3106", "AC-3107", "AC-6600"],
    clusters: { "Seller": ["SLR-2001"], "Shill Bidders": ["AC-3101", "AC-3102", "AC-3103", "AC-3104", "AC-3105", "AC-3106"], "Winning Bidder": ["AC-3107"], "Payout": ["AC-6600"] },
    edges: [["AC-3101", "SLR-2001"], ["AC-3102", "SLR-2001"], ["AC-3103", "SLR-2001"], ["AC-3104", "SLR-2001"], ["AC-3105", "SLR-2001"], ["AC-3106", "SLR-2001"], ["AC-3107", "SLR-2001"], ["SLR-2001", "AC-6600"], ["AC-3101", "AC-6600"], ["AC-3102", "AC-6600"], ["AC-3103", "AC-6600"]],
    edgeLabels: { "AC-3107|SLR-2001": "₹4,80,000" },
    nodeLabels: { "AC-6600": "Shared bank" },
    answer: ["AC-6600"],
    explanation: "AC-6600 is linked to both the seller and the majority of shill bidders — a shared bank account that reveals the ring's true structure. Shill bidding rings usually operate with one controlled payout account shared across all identities. The identical bank account reference across seller and shill KYC files is the smoking gun that Bureau's identity linkage layer surfaces before any single auction report would.",
    hook: "Network intelligence - shill bidding / shared identity graph",
  },

  // Case 31
  {
    id: "FD-31", order: 31, sector: "UPI", title: "The Merchant Loop",
    clues: [
      "A merchant's UPI QR received payments from five accounts all registered on the same phone.",
      "The 'customers' left product reviews but the merchant has no physical address or delivery records.",
      "All net settlements from the merchant VPA flowed back to the same five accounts in rotation.",
    ],
    brief: "A merchant and five customer accounts are cycling money between themselves with no real commerce. Find the shared payout node.",
    instruction: "Tap the account you believe is the final payout destination in this merchant loop, then submit.",
    nodes: ["MER-3001", "AC-8101", "AC-8102", "AC-8103", "AC-8104", "AC-8105", "AC-9200"],
    clusters: { "Merchant": ["MER-3001"], "Loop Accounts": ["AC-8101", "AC-8102", "AC-8103", "AC-8104", "AC-8105"], "Payout": ["AC-9200"] },
    edges: [["AC-8101", "MER-3001"], ["AC-8102", "MER-3001"], ["AC-8103", "MER-3001"], ["AC-8104", "MER-3001"], ["AC-8105", "MER-3001"], ["MER-3001", "AC-8101"], ["MER-3001", "AC-8102"], ["MER-3001", "AC-8103"], ["MER-3001", "AC-9200"]],
    edgeLabels: { "MER-3001|AC-9200": "₹22,000 net" },
    nodeLabels: { "AC-9200": "Net payout" },
    answer: ["AC-9200"],
    explanation: "The merchant and the five customer accounts form a cyclic transaction pattern — money goes in as 'purchases' and comes back out as 'settlements' to the same phones. AC-9200 is where the net gain leaks out of the loop, revealing who profits from the artificial transaction volume. This is a merchant GMV inflation scheme, often used to hit performance thresholds for fee discounts or lending eligibility.",
    hook: "Network intelligence - cyclic merchant loop / GMV inflation",
  },

  // Case 32
  {
    id: "FD-32", order: 32, sector: "BANKING", title: "The Round-Trip Trade",
    clues: [
      "Two corporate accounts transferred ₹50 lakh to each other on the same day, in opposite directions.",
      "Both companies share a common director, but the director is named under two different spellings across filings.",
      "A third account received 'commission' transfers from both companies totalling ₹3 lakh.",
    ],
    brief: "Two related companies appear to trade with each other in a circular way, while a third account silently collects commissions. Find that commission collector.",
    instruction: "Tap the account you believe is collecting commissions from this circular trade, then submit.",
    nodes: ["AC-1200", "AC-1201", "AC-1202"],
    clusters: { "Company A": ["AC-1200"], "Company B": ["AC-1201"], "Commission Collector": ["AC-1202"] },
    edges: [["AC-1200", "AC-1201"], ["AC-1201", "AC-1200"], ["AC-1200", "AC-1202"], ["AC-1201", "AC-1202"]],
    edgeLabels: { "AC-1200|AC-1201": "₹50,00,000", "AC-1201|AC-1200": "₹50,00,000", "AC-1200|AC-1202": "₹1,50,000", "AC-1201|AC-1202": "₹1,50,000" },
    nodeLabels: { "AC-1202": "Commission?" },
    answer: ["AC-1202"],
    explanation: "AC-1200 and AC-1201 pass ₹50 lakh to each other simultaneously — a round-trip that creates the appearance of active trade while generating zero real economic value. AC-1202 skims ₹1.5 lakh from each party as 'commission', enriching the controller of both companies. Round-trip trades with a skimming node are used to inflate reported revenues for credit, subsidy, or valuation fraud.",
    hook: "Network intelligence - round-trip trade / commission skimming",
  },

  // Case 33
  {
    id: "FD-33", order: 33, sector: "INSURANCE", title: "The Garage Ring",
    clues: [
      "Four garages are registered as separate businesses, each submitting repair claims to different insurers.",
      "All four garages share the same bank account number for claim settlements — the discrepancy is buried in PDF attachments.",
      "A fifth account receives daily aggregated transfers from that shared settlement account.",
    ],
    brief: "Four garages look independent on paper but drain to the same account, which then forwards proceeds to one beneficiary. Find that final beneficiary.",
    instruction: "Tap the account you believe is the ultimate beneficiary of all four garage claim streams, then submit.",
    nodes: ["MER-4001", "MER-4002", "MER-4003", "MER-4004", "AC-5501", "AC-6601"],
    clusters: { "Garage Ring": ["MER-4001", "MER-4002", "MER-4003", "MER-4004"], "Shared Settlement": ["AC-5501"], "Beneficiary": ["AC-6601"] },
    edges: [["MER-4001", "AC-5501"], ["MER-4002", "AC-5501"], ["MER-4003", "AC-5501"], ["MER-4004", "AC-5501"], ["AC-5501", "AC-6601"]],
    edgeLabels: { "MER-4001|AC-5501": "₹95,000", "MER-4002|AC-5501": "₹88,000", "MER-4003|AC-5501": "₹1,02,000", "MER-4004|AC-5501": "₹91,000", "AC-5501|AC-6601": "₹3,76,000" },
    nodeLabels: { "AC-6601": "Ring controller" },
    answer: ["AC-6601"],
    explanation: "Four ostensibly separate garages all settle to AC-5501 (the shared bank account), which then forwards the combined ₹3,76,000 to AC-6601 daily. The garage-ring-to-beneficiary two-hop structure hides a single insurance fraud operator behind four business registrations. A shared bank account across multiple registered entities is detectable through beneficiary-account matching at claim submission time.",
    hook: "Network intelligence - multi-entity self-dealing / shared beneficiary",
  },

  // Case 34
  {
    id: "FD-34", order: 34, sector: "BNPL", title: "The Phantom Purchase Loop",
    clues: [
      "Five BNPL accounts made purchases from the same online merchant on the same day.",
      "The merchant has been live for only 10 days and has no logistics partner — all items were marked 'delivered' without tracking.",
      "Refunds for all five purchases routed to one wallet account, not back to the BNPL instruments.",
    ],
    brief: "Five BNPL accounts made ghost purchases from a 10-day-old merchant and had refunds redirected to one wallet. Find that wallet.",
    instruction: "Tap the wallet account you believe collected all five BNPL refunds, then submit.",
    nodes: ["AC-9101", "AC-9102", "AC-9103", "AC-9104", "AC-9105", "MER-7001", "WLT-6600"],
    clusters: { "BNPL Accounts": ["AC-9101", "AC-9102", "AC-9103", "AC-9104", "AC-9105"], "Phantom Merchant": ["MER-7001"], "Wallet Hub": ["WLT-6600"] },
    edges: [["AC-9101", "MER-7001"], ["AC-9102", "MER-7001"], ["AC-9103", "MER-7001"], ["AC-9104", "MER-7001"], ["AC-9105", "MER-7001"], ["AC-9101", "WLT-6600"], ["AC-9102", "WLT-6600"], ["AC-9103", "WLT-6600"], ["AC-9104", "WLT-6600"], ["AC-9105", "WLT-6600"]],
    edgeLabels: { "AC-9101|WLT-6600": "₹8,000", "AC-9102|WLT-6600": "₹8,500", "AC-9103|WLT-6600": "₹7,800", "AC-9104|WLT-6600": "₹9,000", "AC-9105|WLT-6600": "₹8,200" },
    nodeLabels: { "WLT-6600": "₹41,500" },
    answer: ["WLT-6600"],
    explanation: "WLT-6600 receives refunds from all five BNPL accounts, each of which transacted only with a 10-day-old merchant with no logistics footprint. The BNPL accounts, merchant, and wallet form a self-dealing triangle: the operator controls both the buyers and the merchant, draws down BNPL credit, and collects refunds in a wallet that bypasses the original instrument.",
    hook: "Network intelligence - BNPL phantom merchant / refund redirection",
  },

  // ─── SYNTHETIC IDENTITY CLUSTER (FD-35 to FD-40) ─────────────────────────────

  // Case 35
  {
    id: "FD-35", order: 35, sector: "BANKING", title: "The Synthetic Spoke Wheel",
    clues: [
      "Eight new savings accounts were opened in one week, each using a unique PAN but with nearly identical selfie metadata (same camera model, same GPS co-ordinates).",
      "All eight were referred-in by the same introducer account.",
      "The introducer account is not a bank employee — it has its own transaction history and linked phone number.",
    ],
    brief: "Eight synthetic accounts all trace back to a single introducer hub. Find that hub account.",
    instruction: "Tap the hub account you believe is the common introducer for all eight synthetic identities, then submit.",
    nodes: ["AC-1801", "AC-1802", "AC-1803", "AC-1804", "AC-1805", "AC-1806", "AC-1807", "AC-1808", "AC-5050"],
    clusters: { "Synthetic Accounts": ["AC-1801", "AC-1802", "AC-1803", "AC-1804", "AC-1805", "AC-1806", "AC-1807", "AC-1808"], "Introducer Hub": ["AC-5050"] },
    edges: [["AC-5050", "AC-1801"], ["AC-5050", "AC-1802"], ["AC-5050", "AC-1803"], ["AC-5050", "AC-1804"], ["AC-5050", "AC-1805"], ["AC-5050", "AC-1806"], ["AC-5050", "AC-1807"], ["AC-5050", "AC-1808"]],
    nodeLabels: { "AC-5050": "Introducer" },
    answer: ["AC-5050"],
    explanation: "AC-5050 is the star-center of the graph with an out-degree of eight — one referral edge to each synthetic account. Same GPS co-ordinates across eight selfie KYC images, despite different names and PANs, confirms the accounts were manufactured in one sitting. The introducer hub is the fraud organiser's control node; it both creates the accounts and benefits from any credit extended to them.",
    hook: "Network intelligence - synthetic identity cluster / introducer hub detection",
  },

  // Case 36
  {
    id: "FD-36", order: 36, sector: "LENDING", title: "The Phantom Borrower Hub",
    clues: [
      "Seven personal loan applications arrived from seven different individuals within 48 hours.",
      "All seven share the same alternate contact mobile number in the KYC form — one number answered during bureau verification and confirmed all seven applicants.",
      "All seven loans were disbursed; all seven entered NPA status in the same billing cycle.",
    ],
    brief: "Seven separate borrowers all point to one contact number — suggesting a single orchestrator. Find that hub node in the application graph.",
    instruction: "Tap the account you believe orchestrated all seven synthetic loan applications, then submit.",
    nodes: ["LOAN-5101", "LOAN-5102", "LOAN-5103", "LOAN-5104", "LOAN-5105", "LOAN-5106", "LOAN-5107", "AC-4040"],
    clusters: { "Loan Applications": ["LOAN-5101", "LOAN-5102", "LOAN-5103", "LOAN-5104", "LOAN-5105", "LOAN-5106", "LOAN-5107"], "Orchestrator": ["AC-4040"] },
    edges: [["AC-4040", "LOAN-5101"], ["AC-4040", "LOAN-5102"], ["AC-4040", "LOAN-5103"], ["AC-4040", "LOAN-5104"], ["AC-4040", "LOAN-5105"], ["AC-4040", "LOAN-5106"], ["AC-4040", "LOAN-5107"]],
    nodeLabels: { "AC-4040": "Shared contact" },
    answer: ["AC-4040"],
    explanation: "AC-4040 is the shared alternate-contact hub across all seven applications. When one phone number can confirm details for seven supposedly independent borrowers, it indicates the applications were manufactured by a single operator who controls the contact number. All seven accounts entering NPA simultaneously is the economic confirmation — the loans were never intended to be repaid.",
    hook: "Network intelligence - synthetic borrower hub / shared contact graph",
  },

  // Case 37
  {
    id: "FD-37", order: 37, sector: "WALLET", title: "The Identity Factory",
    clues: [
      "Ten new wallet accounts were created over three days, each passing a video KYC session.",
      "Face-match analysis shows all ten video streams share the same underlying face with minor makeup variations.",
      "Nine of the ten accounts immediately transferred their entire opening balance to the tenth.",
    ],
    brief: "Ten wallet accounts appear to be created from the same person using disguises. Find the account that acts as the collection hub for all nine transfers.",
    instruction: "Tap the hub wallet you believe collected transfers from all nine other synthetic accounts, then submit.",
    nodes: ["WLT-2201", "WLT-2202", "WLT-2203", "WLT-2204", "WLT-2205", "WLT-2206", "WLT-2207", "WLT-2208", "WLT-2209", "WLT-2210"],
    clusters: { "Synthetic Wallets": ["WLT-2201", "WLT-2202", "WLT-2203", "WLT-2204", "WLT-2205", "WLT-2206", "WLT-2207", "WLT-2208", "WLT-2209"], "Collection Hub": ["WLT-2210"] },
    edges: [["WLT-2201", "WLT-2210"], ["WLT-2202", "WLT-2210"], ["WLT-2203", "WLT-2210"], ["WLT-2204", "WLT-2210"], ["WLT-2205", "WLT-2210"], ["WLT-2206", "WLT-2210"], ["WLT-2207", "WLT-2210"], ["WLT-2208", "WLT-2210"], ["WLT-2209", "WLT-2210"]],
    edgeLabels: { "WLT-2201|WLT-2210": "₹2,000", "WLT-2202|WLT-2210": "₹2,000", "WLT-2203|WLT-2210": "₹2,000" },
    nodeLabels: { "WLT-2210": "Hub wallet" },
    answer: ["WLT-2210"],
    explanation: "WLT-2210 receives the opening balance from all nine sister wallets, giving it an in-degree of nine from accounts that are biometrically the same person. The 'identity factory' pattern — one person creating many wallets using disguises to multiply their access to regulated services — is exposed the moment the collection transfers fire: a genuine cluster of independent users would not simultaneously empty their wallets to a single peer.",
    hook: "Network intelligence - identity factory / biometric cluster hub",
  },

  // Case 38
  {
    id: "FD-38", order: 38, sector: "BNPL", title: "The Synthetic Credit Ring",
    clues: [
      "Six BNPL profiles were created using Aadhaar numbers that differ by only one digit from each other — sequential synthetic generation.",
      "All six profiles list the same employer name, but the employer's MCA filing shows zero employees.",
      "All six credit limits were drawn down in the same session fingerprint.",
    ],
    brief: "Six synthetically-generated BNPL profiles with sequential Aadhaar numbers all drew credit from the same device. Find the hub account that links them.",
    instruction: "Tap the hub account you believe ties all six synthetic BNPL profiles together, then submit.",
    nodes: ["AC-6001", "AC-6002", "AC-6003", "AC-6004", "AC-6005", "AC-6006", "DEV-9A1F"],
    clusters: { "Synthetic Profiles": ["AC-6001", "AC-6002", "AC-6003", "AC-6004", "AC-6005", "AC-6006"], "Device Hub": ["DEV-9A1F"] },
    edges: [["AC-6001", "DEV-9A1F"], ["AC-6002", "DEV-9A1F"], ["AC-6003", "DEV-9A1F"], ["AC-6004", "DEV-9A1F"], ["AC-6005", "DEV-9A1F"], ["AC-6006", "DEV-9A1F"]],
    nodeLabels: { "DEV-9A1F": "Shared device" },
    answer: ["DEV-9A1F"],
    explanation: "DEV-9A1F is the device fingerprint that appears at application time for all six BNPL profiles. Sequential Aadhaar numbers suggest algorithmic generation, and a single device drawing down six simultaneous credit lines confirms they are operated as a single automated fraud instance. The device node as a hub in the application graph is the first signal — it appears before any repayment data is available.",
    hook: "Device intelligence - synthetic identity cluster / device hub",
  },

  // Case 39
  {
    id: "FD-39", order: 39, sector: "NBFC", title: "The Cluster Maestro",
    clues: [
      "Nine NBFC loan files each list a different guarantor, but all nine guarantors share the same residential address.",
      "None of the nine guarantors appear in any other credit bureau record — they have no financial footprint.",
      "All nine loans were processed by the same field officer, who also has a personal account receiving cash deposits.",
    ],
    brief: "Nine loan guarantors with no credit footprint all live at the same address, and a field officer links them all. Find the field officer's account acting as the hub.",
    instruction: "Tap the account you believe is the field officer hub orchestrating this synthetic guarantor cluster, then submit.",
    nodes: ["LOAN-6101", "LOAN-6102", "LOAN-6103", "LOAN-6104", "LOAN-6105", "LOAN-6106", "LOAN-6107", "LOAN-6108", "LOAN-6109", "AC-3030"],
    clusters: { "Synthetic Loan Files": ["LOAN-6101", "LOAN-6102", "LOAN-6103", "LOAN-6104", "LOAN-6105", "LOAN-6106", "LOAN-6107", "LOAN-6108", "LOAN-6109"], "Field Officer": ["AC-3030"] },
    edges: [["AC-3030", "LOAN-6101"], ["AC-3030", "LOAN-6102"], ["AC-3030", "LOAN-6103"], ["AC-3030", "LOAN-6104"], ["AC-3030", "LOAN-6105"], ["AC-3030", "LOAN-6106"], ["AC-3030", "LOAN-6107"], ["AC-3030", "LOAN-6108"], ["AC-3030", "LOAN-6109"]],
    nodeLabels: { "AC-3030": "Field Officer" },
    answer: ["AC-3030"],
    explanation: "AC-3030 appears as the processing officer on all nine loans and as the recipient of unexplained cash deposits in the same period. Nine guarantors sharing one address with zero credit history, processed by a single officer, is an insider-enabled synthetic fraud: the officer manufactures the supporting documents and collects a kickback. The hub pattern in the processing graph pins the insider before any field audit is required.",
    hook: "Network intelligence - insider hub / synthetic guarantor cluster",
  },

  // Case 40
  {
    id: "FD-40", order: 40, sector: "BANKING", title: "The Deepfake KYC Hub",
    clues: [
      "Eleven new accounts passed video KYC over four days; AI analysis flags all eleven face scans as likely deepfakes.",
      "All eleven video sessions originated from the same IP address block within a single data centre.",
      "Ten of the eleven accounts sent their first transaction to the eleventh within 24 hours of account opening.",
    ],
    brief: "Eleven deepfake-KYC accounts all transact with one among them. Find the hub account that received transfers from the other ten.",
    instruction: "Tap the hub account you believe received first-transactions from the other ten deepfake accounts, then submit.",
    nodes: ["AC-7101", "AC-7102", "AC-7103", "AC-7104", "AC-7105", "AC-7106", "AC-7107", "AC-7108", "AC-7109", "AC-7110", "AC-7111"],
    clusters: { "Deepfake Accounts": ["AC-7101", "AC-7102", "AC-7103", "AC-7104", "AC-7105", "AC-7106", "AC-7107", "AC-7108", "AC-7109", "AC-7110"], "Hub": ["AC-7111"] },
    edges: [["AC-7101", "AC-7111"], ["AC-7102", "AC-7111"], ["AC-7103", "AC-7111"], ["AC-7104", "AC-7111"], ["AC-7105", "AC-7111"], ["AC-7106", "AC-7111"], ["AC-7107", "AC-7111"], ["AC-7108", "AC-7111"], ["AC-7109", "AC-7111"], ["AC-7110", "AC-7111"]],
    edgeLabels: { "AC-7101|AC-7111": "₹5,000", "AC-7102|AC-7111": "₹5,000", "AC-7103|AC-7111": "₹5,000" },
    nodeLabels: { "AC-7111": "Collection hub" },
    answer: ["AC-7111"],
    explanation: "AC-7111 receives the first outward transaction from each of the ten companion accounts — an in-degree of ten from accounts opened within the same four-day window, all passing deepfake KYC from the same data-centre IP range. A hub account that collects first-transaction credits from a cohort of synthetic accounts is the operator's collection node, designed to aggregate available balances before any KYC flag triggers a freeze.",
    hook: "Device intelligence - deepfake KYC cluster / collection hub",
  },

  // ─── ACCOUNT TAKEOVER HANDOFF (FD-41 to FD-45) ───────────────────────────────

  // Case 41
  {
    id: "FD-41", order: 41, sector: "BANKING", title: "The New Device Handoff",
    clues: [
      "A savings account with a five-year unblemished history suddenly logged in from a device never seen before.",
      "Within 30 minutes of that login, the account's registered mobile number was changed.",
      "Within the following hour, ₹95,000 was transferred out — the largest single transfer in the account's history.",
    ],
    brief: "A long-standing account was accessed from an unknown device, its phone number was changed, and funds were immediately moved. Find the new device that initiated the takeover.",
    instruction: "Tap the device you believe executed the account takeover, then submit.",
    nodes: ["AC-1500", "DEV-AA01", "DEV-BB99"],
    clusters: { "Legitimate Account": ["AC-1500"], "Historic Device": ["DEV-AA01"], "Attacker Device": ["DEV-BB99"] },
    edges: [["AC-1500", "DEV-AA01"], ["AC-1500", "DEV-BB99"]],
    edgeLabels: { "AC-1500|DEV-AA01": "5yr history", "AC-1500|DEV-BB99": "New login + ₹95,000" },
    nodeLabels: { "DEV-BB99": "Unknown device", "DEV-AA01": "Trusted device" },
    answer: ["DEV-BB99"],
    explanation: "DEV-BB99 is the unknown device that appears for the first time alongside an immediate phone-number change and an anomalous large transfer. A device-change event on a long-dormant or well-established account, followed instantly by credential change and fund movement, is the canonical account takeover signature — the attacker locks out the legitimate owner and drains the balance in a single session.",
    hook: "Device intelligence - new device ATO / credential change flag",
  },

  // Case 42
  {
    id: "FD-42", order: 42, sector: "E-COMMERCE", title: "The Shipping Address Pivot",
    clues: [
      "An e-commerce account with a two-year purchase history logged in from a new device and immediately changed its default shipping address.",
      "Five high-value orders were placed within 20 minutes of the address change.",
      "All five orders were for items that rank in the top 10 most-resold stolen goods: gaming consoles, smartphones, and tablets.",
    ],
    brief: "An ATO on an established shopping account changed the shipping address before ordering five high-value electronics. Find the new device behind the takeover.",
    instruction: "Tap the device you believe was used to take over this account, then submit.",
    nodes: ["AC-2600", "DEV-CC10", "DEV-DD50"],
    clusters: { "Victim Account": ["AC-2600"], "Legitimate Device": ["DEV-CC10"], "Attacker Device": ["DEV-DD50"] },
    edges: [["AC-2600", "DEV-CC10"], ["AC-2600", "DEV-DD50"]],
    edgeLabels: { "AC-2600|DEV-CC10": "2yr history", "AC-2600|DEV-DD50": "Address change + 5 orders" },
    nodeLabels: { "DEV-DD50": "New device - ATO?" },
    answer: ["DEV-DD50"],
    explanation: "DEV-DD50 is the first session that combined a new device fingerprint with an immediate shipping address change and a burst of high-value orders for resalable electronics. E-commerce account takeovers typically show this exact sequence: access → redirect delivery → exhaust ordering capacity. The two-year history on DEV-CC10 confirms the legitimate owner never behaved this way.",
    hook: "Device intelligence - ATO shipping redirect / new device burst order",
  },

  // Case 43
  {
    id: "FD-43", order: 43, sector: "WALLET", title: "The Wallet Hijack",
    clues: [
      "A wallet account used daily for small grocery payments suddenly authenticated from a new device.",
      "Within 5 minutes, the entire wallet balance was transferred to an unlinked external account.",
      "The registered mobile OTP was successfully validated — suggesting SIM-swap or OTP-interception.",
    ],
    brief: "A hijacked wallet drained its full balance to an external account within minutes of a new-device login. Find the receiving account.",
    instruction: "Tap the account you believe received the hijacked wallet balance, then submit.",
    nodes: ["WLT-3100", "DEV-EE20", "DEV-FF80", "AC-9800"],
    clusters: { "Victim Wallet": ["WLT-3100"], "Legitimate Device": ["DEV-EE20"], "Hijack Device": ["DEV-FF80"], "Drain Target": ["AC-9800"] },
    edges: [["WLT-3100", "DEV-EE20"], ["WLT-3100", "DEV-FF80"], ["WLT-3100", "AC-9800"]],
    edgeLabels: { "WLT-3100|DEV-EE20": "Daily groceries", "WLT-3100|DEV-FF80": "New login", "WLT-3100|AC-9800": "₹18,500 full drain" },
    nodeLabels: { "AC-9800": "Drain destination" },
    answer: ["AC-9800"],
    explanation: "AC-9800 receives the full wallet balance within 5 minutes of the new-device login — a drain-to-stranger pattern that confirms the wallet was not being used for a legitimate personal transfer. The combination of a new device fingerprint, successful OTP validation (indicating SIM-swap or interception), and an immediate full-balance transfer to an unlinked account is the SIM-swap ATO pattern.",
    hook: "Device intelligence - SIM-swap wallet drain / new device full balance exit",
  },

  // Case 44
  {
    id: "FD-44", order: 44, sector: "BANKING", title: "The Beneficiary Swap",
    clues: [
      "A corporate internet banking account with a stable list of 12 registered beneficiaries received a login from an unrecognised IP at 2:47 AM.",
      "Three new beneficiaries were added; one existing beneficiary's account number was edited.",
      "A high-value NEFT of ₹8,50,000 was initiated to one of the new beneficiaries 90 seconds after the edits.",
    ],
    brief: "A corporate banking account was accessed at 2:47 AM, its beneficiary list was altered, and a large NEFT was sent. Find the new beneficiary account that received the funds.",
    instruction: "Tap the beneficiary account you believe received the fraudulent NEFT transfer, then submit.",
    nodes: ["AC-3700", "AC-3701", "AC-3702", "AC-3703", "AC-3704"],
    clusters: { "Corporate Account": ["AC-3700"], "Legitimate Beneficiaries": ["AC-3701", "AC-3702"], "Fraudulent Beneficiaries": ["AC-3703", "AC-3704"] },
    edges: [["AC-3700", "AC-3701"], ["AC-3700", "AC-3702"], ["AC-3700", "AC-3703"], ["AC-3700", "AC-3704"]],
    edgeLabels: { "AC-3700|AC-3701": "Regular payroll", "AC-3700|AC-3702": "Vendor", "AC-3700|AC-3703": "₹8,50,000 NEFT", "AC-3700|AC-3704": "Added - not used" },
    nodeLabels: { "AC-3703": "Fraudulent payee", "AC-3700": "Corp account" },
    answer: ["AC-3703"],
    explanation: "AC-3703 is a newly-added beneficiary that received an ₹8,50,000 NEFT 90 seconds after being added — far too quickly for a legitimate payment preparation cycle. An after-hours login, batch beneficiary edit, and immediate high-value transfer to the freshest beneficiary is the business email compromise / corporate internet banking takeover pattern. The 90-second window between addition and transfer is the tell.",
    hook: "Device intelligence - corporate ATO / beneficiary manipulation",
  },

  // Case 45
  {
    id: "FD-45", order: 45, sector: "UPI", title: "The Cluster Device Intruder",
    clues: [
      "A community of six UPI accounts belonging to members of the same family has transacted normally for three years.",
      "One family member's account suddenly authenticated from a device that has never appeared in any of the six accounts' histories.",
      "That device immediately initiated transfers to all five other family accounts — behaviour consistent with testing mule readiness.",
    ],
    brief: "An unfamiliar device entered a trusted family UPI cluster and began probing other accounts. Find the intruder device.",
    instruction: "Tap the device you believe is the intruder in this trusted family cluster, then submit.",
    nodes: ["AC-4801", "AC-4802", "AC-4803", "AC-4804", "AC-4805", "AC-4806", "DEV-GG11", "DEV-HH22"],
    clusters: { "Family Cluster": ["AC-4801", "AC-4802", "AC-4803", "AC-4804", "AC-4805", "AC-4806"], "Trusted Devices": ["DEV-GG11"], "Intruder Device": ["DEV-HH22"] },
    edges: [["AC-4801", "DEV-GG11"], ["AC-4801", "DEV-HH22"], ["DEV-HH22", "AC-4802"], ["DEV-HH22", "AC-4803"], ["DEV-HH22", "AC-4804"], ["DEV-HH22", "AC-4805"], ["DEV-HH22", "AC-4806"]],
    edgeLabels: { "DEV-HH22|AC-4802": "₹1 test", "DEV-HH22|AC-4803": "₹1 test", "DEV-HH22|AC-4804": "₹1 test" },
    nodeLabels: { "DEV-HH22": "Intruder?", "DEV-GG11": "Family device" },
    answer: ["DEV-HH22"],
    explanation: "DEV-HH22 is unknown to the entire family cluster's three-year device history, yet it authenticated on one member's account and immediately sent ₹1 probe transfers to all five other family accounts. Sending ₹1 to multiple accounts in a cluster is a standard mule-readiness test — the attacker is verifying which accounts are active and ready for larger transfers. The intruder device is flagged by its out-degree and transaction velocity.",
    hook: "Device intelligence - cluster intruder device / mule probe detection",
  },

  // ─── BUST-OUT RING (FD-46 to FD-49) ──────────────────────────────────────────

  // Case 46
  {
    id: "FD-46", order: 46, sector: "LENDING", title: "The Coordinated Bust-Out",
    clues: [
      "Six credit card accounts, all customers of the same bank, maxed out their credit limits within the same 48-hour window.",
      "All six had maintained spotless payment histories for over 12 months before this event.",
      "None of the six have made any repayment since the bust-out; all six phones are now unreachable.",
    ],
    brief: "Six accounts with clean histories all maxed out simultaneously and went dark. Find the two accounts that show the highest coordinated withdrawal overlap — the bust-out leaders.",
    instruction: "Tap the two accounts you believe are the bust-out ring leaders, then submit.",
    nodes: ["AC-5601", "AC-5602", "AC-5603", "AC-5604", "AC-5605", "AC-5606"],
    clusters: { "Bust-out Ring": ["AC-5601", "AC-5602", "AC-5603", "AC-5604", "AC-5605", "AC-5606"] },
    edges: [["AC-5601", "AC-5602"], ["AC-5602", "AC-5603"], ["AC-5601", "AC-5604"], ["AC-5604", "AC-5605"], ["AC-5601", "AC-5606"], ["AC-5602", "AC-5606"]],
    edgeLabels: { "AC-5601|AC-5602": "Shared merchant txn", "AC-5601|AC-5604": "Shared device", "AC-5601|AC-5606": "Shared IP" },
    nodeLabels: { "AC-5601": "High centrality", "AC-5602": "High centrality" },
    answer: ["AC-5601", "AC-5602"],
    explanation: "AC-5601 and AC-5602 have the highest edge count within the ring — both share merchant transactions, device fingerprints, and IP addresses with multiple other ring members. In a bust-out ring, the leaders are the accounts with the most connections to the rest of the ring, since they are typically the organisers who recruited the other cardholders and coordinated the simultaneous drawdown.",
    hook: "Network intelligence - bust-out ring / centrality-based leader detection",
  },

  // Case 47
  {
    id: "FD-47", order: 47, sector: "BNPL", title: "The BNPL Bust-Out",
    clues: [
      "Four BNPL accounts were all created on the same day from the same mobile device.",
      "Each account built up six months of consistent small purchases to establish a repayment track record.",
      "In month seven, all four accounts simultaneously drew down their full credit lines and made no further repayments.",
    ],
    brief: "Four BNPL accounts manufactured a clean track record before simultaneously busting out. Find the shared device that created them all.",
    instruction: "Tap the device you believe was used to create all four bust-out BNPL accounts, then submit.",
    nodes: ["AC-6701", "AC-6702", "AC-6703", "AC-6704", "DEV-JJ30"],
    clusters: { "Bust-out Accounts": ["AC-6701", "AC-6702", "AC-6703", "AC-6704"], "Creation Device": ["DEV-JJ30"] },
    edges: [["DEV-JJ30", "AC-6701"], ["DEV-JJ30", "AC-6702"], ["DEV-JJ30", "AC-6703"], ["DEV-JJ30", "AC-6704"]],
    nodeLabels: { "DEV-JJ30": "Shared device" },
    answer: ["DEV-JJ30"],
    explanation: "DEV-JJ30 is the single device from which all four BNPL accounts were registered. The six-month patient track-record-building phase before simultaneous bust-out is a long-con fraud pattern: the operator invests small repayments over months to earn a higher credit limit, then liquidates all accounts at once. The shared device fingerprint links the accounts despite different KYC details and makes the ring detectable from day one.",
    hook: "Device intelligence - BNPL long-con bust-out / shared creation device",
  },

  // Case 48
  {
    id: "FD-48", order: 48, sector: "NBFC", title: "The Dealer Bust-Out",
    clues: [
      "A vehicle dealer submitted eight loan applications over three months for used cars, all approved with clean valuations.",
      "In month four, all eight borrowers defaulted simultaneously — none had made even one EMI payment.",
      "Investigation reveals the vehicles pledged as collateral either do not exist or were pledged against multiple loans.",
    ],
    brief: "Eight phantom vehicle loans all defaulted simultaneously. Find the three borrower accounts most connected to each other — the ring's core.",
    instruction: "Tap the three accounts you believe form the inner core of this dealer bust-out ring, then submit.",
    nodes: ["LOAN-7101", "LOAN-7102", "LOAN-7103", "LOAN-7104", "LOAN-7105", "LOAN-7106", "LOAN-7107", "LOAN-7108"],
    clusters: { "Bust-out Loans": ["LOAN-7101", "LOAN-7102", "LOAN-7103", "LOAN-7104", "LOAN-7105", "LOAN-7106", "LOAN-7107", "LOAN-7108"] },
    edges: [["LOAN-7101", "LOAN-7102"], ["LOAN-7101", "LOAN-7103"], ["LOAN-7102", "LOAN-7103"], ["LOAN-7103", "LOAN-7104"], ["LOAN-7104", "LOAN-7105"], ["LOAN-7105", "LOAN-7106"], ["LOAN-7106", "LOAN-7107"], ["LOAN-7107", "LOAN-7108"]],
    edgeLabels: { "LOAN-7101|LOAN-7102": "Shared guarantor", "LOAN-7101|LOAN-7103": "Same vehicle RC", "LOAN-7102|LOAN-7103": "Same phone" },
    nodeLabels: { "LOAN-7101": "Core", "LOAN-7102": "Core", "LOAN-7103": "Core" },
    answer: ["LOAN-7101", "LOAN-7102", "LOAN-7103"],
    explanation: "LOAN-7101, LOAN-7102, and LOAN-7103 share a guarantor, the same vehicle registration certificate, and the same phone number — three independent identity links that prove the three applications are controlled by one operator. The three-way clique at the centre of the application graph is the bust-out ring's core; the remaining five applications are satellite loans designed to dilute the pattern across the lender's portfolio.",
    hook: "Network intelligence - vehicle loan bust-out / clique detection",
  },

  // Case 49
  {
    id: "FD-49", order: 49, sector: "BANKING", title: "The Payroll Bust-Out",
    clues: [
      "A company onboarded 15 new employees in one month; all 15 opened salary accounts at the same branch.",
      "After receiving salaries for two months, 12 of the 15 accounts simultaneously requested maximum overdraft.",
      "All 12 overdraft amounts were withdrawn in cash on the same day; the company stopped operations the following week.",
    ],
    brief: "Twelve salary accounts maxed out overdrafts simultaneously just before their employer vanished. Find the two accounts showing the most shared-transaction links — the likely ring co-ordinators.",
    instruction: "Tap the two accounts you believe co-ordinated the overdraft bust-out, then submit.",
    nodes: ["AC-8801", "AC-8802", "AC-8803", "AC-8804", "AC-8805", "AC-8806", "AC-8807", "AC-8808", "AC-8809", "AC-8810", "AC-8811", "AC-8812"],
    clusters: { "Bust-out Accounts": ["AC-8801", "AC-8802", "AC-8803", "AC-8804", "AC-8805", "AC-8806", "AC-8807", "AC-8808", "AC-8809", "AC-8810", "AC-8811", "AC-8812"] },
    edges: [["AC-8801", "AC-8802"], ["AC-8801", "AC-8803"], ["AC-8802", "AC-8803"], ["AC-8803", "AC-8804"], ["AC-8804", "AC-8805"], ["AC-8805", "AC-8806"], ["AC-8806", "AC-8807"], ["AC-8807", "AC-8808"], ["AC-8808", "AC-8809"], ["AC-8809", "AC-8810"], ["AC-8810", "AC-8811"], ["AC-8811", "AC-8812"]],
    edgeLabels: { "AC-8801|AC-8802": "Shared ATM session", "AC-8801|AC-8803": "Shared referrer", "AC-8802|AC-8803": "Shared IP withdrawal" },
    nodeLabels: { "AC-8801": "High degree", "AC-8802": "High degree" },
    answer: ["AC-8801", "AC-8802"],
    explanation: "AC-8801 and AC-8802 share ATM sessions, referrer IDs, and IP addresses with more ring members than any other pair. In a coordinated payroll bust-out, the ring co-ordinators recruit other employees and co-ordinate the simultaneous overdraft request. Their higher within-ring connectivity reveals them as the architects: they are the accounts most aware of the full ring membership.",
    hook: "Network intelligence - payroll bust-out / co-ordinator degree centrality",
  },

  // ─── DEALER FRAUD (FD-50 to FD-52) ───────────────────────────────────────────

  // Case 50
  {
    id: "FD-50", order: 50, sector: "LENDING · DEALER FRAUD", title: "The Inventory Phantom",
    clues: [
      "A vehicle dealer submitted 11 floor-plan loan applications for new-car inventory over two months.",
      "Audit confirms that only 4 of the 11 vehicles claimed as collateral were physically present on the lot.",
      "All 11 loan disbursements were deposited into the same dealer operating account within 24 hours.",
    ],
    brief: "Eleven floor-plan loans were taken against phantom inventory, and all proceeds flowed to one account. Find it.",
    instruction: "Tap the dealer account you believe collected all eleven floor-plan disbursements, then submit.",
    nodes: ["DLR-6001", "LOAN-8101", "LOAN-8102", "LOAN-8103", "LOAN-8104", "LOAN-8105", "LOAN-8106", "LOAN-8107", "LOAN-8108", "LOAN-8109", "LOAN-8110", "LOAN-8111", "AC-4400"],
    clusters: { "Dealer": ["DLR-6001"], "Floor-plan Loans": ["LOAN-8101", "LOAN-8102", "LOAN-8103", "LOAN-8104", "LOAN-8105", "LOAN-8106", "LOAN-8107", "LOAN-8108", "LOAN-8109", "LOAN-8110", "LOAN-8111"], "Disbursement Hub": ["AC-4400"] },
    edges: [["DLR-6001", "LOAN-8101"], ["DLR-6001", "LOAN-8102"], ["DLR-6001", "LOAN-8103"], ["DLR-6001", "LOAN-8104"], ["DLR-6001", "LOAN-8105"], ["DLR-6001", "LOAN-8106"], ["DLR-6001", "LOAN-8107"], ["DLR-6001", "LOAN-8108"], ["DLR-6001", "LOAN-8109"], ["DLR-6001", "LOAN-8110"], ["DLR-6001", "LOAN-8111"], ["LOAN-8101", "AC-4400"], ["LOAN-8102", "AC-4400"], ["LOAN-8103", "AC-4400"], ["LOAN-8104", "AC-4400"], ["LOAN-8105", "AC-4400"], ["LOAN-8106", "AC-4400"], ["LOAN-8107", "AC-4400"], ["LOAN-8108", "AC-4400"], ["LOAN-8109", "AC-4400"], ["LOAN-8110", "AC-4400"], ["LOAN-8111", "AC-4400"]],
    edgeLabels: { "LOAN-8101|AC-4400": "₹8,00,000", "LOAN-8102|AC-4400": "₹7,50,000", "LOAN-8103|AC-4400": "₹8,20,000" },
    nodeLabels: { "AC-4400": "₹87,00,000 total" },
    answer: ["AC-4400"],
    explanation: "AC-4400 is the single operating account collecting all 11 floor-plan disbursements — ₹87 lakh for vehicles that were never fully stocked. The fan-in from 11 loan nodes to one disbursement account, with no corresponding vehicle registration activity, is the inventory-phantom pattern: the dealer inflates its lot size on paper to draw down floor-plan credit with no intent to purchase real inventory.",
    hook: "Network intelligence - floor-plan fraud / phantom inventory fan-in",
  },

  // Case 51
  {
    id: "FD-51", order: 51, sector: "LENDING · DEALER FRAUD", title: "The Double-Dip Dealer",
    clues: [
      "The same six vehicle VINs appear in loan applications submitted to two different financiers on the same day.",
      "Each VIN was used as collateral for two separate loans — once per financier — without disclosure.",
      "Both financiers disbursed to the same dealer account.",
    ],
    brief: "A dealer used the same vehicles as collateral for two loans each, sending all proceeds to one account. Find that double-dip account.",
    instruction: "Tap the dealer account you believe collected the double-dipped disbursements, then submit.",
    nodes: ["DLR-7001", "LOAN-9101", "LOAN-9102", "LOAN-9103", "LOAN-9104", "LOAN-9105", "LOAN-9106", "LOAN-9201", "LOAN-9202", "LOAN-9203", "LOAN-9204", "LOAN-9205", "LOAN-9206", "AC-5500"],
    clusters: { "Dealer": ["DLR-7001"], "Financier A Loans": ["LOAN-9101", "LOAN-9102", "LOAN-9103", "LOAN-9104", "LOAN-9105", "LOAN-9106"], "Financier B Loans": ["LOAN-9201", "LOAN-9202", "LOAN-9203", "LOAN-9204", "LOAN-9205", "LOAN-9206"], "Double-dip Account": ["AC-5500"] },
    edges: [["DLR-7001", "LOAN-9101"], ["DLR-7001", "LOAN-9102"], ["DLR-7001", "LOAN-9103"], ["DLR-7001", "LOAN-9201"], ["DLR-7001", "LOAN-9202"], ["DLR-7001", "LOAN-9203"], ["LOAN-9101", "AC-5500"], ["LOAN-9102", "AC-5500"], ["LOAN-9103", "AC-5500"], ["LOAN-9201", "AC-5500"], ["LOAN-9202", "AC-5500"], ["LOAN-9203", "AC-5500"]],
    edgeLabels: { "LOAN-9101|AC-5500": "₹6,00,000", "LOAN-9201|AC-5500": "₹5,80,000" },
    nodeLabels: { "AC-5500": "Double-dip hub" },
    answer: ["AC-5500"],
    explanation: "AC-5500 receives disbursements from both Financier A and Financier B loan nodes that reference the same six VINs. The double-pledging of collateral is invisible to each individual lender but obvious in a graph that indexes by collateral asset. When both financiers' loan nodes share a disbursement destination, the cross-lender fan-in immediately signals the dealer's double-dip.",
    hook: "Network intelligence - double-pledge collateral / cross-lender fan-in",
  },

  // Case 52
  {
    id: "FD-52", order: 52, sector: "LENDING · DEALER FRAUD", title: "The Straw Buyer Ring",
    clues: [
      "Eight car loan applications were filed by eight different individuals through one dealer over 30 days.",
      "Post-disbursal GPS tracking shows all eight vehicles parked at the same address — the dealer's storage yard.",
      "All eight borrowers are agricultural labourers earning less than ₹15,000 per month; their EMIs exceed their incomes.",
    ],
    brief: "Eight straw buyers took out car loans for vehicles that never left the dealer's lot. Find the single account that all eight loan amounts were funnelled to.",
    instruction: "Tap the account you believe received all eight straw-buyer loan disbursements, then submit.",
    nodes: ["DLR-8001", "LOAN-0101", "LOAN-0102", "LOAN-0103", "LOAN-0104", "LOAN-0105", "LOAN-0106", "LOAN-0107", "LOAN-0108", "AC-6800"],
    clusters: { "Dealer": ["DLR-8001"], "Straw Buyer Loans": ["LOAN-0101", "LOAN-0102", "LOAN-0103", "LOAN-0104", "LOAN-0105", "LOAN-0106", "LOAN-0107", "LOAN-0108"], "Beneficiary": ["AC-6800"] },
    edges: [["DLR-8001", "LOAN-0101"], ["DLR-8001", "LOAN-0102"], ["DLR-8001", "LOAN-0103"], ["DLR-8001", "LOAN-0104"], ["DLR-8001", "LOAN-0105"], ["DLR-8001", "LOAN-0106"], ["DLR-8001", "LOAN-0107"], ["DLR-8001", "LOAN-0108"], ["LOAN-0101", "AC-6800"], ["LOAN-0102", "AC-6800"], ["LOAN-0103", "AC-6800"], ["LOAN-0104", "AC-6800"], ["LOAN-0105", "AC-6800"], ["LOAN-0106", "AC-6800"], ["LOAN-0107", "AC-6800"], ["LOAN-0108", "AC-6800"]],
    edgeLabels: { "LOAN-0101|AC-6800": "₹4,50,000", "LOAN-0102|AC-6800": "₹4,50,000", "LOAN-0103|AC-6800": "₹4,50,000", "LOAN-0104|AC-6800": "₹4,50,000", "LOAN-0105|AC-6800": "₹4,50,000", "LOAN-0106|AC-6800": "₹4,50,000", "LOAN-0107|AC-6800": "₹4,50,000", "LOAN-0108|AC-6800": "₹4,50,000" },
    nodeLabels: { "AC-6800": "₹36,00,000", "DLR-8001": "Dealer" },
    answer: ["AC-6800"],
    explanation: "AC-6800 collects ₹36 lakh from eight loan accounts held by borrowers whose declared income cannot support the EMIs — the classic straw-buyer profile. GPS data confirming all eight cars are on the dealer's own lot proves the borrowers never took possession. The uniform disbursement amounts and the fan-in to one account are the graph signals; the income-to-EMI ratio and GPS data are the corroborating evidence.",
    hook: "Network intelligence - straw buyer ring / dealer disbursement fan-in",
  },
];

export const BONUS = {"id": "FD-BONUS", "title": "The Center of Hollywood", "badge": "PURE FILM TRIVIA - NO FRAUD HERE", "brief": "Kevin Bacon once said he'd worked with everybody in Hollywood - or someone who has. Below are four legends from completely different eras, industries and continents. Guess how close each one really sits to him, then watch them snap into place.", "instruction": "Tap the ring on the web where you think they land.", "rings": [{"degree": 1, "label": "1 degree - worked together directly"}, {"degree": 2, "label": "2 degrees - one film apart"}, {"degree": 3, "label": "3 degrees - still pretty close"}], "questions": [{"n": 1, "subject": "Amitabh Bachchan", "answer": 2, "note": "Bachchan connects through his Hollywood crossover work in two hops - a reminder that the film graph is far denser than it looks from the outside. VERIFY against the Oracle of Bacon before the event."}, {"n": 2, "subject": "Charlie Chaplin", "answer": 3, "note": "Different era entirely, still only three hops. VERIFY before the event."}, {"n": 3, "subject": "Bruce Lee", "answer": 3, "note": "Different continent and industry, still three hops. VERIFY before the event."}, {"n": 4, "subject": "Marilyn Monroe", "answer": 3, "note": "Died six years before Bacon was born, still three hops via co-stars who outlived her. VERIFY before the event."}], "payoff": "Almost nobody in film is more than three hops from anybody else, which is the whole point. A fraud graph behaves the same way - which is why 'these two accounts have no connection' is almost never true, and why the interesting question is not whether a path exists but how short and how deliberate it is.", "hook": "Network intelligence - small-world graphs and path length", "caution": "The four degree values above are placeholders pending verification against the Oracle of Bacon (oracleofbacon.org). Confirm each one before the event - a wrong trivia answer at a booth full of film buffs is an avoidable embarrassment."};
