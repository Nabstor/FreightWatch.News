// Update this file each quarter after earnings season.
// Last updated: Q4 2024 / FY2024 reporting cycle.

export interface EarningsEntry {
  name:          string;
  ticker:        string;
  exchange:      string;
  mode:          string;   // display badge
  quarter:       string;   // e.g. "Q4 2024"
  revenue:       string;   // formatted string e.g. "$25.3B"
  revenueYoY:    number;   // % change vs same quarter prior year (negative = decline)
  eps:           string;   // actual EPS e.g. "$2.75"
  epsEstimate:   string;   // consensus estimate
  beat:          boolean;  // true = beat, false = miss
  nextEarnings:  string;   // e.g. "Apr 2025"
  notes:         string;   // one-line context for freight professionals
}

// ── Top 10 Logistics & Freight Carriers — Q4 2024 ───────────────────────────
export const EARNINGS_DATA: EarningsEntry[] = [
  {
    name:         'United Parcel Service',
    ticker:       'UPS',
    exchange:     'NYSE',
    mode:         'Parcel',
    quarter:      'Q4 2024',
    revenue:      '$25.3B',
    revenueYoY:   -1.5,
    eps:          '$2.75',
    epsEstimate:  '$2.53',
    beat:         true,
    nextEarnings: 'Apr 2025',
    notes:        'Volume declines offset by yield management; cost restructuring ongoing.',
  },
  {
    name:         'FedEx Corporation',
    ticker:       'FDX',
    exchange:     'NYSE',
    mode:         'Parcel / Air',
    quarter:      'Q3 FY2025',
    revenue:      '$22.2B',
    revenueYoY:   -1.0,
    eps:          '$4.05',
    epsEstimate:  '$3.93',
    beat:         true,
    nextEarnings: 'Jun 2025',
    notes:        'DRIVE cost savings program tracking ahead of target; freight spin-off on track.',
  },
  {
    name:         'Old Dominion Freight Line',
    ticker:       'ODFL',
    exchange:     'NASDAQ',
    mode:         'LTL',
    quarter:      'Q4 2024',
    revenue:      '$1.47B',
    revenueYoY:   -5.6,
    eps:          '$1.27',
    epsEstimate:  '$1.24',
    beat:         true,
    nextEarnings: 'Apr 2025',
    notes:        'LTL demand softness persists; OR ratio held at 72.8% — industry-leading.',
  },
  {
    name:         'C.H. Robinson Worldwide',
    ticker:       'CHRW',
    exchange:     'NASDAQ',
    mode:         '3PL / Brokerage',
    quarter:      'Q4 2024',
    revenue:      '$4.6B',
    revenueYoY:   +8.2,
    eps:          '$1.43',
    epsEstimate:  '$1.35',
    beat:         true,
    nextEarnings: 'Apr 2025',
    notes:        'Truckload volume recovery driving brokerage gross margin expansion.',
  },
  {
    name:         'J.B. Hunt Transport Services',
    ticker:       'JBHT',
    exchange:     'NASDAQ',
    mode:         'Intermodal / TL',
    quarter:      'Q4 2024',
    revenue:      '$3.1B',
    revenueYoY:   -3.8,
    eps:          '$1.66',
    epsEstimate:  '$1.72',
    beat:         false,
    nextEarnings: 'Apr 2025',
    notes:        'Intermodal load growth positive but revenue per load under pressure.',
  },
  {
    name:         'XPO Inc.',
    ticker:       'XPO',
    exchange:     'NYSE',
    mode:         'LTL',
    quarter:      'Q4 2024',
    revenue:      '$2.1B',
    revenueYoY:   +5.4,
    eps:          '$0.86',
    epsEstimate:  '$0.81',
    beat:         true,
    nextEarnings: 'May 2025',
    notes:        'LTL market share gains accelerating post-Yellow exit; OR improving.',
  },
  {
    name:         'Knight-Swift Transportation',
    ticker:       'KNX',
    exchange:     'NYSE',
    mode:         'Truckload / LTL',
    quarter:      'Q4 2024',
    revenue:      '$1.8B',
    revenueYoY:   -2.1,
    eps:          '$0.29',
    epsEstimate:  '$0.27',
    beat:         true,
    nextEarnings: 'Apr 2025',
    notes:        'Truckload rate environment remains challenged; LTL integration progressing.',
  },
  {
    name:         'Saia Inc.',
    ticker:       'SAIA',
    exchange:     'NASDAQ',
    mode:         'LTL',
    quarter:      'Q4 2024',
    revenue:      '$784M',
    revenueYoY:   +9.8,
    eps:          '$3.39',
    epsEstimate:  '$3.51',
    beat:         false,
    nextEarnings: 'Apr 2025',
    notes:        'Terminal expansion driving revenue growth; new market density takes time.',
  },
  {
    name:         'Expeditors International',
    ticker:       'EXPD',
    exchange:     'NASDAQ',
    mode:         'Freight Forwarding',
    quarter:      'Q4 2024',
    revenue:      '$2.6B',
    revenueYoY:   +14.3,
    eps:          '$1.55',
    epsEstimate:  '$1.49',
    beat:         true,
    nextEarnings: 'May 2025',
    notes:        'Ocean and air forwarding volumes surging on Red Sea and tariff pull-forward.',
  },
  {
    name:         'Landstar System',
    ticker:       'LSTR',
    exchange:     'NASDAQ',
    mode:         'Asset-Light TL',
    quarter:      'Q4 2024',
    revenue:      '$1.1B',
    revenueYoY:   -6.7,
    eps:          '$1.53',
    epsEstimate:  '$1.50',
    beat:         true,
    nextEarnings: 'Apr 2025',
    notes:        'Agent-based model holding margins despite soft spot market conditions.',
  },
];

export const LAST_UPDATED = 'Q4 2024';
export const NEXT_UPDATE  = 'May 2025';
