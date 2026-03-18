// app.js — Lender Hub Application Logic
// All data embedded; no server required.

'use strict';

// ============================================================
// DATA
// ============================================================
const LENDERS = [
  {
    id: 'amcredit',
    name: 'AmeriCredit',
    fullName: 'AmeriCredit (GM Financial)',
    abbr: 'GMF',
    colorClass: 'lc-amcredit',
    docTitle: 'Retail Underwriting Guidelines',
    effectiveDate: 'January 8, 2026',
    segment: 'near',   // prime / near / sub / deep
    segmentLabel: 'Near-Prime',
    ficoMin: 500,
    ficoNotes: 'Bureau varies by state (Equifax, TU, Experian). No score below 500.',
    maxTerm: 84,
    maxMileage: '100,000 mi',
    maxLTV: '135%',
    gapMax: '$1,500',
    reserveStructure: 'Up to 2% / $200 flat @ buy rate',
    chargebackWindow: '3 payments / 3 cycles',
    uniqueFeature: 'ITIN accepted; 70/30 split; state-specific bureau',
    bureaus: {
      primary: ['equifax','transunion','experian'],
      note: 'State-specific. Equifax: CA NV OR WA ID MT WY UT CO NM AZ HI AK. Experian: NC SC GA FL AL MS. TransUnion: all other states.',
      stateMap: { equifax: 'CA, NV, OR, WA, ID, MT, WY, UT, CO, NM, AZ, HI, AK', experian: 'NC, SC, GA, FL, AL, MS', transunion: 'All other states' }
    },
    contactNumber: null,
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Credit',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Minimum Score</span><span class="info-val">500</span></div>
            <div class="info-row"><span class="info-key">Bureau</span><span class="info-val">State-specific (Equifax, TransUnion, Experian)</span></div>
            <div class="info-row"><span class="info-key">Min Income — A+/A2</span><span class="info-val">$2,200 gross/mo</span></div>
            <div class="info-row"><span class="info-key">Min Income — A3/B3</span><span class="info-val">$2,400 gross/mo</span></div>
            <div class="info-row"><span class="info-key">Preferred File Depth</span><span class="info-val">3+ yrs, 5 trade lines (3 active/current)</span></div>
            <div class="info-row"><span class="info-key">Bankruptcy</span><span class="info-val">Ch. 7 & 13 must be discharged</span></div>
            <div class="info-row"><span class="info-key">ITIN</span><span class="info-val">✓ Accepted — IRS assignment letter + bank statements</span></div>
            <div class="info-row"><span class="info-key">Minimum Age</span><span class="info-val">18</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>Equifax states: CA, NV, OR, WA, ID, MT, WY, UT, CO, NM, AZ, HI, AK. Experian: NC, SC, GA, FL, AL, MS. TransUnion: all remaining states.</span></div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">ID Required</span><span class="info-val">Government-issued; standard identity verification</span></div>
            <div class="info-row"><span class="info-key">Min Residence History</span><span class="info-val">1 year (preferred)</span></div>
            <div class="info-row"><span class="info-key">POR Docs</span><span class="info-val">Utility bill ≤45 days and/or paystub ≤45 days supporting address</span></div>
            <div class="info-row"><span class="info-key">POR Determination</span><span class="info-val">Deal-by-deal basis</span></div>
            <div class="info-row"><span class="info-key">ITIN</span><span class="info-val">IRS-ITIN Assignment Number letter on IRS letterhead</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Paystub Age</span><span class="info-val">≤45 days from contract date</span></div>
            <div class="info-row"><span class="info-key">Secondary Employment</span><span class="info-val">Must be at job ≥1 year; paystub ≤45 days</span></div>
            <div class="info-row"><span class="info-key">Self-Employed</span><span class="info-val">3 consecutive personal bank stmts ≤45 days; no NSF; ending balance ≥2× GM payment</span></div>
            <div class="info-row"><span class="info-key">1099 Income</span><span class="info-val">≥24 months at employer; paystub ≤45 days + most recent 1099-MISC</span></div>
            <div class="info-row"><span class="info-key">Social Security</span><span class="info-val">Bank statement ≤45 days; must show name, funds received, depositor</span></div>
            <div class="info-row"><span class="info-key">VA/Pension</span><span class="info-val">Paystub or bank statement ≤45 days specifying depositor</span></div>
            <div class="info-row"><span class="info-key">Child Support / Alimony</span><span class="info-val">Court order + 3 consecutive payment docs; verbal verify with AG office</span></div>
            <div class="info-row"><span class="info-key">Non-Taxable Gross-Up</span><span class="info-val">+25% (alimony, child support, SS, disability, pension, annuity)</span></div>
            <div class="info-row"><span class="info-key">Temp Employees</span><span class="info-val">Minimum 1-year history with current agency</span></div>
          </div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">New Vehicles</span><span class="info-val">Up to 125% LTV</span></div>
            <div class="info-row"><span class="info-key">Used &lt;70K miles</span><span class="info-val">Up to 125% LTV</span></div>
            <div class="info-row"><span class="info-key">Used &lt;50K miles</span><span class="info-val">Up to 135% LTV</span></div>
            <div class="info-row"><span class="info-key">Canadian Vehicles (A Tier)</span><span class="info-val">Max 125%</span></div>
            <div class="info-row"><span class="info-key">Canadian Vehicles (B Tier)</span><span class="info-val">Max 115%</span></div>
            <div class="info-row"><span class="info-key">Max Term</span><span class="info-val">84 months (B2+ on vehicles ≤4 yrs old)</span></div>
            <div class="info-row"><span class="info-key">Min Term</span><span class="info-val">12 months</span></div>
            <div class="info-row"><span class="info-key">Min Amount ≤72 mo</span><span class="info-val">$7,500</span></div>
            <div class="info-row"><span class="info-key">Min Amount 75–84 mo</span><span class="info-val">$15,000</span></div>
            <div class="info-row"><span class="info-key">Max Vehicle Age</span><span class="info-val">9 years old or newer</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">100,000 miles</span></div>
            <div class="info-row"><span class="info-key">Approval Expiry</span><span class="info-val">30 days from initial application</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span>First payment: 19–47 days from contract date. Contracts must fund within 30 days of initial application.</span></div>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">GAP Maximum</span><span class="info-val">$1,500 or state max (lesser)</span></div>
            <div class="info-row"><span class="info-key">GAP Min LTV</span><span class="info-val">65% (80% IN / 70% CA)</span></div>
            <div class="info-row"><span class="info-key">GAP — Not Allowed</span><span class="info-val">NY indirect retail; advances &lt;65%; covered service members in CA</span></div>
            <div class="info-row"><span class="info-key">Service Contract</span><span class="info-val">✓ Included in dealer advance calculation</span></div>
          </div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Participation</span><span class="info-val">Up to 2%</span></div>
            <div class="info-row"><span class="info-key">Flat @ Buy Rate</span><span class="info-val">$200</span></div>
            <div class="info-row"><span class="info-key">Split</span><span class="info-val">70/30 (AmeriCredit keeps 30%)</span></div>
            <div class="info-row"><span class="info-key">Chargeback Window</span><span class="info-val">3 payments and 3 payment cycles</span></div>
            <div class="info-row"><span class="info-key">Assignment Fee</span><span class="info-val">$150 nonrefundable per contract (cannot charge customer)</span></div>
          </div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">New Vehicle Definition</span><span class="info-val">Current/future year, ≤7,500 miles (non-GM ≤5,000 mi)</span></div>
            <div class="info-row"><span class="info-key">Book Value Guide</span><span class="info-val">KBB (AZ, CA, CO, HI, ID, MT, NM, NV, OR, UT, WA, WY); JD Power all others</span></div>
          </div>
          <div class="note-box danger" style="margin-top: var(--space-3)"><span class="note-icon">🚫</span><span><strong>Ineligible:</strong> Commercial, livery, rideshare (Uber/Lyft/DoorDash), exotic, motorcycle, RV, gray market, branded titles (salvage, flood, VIN cloning).</span></div>
        `
      }
    }
  },
  {
    id: 'exeter',
    name: 'Exeter Finance',
    fullName: 'Exeter Finance',
    abbr: 'EXF',
    colorClass: 'lc-exeter',
    docTitle: 'Exeter Program Guidelines / Rate Sheet',
    effectiveDate: 'January 9, 2026',
    segment: 'sub',
    segmentLabel: 'Sub-Prime',
    ficoMin: 400,
    ficoNotes: 'Standard: 400+; Zero FICO considered. ExeterPLUS: 620+.',
    maxTerm: 78,
    maxMileage: '200,000 mi',
    maxLTV: '150%',
    gapMax: '$1,200',
    reserveStructure: 'Up to 2% power flat (varies by tier)',
    chargebackWindow: '3 payments (first 3 must be made in full)',
    uniqueFeature: 'Zero FICO accepted; ExeterPLUS enhanced program at 620+; 200K mile limit',
    bureaus: {
      primary: ['equifax','transunion','experian'],
      note: 'Pulls all three bureaus. Uses the middle score.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Credit',
        content: `
          <div class="prog-tabs" role="tablist">
            <div class="prog-tab active" role="tab" data-prog="std">Standard</div>
            <div class="prog-tab" role="tab" data-prog="plus">ExeterPLUS (620+)</div>
          </div>
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Standard Min FICO</span><span class="info-val">400 (zero FICO considered)</span></div>
            <div class="info-row"><span class="info-key">ExeterPLUS Min FICO</span><span class="info-val">620</span></div>
            <div class="info-row"><span class="info-key">Standard Rate As Low As</span><span class="info-val">10.95%</span></div>
            <div class="info-row"><span class="info-key">ExeterPLUS Rate As Low As</span><span class="info-val">9.95%</span></div>
            <div class="info-row"><span class="info-key">BK — Chapter 7</span><span class="info-val">Will consider</span></div>
            <div class="info-row"><span class="info-key">BK — Chapter 13</span><span class="info-val">Must be discharged</span></div>
            <div class="info-row"><span class="info-key">Dismissed BK</span><span class="info-val">Must be 12+ months old</span></div>
            <div class="info-row"><span class="info-key">Multiple Discharged BK</span><span class="info-val">Not allowed</span></div>
            <div class="info-row"><span class="info-key">Repos (last 2 months)</span><span class="info-val">Avoid (unless part of BK)</span></div>
            <div class="info-row"><span class="info-key">ExeterPLUS Repos</span><span class="info-val">No repos in last 12 months; no multiple repos</span></div>
            <div class="info-row"><span class="info-key">ExeterPLUS Tradelines</span><span class="info-val">Minimum 2 required</span></div>
            <div class="info-row"><span class="info-key">Dealership Employees</span><span class="info-val">Ineligible</span></div>
          </div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">ID Required</span><span class="info-val">Valid government-issued ID at contracting</span></div>
            <div class="info-row"><span class="info-key">ITIN</span><span class="info-val">✓ Must provide IRS-issued letter</span></div>
            <div class="info-row"><span class="info-key">Title Application</span><span class="info-val">Must list at least one borrower as registered owner using exact name on DL</span></div>
            <div class="info-row"><span class="info-key">POR Options</span><span class="info-val">Valid driver's license OR utility bill ≤30 days of contract date</span></div>
            <div class="info-row"><span class="info-key">Phone Requirement</span><span class="info-val">Must have active phone number and physical address</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>Applicants are called to verify information prior to funding (prefunding confirmation).</span></div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">W2 Paystub Age</span><span class="info-val">Within 30 days of contract date + verification of employment</span></div>
            <div class="info-row"><span class="info-key">Secondary Employment</span><span class="info-val">Must be at secondary job ≥1 year</span></div>
            <div class="info-row"><span class="info-key">Self-Employed</span><span class="info-val">Last year's professionally prepared tax return OR 3 most current months personal bank stmts</span></div>
            <div class="info-row"><span class="info-key">Self-Employed Bank Stmts</span><span class="info-val">Cannot show NSF activity</span></div>
            <div class="info-row"><span class="info-key">SS / VA / Retirement</span><span class="info-val">Current bank/card statement showing beneficiary name and amount</span></div>
            <div class="info-row"><span class="info-key">Non-Taxable Gross-Up</span><span class="info-val">+25%</span></div>
            <div class="info-row"><span class="info-key">Child / Spousal Support</span><span class="info-val">3 months consecutive pay history required; award letters/court orders NOT sufficient alone</span></div>
            <div class="info-row"><span class="info-key">Military</span><span class="info-val">Current LES with dates of service</span></div>
            <div class="info-row"><span class="info-key">Min Income (Single)</span><span class="info-val">$1,700/month</span></div>
            <div class="info-row"><span class="info-key">Min Income (Joint)</span><span class="info-val">$2,500/month</span></div>
            <div class="info-row"><span class="info-key">Rideshare Drivers</span><span class="info-val">Ineligible (Uber, DoorDash, etc.)</span></div>
            <div class="info-row"><span class="info-key">Temp Workers</span><span class="info-val">6+ months with same agency</span></div>
            <div class="info-row"><span class="info-key">Self-Employed / Contractor</span><span class="info-val">2+ years employment</span></div>
          </div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Front-End LTV</span><span class="info-val">Up to 135%</span></div>
            <div class="info-row"><span class="info-key">Total LTV</span><span class="info-val">Up to 150%</span></div>
            <div class="info-row"><span class="info-key">Standard Max Term</span><span class="info-val">78 months</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">200,000 miles</span></div>
            <div class="info-row"><span class="info-key">Vehicle Age Limit</span><span class="info-val">13 years</span></div>
            <div class="info-row"><span class="info-key">Under $10K Book Value</span><span class="info-val">Max 66 months</span></div>
            <div class="info-row"><span class="info-key">NJ &lt;$10K Cash Price</span><span class="info-val">Max 48 months</span></div>
            <div class="info-row"><span class="info-key">Max PTI (Standard)</span><span class="info-val">15–21%</span></div>
            <div class="info-row"><span class="info-key">Max DTI (Standard)</span><span class="info-val">77–87%</span></div>
            <div class="info-row"><span class="info-key">Min Amount Financed</span><span class="info-val">$6,000</span></div>
            <div class="info-row"><span class="info-key">Max Amount Financed</span><span class="info-val">$50,000</span></div>
            <div class="info-row"><span class="info-key">Approval Expiry</span><span class="info-val">30 days</span></div>
            <div class="info-row"><span class="info-key">CPO Bonus</span><span class="info-val">+$1,000 book value for manufacturer-certified pre-owned</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span>Non-PLUS approvals: contracts received after 20 days from initial submission NOT eligible for participation. All hail damage must be repaired before contracting.</span></div>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">GAP (Standard)</span><span class="info-val">$1,200 or state max</span></div>
            <div class="info-row"><span class="info-key">GAP Min LTV</span><span class="info-val">70% front-end</span></div>
            <div class="info-row"><span class="info-key">GAP Not Allowed</span><span class="info-val">MA, NY</span></div>
            <div class="info-row"><span class="info-key">VSC (Standard)</span><span class="info-val">$3,500 (full coverage); $2,500 for 90K+ miles or 9+ year-old units (powertrain only)</span></div>
            <div class="info-row"><span class="info-key">VSC (PLUS Bronze/Silver)</span><span class="info-val">$4,000</span></div>
            <div class="info-row"><span class="info-key">VSC (PLUS Gold)</span><span class="info-val">$4,500</span></div>
            <div class="info-row"><span class="info-key">Maint / Tire & Wheel</span><span class="info-val">$1,500</span></div>
            <div class="info-row"><span class="info-key">Total Backend (Standard)</span><span class="info-val">$4,000 or 25% of book (lesser)</span></div>
            <div class="info-row"><span class="info-key">Total Backend (PLUS Bronze/Silver)</span><span class="info-val">$4,500 or 25% of book (lesser)</span></div>
            <div class="info-row"><span class="info-key">Total Backend (PLUS Gold)</span><span class="info-val">$5,000 or 25% of book (lesser)</span></div>
            <div class="info-row"><span class="info-key">VSC Minimum Coverage</span><span class="info-val">24 months / 24,000 miles</span></div>
          </div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Standard Participation</span><span class="info-val">Up to 2% (power flat; varies by tier)</span></div>
            <div class="info-row"><span class="info-key">Rate Markup</span><span class="info-val">Not permissible — dealer does NOT mark up customer rate</span></div>
            <div class="info-row"><span class="info-key">Chargeback</span><span class="info-val">First 3 payments must be made in full to avoid chargeback</span></div>
            <div class="info-row"><span class="info-key">Non-PLUS Eligibility</span><span class="info-val">Contracts received within 20 days of initial submission</span></div>
            <div class="info-row"><span class="info-key">ExeterPLUS Eligibility</span><span class="info-val">30 days from approval</span></div>
            <div class="info-row"><span class="info-key">Acquisition Fee</span><span class="info-val">May be assessed; cannot charge applicant; non-refundable</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span>Down payment must be paid in full to fund. No deferred down payments (except CA & NV).</span></div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Age Limit</span><span class="info-val">Up to 13 years old</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">200,000 miles</span></div>
          </div>
          <div class="note-box danger" style="margin-top: var(--space-3)"><span class="note-icon">🚫</span><span><strong>Ineligible:</strong> Commercial, rideshare/delivery, above 1-ton trucks, exotics, motorcycles, RVs, models not in current JD Power or KBB.</span></div>
        `
      }
    }
  },
  {
    id: 'regional',
    name: 'Regional Acceptance',
    fullName: 'Regional Finance / Regional Acceptance Corp.',
    abbr: 'RAC',
    colorClass: 'lc-regional',
    docTitle: 'Consumer Rates — Indirect Auto Finance Program',
    effectiveDate: 'January 1, 2026',
    segment: 'sub',
    segmentLabel: 'Sub-Prime',
    stateRestriction: 'Texas Only',
    ficoMin: null,
    ficoNotes: 'Tier-based (T1–T7); no explicit FICO minimum published in rate sheet.',
    maxTerm: 84,
    maxMileage: '130,000 mi (at 48 mo)',
    maxLTV: '125%',
    gapMax: '$1,000',
    reserveStructure: 'Flat (T1–4) / Discount (T5–7); up to 3% flat / 6.5% discount',
    chargebackWindow: 'N/A listed in rate sheet',
    uniqueFeature: 'TX only; T1–4 flat pay, T5–7 dealer discount; 84 mo on T1–4 with ≤20K miles',
    bureaus: {
      primary: ['transunion'],
      note: 'Primarily TransUnion. Confirm with regional rep for state exceptions.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'Tiers & Credit',
        content: `
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>No explicit FICO minimums in the rate sheet. Tier assignment (T1–T7) determines rates, LTV, and max terms. Contact RAC for tier qualification guidelines.</span></div>
          <table class="tier-table" style="margin-top: var(--space-4)">
            <thead><tr><th>Tier</th><th>Type</th><th>Max LTV</th><th>Max Term</th></tr></thead>
            <tbody>
              <tr><td>T1</td><td>Flat</td><td>125%</td><td>84 mo (≤20K mi)</td></tr>
              <tr><td>T2</td><td>Flat</td><td>125%</td><td>84 mo (≤20K mi)</td></tr>
              <tr><td>T3</td><td>Flat</td><td>125%</td><td>84 mo (≤20K mi)</td></tr>
              <tr><td>T4</td><td>Flat</td><td>125%</td><td>84 mo (≤20K mi)</td></tr>
              <tr><td>T5</td><td>Discount</td><td>120%</td><td>75 mo (≤70K mi)</td></tr>
              <tr><td>T6</td><td>Discount</td><td>115%</td><td>75 mo (≤50K mi)</td></tr>
              <tr><td>T7</td><td>Discount</td><td>110%</td><td>72 mo (≤60K mi)</td></tr>
            </tbody>
          </table>
          <div class="note-box warn" style="margin-top: var(--space-3)"><span class="note-icon">🏴</span><span><strong>Texas Only.</strong> ELT Code: 56124067800</span></div>
        `
      },
      id: { icon: '🪪', label: 'ID & Residency', content: `<div class="info-row"><span class="info-key">Standard Requirement</span><span class="info-val">Standard auto finance income documentation applies; contact RAC for stips</span></div>` },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `<div class="note-box info"><span class="note-icon">ℹ️</span><span>Income stipulations are determined by tier assignment and deal structure at time of approval. The rate sheet does not detail specific income docs — contact RAC buyer for stips on each deal.</span></div>`
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">T1–T4 Max LTV</span><span class="info-val">125%</span></div>
            <div class="info-row"><span class="info-key">T5 Max LTV</span><span class="info-val">120%</span></div>
            <div class="info-row"><span class="info-key">T6 Max LTV</span><span class="info-val">115%</span></div>
            <div class="info-row"><span class="info-key">T7 Max LTV</span><span class="info-val">110%</span></div>
            <div class="info-row"><span class="info-key">Valuation Basis</span><span class="info-val">NADA Trade-In</span></div>
            <div class="info-row"><span class="info-key">Processing Fee</span><span class="info-val">$100 (returned contracts: +$100)</span></div>
          </div>
          <table class="tier-table" style="margin-top:var(--space-4)">
            <thead><tr><th>Term</th><th>T1-4 Miles</th><th>T5 Miles</th><th>T6 Miles</th><th>T7 Miles</th></tr></thead>
            <tbody>
              <tr><td>84 mo</td><td>20,000</td><td>NA</td><td>NA</td><td>NA</td></tr>
              <tr><td>78 mo</td><td>30,000</td><td>NA</td><td>NA</td><td>NA</td></tr>
              <tr><td>75 mo</td><td>70,000</td><td>70,000</td><td>50,000</td><td>NA</td></tr>
              <tr><td>72 mo</td><td>80,000</td><td>80,000</td><td>60,000</td><td>60,000</td></tr>
              <tr><td>66 mo</td><td>100,000</td><td>100,000</td><td>80,000</td><td>80,000</td></tr>
              <tr><td>60 mo</td><td>120,000</td><td>120,000</td><td>100,000</td><td>100,000</td></tr>
              <tr><td>54 mo</td><td>125,000</td><td>125,000</td><td>115,000</td><td>115,000</td></tr>
              <tr><td>48 mo</td><td>130,000</td><td>130,000</td><td>120,000</td><td>120,000</td></tr>
            </tbody>
          </table>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Warranty (Collateral &lt;$25K)</span><span class="info-val">Max $3,000 (24 mo / 24K mi minimum)</span></div>
            <div class="info-row"><span class="info-key">Warranty (Collateral ≥$25K)</span><span class="info-val">Max $4,000 (24 mo / 24K mi minimum)</span></div>
            <div class="info-row"><span class="info-key">GAP</span><span class="info-val">$1,000 or state max (lesser); min 70% LTV</span></div>
          </div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <table class="tier-table">
            <thead><tr><th>LTV Band</th><th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th></tr></thead>
            <tbody>
              <tr><td>0–90%</td><td>3% /$1,200</td><td>2.5% /$1,000</td><td>2% /$800</td><td>1.5% /$600</td><td>0%</td><td>−1.5%</td><td>−3.5%</td></tr>
              <tr><td>90–100%</td><td>2.5% /$1,000</td><td>2% /$800</td><td>1.5% /$600</td><td>1% /$400</td><td>−0.5%</td><td>−2.5%</td><td>−4.5%</td></tr>
              <tr><td>100–115%</td><td>2% /$800</td><td>1.5% /$600</td><td>1% /$400</td><td>0.5% /$200</td><td>−1%</td><td>−4.5%</td><td>−6.5%</td></tr>
              <tr><td>115%+</td><td>1.5% /$600</td><td>1% /$400</td><td>0.5% /$200</td><td>0%</td><td>−1.5%</td><td>−4.5%</td><td>−6.5%</td></tr>
            </tbody>
          </table>
          <div class="note-box warn" style="margin-top: var(--space-3)"><span class="note-icon">⚠️</span><span>T1–T4: flat pay (positive %). T5–T7: dealer discount (negative %). Minimum discount amounts apply for T5–T7.</span></div>
        `
      },
      vehicles: { icon: '🚗', label: 'Vehicle Eligibility', content: `<div class="info-grid"><div class="info-row"><span class="info-key">Like Invoice Method</span><span class="info-val">Match first 8 VIN characters with similar equipment</span></div><div class="info-row"><span class="info-key">Invoice %</span><span class="info-val">&lt;6K mi: 90% | &lt;12K: 85% | &lt;18K: 80% | &lt;25K: 75% | 25K+: Call RAC</span></div></div>` }
    }
  },
  {
    id: 'truist',
    name: 'Truist',
    fullName: 'Truist Dealer Financial Services',
    abbr: 'TRU',
    colorClass: 'lc-truist',
    docTitle: 'Program Guide Reference Sheet',
    effectiveDate: 'February 5, 2026',
    segment: 'prime',
    segmentLabel: 'Prime',
    ficoMin: 640,
    ficoNotes: 'Min 640; both applicants must score 640+. 680+ required for 76–84 month terms.',
    maxTerm: 84,
    maxMileage: '120,000 mi (50K for 76–84 mo)',
    maxLTV: '155%',
    gapMax: 'See callback',
    reserveStructure: 'Up to 2% (≤75 mo) / 1.5% (76–84 mo); max $8,000; flat guide $150–$2,600',
    chargebackWindow: 'Flat cancel: charged back if no payment within 20 days of funding',
    uniqueFeature: 'Backend up to $10K; CPO bonus $750–$1,500; 6 tiers Super Prime → Subprime',
    bureaus: {
      primary: ['transunion','equifax'],
      note: 'Primary: TransUnion FICO Auto 9. Equifax used for FL, GA, NC, SC, TX, VA.',
      stateMap: { transunion: 'Most states', equifax: 'FL, GA, NC, SC, TX, VA' }
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Tiers',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Bureau</span><span class="info-val">TransUnion FICO Auto 9 (Equifax for FL, GA, NC, SC, TX, VA)</span></div>
            <div class="info-row"><span class="info-key">Minimum Score</span><span class="info-val">640 (all applicants)</span></div>
            <div class="info-row"><span class="info-key">76–84 Month Min FICO</span><span class="info-val">680</span></div>
            <div class="info-row"><span class="info-key">Max DTI</span><span class="info-val">65% (all tiers)</span></div>
            <div class="info-row"><span class="info-key">Max PTI (≤75 mo)</span><span class="info-val">20%</span></div>
            <div class="info-row"><span class="info-key">Max PTI (76–84 mo std)</span><span class="info-val">18%</span></div>
            <div class="info-row"><span class="info-key">Max PTI (T5–T6)</span><span class="info-val">15%</span></div>
          </div>
          <table class="tier-table" style="margin-top:var(--space-4)">
            <thead><tr><th>Tier</th><th>Label</th><th>FE LTV (≤75 mo)</th><th>Total LTV (≤75 mo)</th><th>FE LTV (76–84 mo)</th></tr></thead>
            <tbody>
              <tr><td>T1 / A1</td><td>Super Prime</td><td>130%</td><td>155%</td><td>120%</td></tr>
              <tr><td>T2 / A2</td><td>Prime</td><td>130%</td><td>155%</td><td>120%</td></tr>
              <tr><td>T3 / B1</td><td>Near Prime</td><td>125%</td><td>145%</td><td>115%</td></tr>
              <tr><td>T4 / B2</td><td>Standard</td><td>120%</td><td>140%</td><td>115%</td></tr>
              <tr><td>T5 / B3</td><td>Below Standard</td><td>120%</td><td>135%</td><td>115%</td></tr>
              <tr><td>T6 / C1</td><td>Subprime</td><td>120%</td><td>130%</td><td>115%</td></tr>
            </tbody>
          </table>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Acceptable POR</span><span class="info-val">Credit card stmt / bank stmt (&lt;3 mo); utility bill (&lt;3 mo); property tax bill; driver's license; voter registration; LES; military orders; new mortgage docs (≤3 mo)</span></div>
            <div class="info-row"><span class="info-key">Address Verification</span><span class="info-val">Required if &lt;1.5 yrs at current address or address doesn't validate to credit bureau</span></div>
            <div class="info-row"><span class="info-key">Residency Rule</span><span class="info-val">Client must reside and title vehicle in borrower's state of residence</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `<div class="note-box info"><span class="note-icon">ℹ️</span><span>Truist verifies income per stipulations listed on the dealer callback. Specific stip documents are deal-specific. Contact Truist credit department for requirements on each approval.</span></div>`
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Mileage (≤75 mo)</span><span class="info-val">120,000 miles</span></div>
            <div class="info-row"><span class="info-key">Max Mileage (76–84 mo)</span><span class="info-val">50,000 miles</span></div>
            <div class="info-row"><span class="info-key">Min Collateral (76–84 mo)</span><span class="info-val">$20,000</span></div>
            <div class="info-row"><span class="info-key">Min Collateral (73–75 mo)</span><span class="info-val">$12,000</span></div>
            <div class="info-row"><span class="info-key">First Payment Window</span><span class="info-val">15–60 days (61–90 days with UW approval ≤75 mo)</span></div>
            <div class="info-row"><span class="info-key">90-Day Rule</span><span class="info-val">Not available on contracts over 75 mo; only 700+ FICO</span></div>
            <div class="info-row"><span class="info-key">Approval Expiry</span><span class="info-val">30 days</span></div>
            <div class="info-row"><span class="info-key">Loan Processing Fee</span><span class="info-val">$25 per loan</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span>No cash-out. No credit card down payments. Contracts must be presented no later than 7 days after contract date.</span></div>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Approved Products</span><span class="info-val">Extended Service Contract, Maintenance, GAP</span></div>
            <div class="info-row"><span class="info-key">NOT Accepted</span><span class="info-val">Credit Life, Accident & Health</span></div>
            <div class="info-row"><span class="info-key">Backend Max Rule</span><span class="info-val">Greater of $4,200 or 20% of collateral value; absolute max $10,000</span></div>
            <div class="info-row"><span class="info-key">CPO Bonus (Standard)</span><span class="info-val">+$750 advance</span></div>
            <div class="info-row"><span class="info-key">CPO Bonus (Luxury)</span><span class="info-val">+$1,500 advance (up to 5 yrs old, ≤50K miles)</span></div>
          </div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Reserve Spread (≤75 mo)</span><span class="info-val">2.00%</span></div>
            <div class="info-row"><span class="info-key">Max Reserve Spread (76–84 mo)</span><span class="info-val">1.50%</span></div>
            <div class="info-row"><span class="info-key">Max Dealer Reserve (total)</span><span class="info-val">$8,000</span></div>
            <div class="info-row"><span class="info-key">Flat Cancel Fee</span><span class="info-val">$150 debited if flat cancel fee not received within 20 days of funding</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;opacity:.7">Flat Pay Scale (by Amount Financed)</h4>
          <table class="tier-table">
            <thead><tr><th>Amount Financed</th><th>Flat Fee</th><th>Amount Financed</th><th>Flat Fee</th></tr></thead>
            <tbody>
              <tr><td>$10,000 – $14,999</td><td>$150</td><td>$55,000 – $59,999</td><td>$800</td></tr>
              <tr><td>$15,000 – $19,999</td><td>$200</td><td>$60,000 – $69,999</td><td>$900</td></tr>
              <tr><td>$20,000 – $24,999</td><td>$275</td><td>$70,000 – $79,999</td><td>$1,050</td></tr>
              <tr><td>$25,000 – $29,999</td><td>$350</td><td>$80,000 – $99,999</td><td>$1,200</td></tr>
              <tr><td>$30,000 – $34,999</td><td>$450</td><td>$100,000 – $119,999</td><td>$1,500</td></tr>
              <tr><td>$35,000 – $39,999</td><td>$525</td><td>$120,000 – $149,999</td><td>$1,800</td></tr>
              <tr><td>$40,000 – $44,999</td><td>$600</td><td>$150,000 – $199,999</td><td>$2,100</td></tr>
              <tr><td>$45,000 – $49,999</td><td>$650</td><td>$200,000 – $239,999</td><td>$2,400</td></tr>
              <tr><td>$50,000 – $54,999</td><td>$725</td><td>$240,000 – $400,000</td><td>$2,600</td></tr>
            </tbody>
          </table>
          <div class="note-box warn" style="margin-top:var(--space-2)"><span class="note-icon">⚠️</span><span>Max Dealer Reserve capped at <strong>$8,000</strong> per contract. Flat cancel fee of $150 debited if not received within 20 days of funding.</span></div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="note-box danger"><span class="note-icon">🚫</span><span><strong>Ineligible:</strong> Branded title, grey market, rental, livery, public transportation, auto loan refinances, commercial vehicles.</span></div>
        `
      }
    }
  },
  {
    id: 'td',
    name: 'TD Auto Finance',
    fullName: 'TD Auto Finance (TDAF)',
    abbr: 'TDA',
    colorClass: 'lc-td',
    docTitle: 'TDAF Retail Program Guide + Overview',
    effectiveDate: 'January 1, 2026',
    segment: 'near',
    segmentLabel: 'Near-Prime',
    ficoMin: null,
    ficoNotes: 'Automated scoring (9-tier system). No BK or repo within 36 months.',
    maxTerm: 84,
    maxMileage: '120,000 mi (gas, T1–6 under 72 mo)',
    maxLTV: '150%',
    gapMax: '$1,300',
    reserveStructure: '80/20 split; TDAF pays greater of reserve, flat fee, or enhanced flat fee automatically',
    chargebackWindow: '6 scheduled payments (not subject to chargeback after 6th payment due date)',
    uniqueFeature: 'BPS-based flat fee enhancement; 9 tiers; open 7 days/week; medium-duty truck program',
    bureaus: {
      primary: ['transunion'],
      note: 'TransUnion Auto FICO 08 via RouteOne & Dealertrack.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'Tiers & Credit',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Bureau</span><span class="info-val">TransUnion Auto FICO 08 (RouteOne & Dealertrack)</span></div>
            <div class="info-row"><span class="info-key">Scoring</span><span class="info-val">Automated — 9 tiers (T1–T9)</span></div>
            <div class="info-row"><span class="info-key">BK Restriction</span><span class="info-val">Ineligible if bankruptcy within 36 months</span></div>
            <div class="info-row"><span class="info-key">Repo Restriction</span><span class="info-val">Ineligible if repossession within 36 months</span></div>
            <div class="info-row"><span class="info-key">Cannabis Business</span><span class="info-val">Generally ineligible (exceptions with prior written notice)</span></div>
          </div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Application Requires</span><span class="info-val">Full name, DOB, SSN or ITIN, physical address (no PO Box without physical)</span></div>
            <div class="info-row"><span class="info-key">ID Copies</span><span class="info-val">Do NOT include copies of applicant ID in finance package sent to TDAF</span></div>
            <div class="info-row"><span class="info-key">POR Options</span><span class="info-val">Utility/phone bill (≤60 days); bank statement with address (≤30 days); tribal chapter letter</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">W2 Paystub</span><span class="info-val">Current, last 30 days, must have start/end date</span></div>
            <div class="info-row"><span class="info-key">W2 Alternative</span><span class="info-val">W2 from previous calendar year</span></div>
            <div class="info-row"><span class="info-key">Self-Employed</span><span class="info-val">Most recent tax return + 1099 + bank statements (last 3 months)</span></div>
            <div class="info-row"><span class="info-key">Other Income</span><span class="info-val">Contact Retail Credit: 1-800-200-1513</span></div>
          </div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Amount (per transaction)</span><span class="info-val">$250,000</span></div>
            <div class="info-row"><span class="info-key">Max Amount (per customer)</span><span class="info-val">$300,000</span></div>
            <div class="info-row"><span class="info-key">Min Amount (24–75 mo)</span><span class="info-val">$7,500 front-end</span></div>
            <div class="info-row"><span class="info-key">Min Amount (76–84 mo)</span><span class="info-val">$15,000</span></div>
            <div class="info-row"><span class="info-key">Max Mileage (gas, T1–6)</span><span class="info-val">120,000 (under 72 mo); 100,000 (73 mo+)</span></div>
            <div class="info-row"><span class="info-key">Max Mileage (T7–8)</span><span class="info-val">100,000</span></div>
            <div class="info-row"><span class="info-key">Diesel Max Mileage</span><span class="info-val">120,000</span></div>
            <div class="info-row"><span class="info-key">First Payment Window</span><span class="info-val">22–45 days</span></div>
            <div class="info-row"><span class="info-key">Approval Expiry</span><span class="info-val">30 days</span></div>
            <div class="info-row"><span class="info-key">Lien Perfection</span><span class="info-val">21 days</span></div>
            <div class="info-row"><span class="info-key">Title Receipt</span><span class="info-val">Within 90 days of contract date</span></div>
          </div>
          <table class="tier-table" style="margin-top:var(--space-4)">
            <thead><tr><th>Model Year</th><th>T1–T2</th><th>T3–T8</th><th>T9</th></tr></thead>
            <tbody>
              <tr><td>2024–2026</td><td>84 mo</td><td>84 mo</td><td>75 mo</td></tr>
              <tr><td>2021–2023</td><td>84 mo</td><td>75 mo</td><td>60 mo</td></tr>
              <tr><td>2020</td><td>72 mo</td><td>72 mo</td><td>60 mo</td></tr>
              <tr><td>2018–2019</td><td>72/66 mo</td><td>66/60 mo</td><td>48 mo</td></tr>
              <tr><td>2017</td><td>60 mo</td><td>60 mo</td><td>48 mo</td></tr>
            </tbody>
          </table>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">GAP Maximum</span><span class="info-val">$1,300 (state law may reduce)</span></div>
            <div class="info-row"><span class="info-key">GAP Min LTV</span><span class="info-val">70% front-end</span></div>
            <div class="info-row"><span class="info-key">Service Contract Max (T1–9)</span><span class="info-val">15% of invoice/book or $4,000 (whichever greater); up to $7,000 for T3–8 &lt;$70K</span></div>
            <div class="info-row"><span class="info-key">Dealer Self-Funded Warranty</span><span class="info-val">NOT eligible</span></div>
            <div class="info-row"><span class="info-key">Tire & Wheel</span><span class="info-val">✓ Eligible</span></div>
            <div class="info-row"><span class="info-key">Maintenance</span><span class="info-val">✓ Eligible</span></div>
            <div class="info-row"><span class="info-key">Backend by Book Value</span><span class="info-val">&lt;$10K: $2K | $10–$15K: $3K | $15–$20K: $3.5K–$4.5K | $20–$25K: $5K | &gt;$25K: 18–20%</span></div>
          </div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Standard Reserve</span><span class="info-val">80/20 split</span></div>
            <div class="info-row"><span class="info-key">Max Markup (24–72 mo)</span><span class="info-val">2.00%</span></div>
            <div class="info-row"><span class="info-key">Max Markup (73–84 mo)</span><span class="info-val">1.75%</span></div>
            <div class="info-row"><span class="info-key">Enhanced Flat</span><span class="info-val">TDAF automatically pays greater of standard reserve, flat fee, or enhanced flat fee</span></div>
            <div class="info-row"><span class="info-key">Chargeback</span><span class="info-val">Protected after 6 scheduled payments received and 6th payment due date reached</span></div>
          </div>
          <table class="tier-table" style="margin-top:var(--space-4)">
            <thead><tr><th>BPS Add</th><th>48–63 mo</th><th>64–72 mo</th><th>73–84 mo</th></tr></thead>
            <tbody>
              <tr><td>Buy Rate</td><td>1% / $500 max</td><td>—</td><td>—</td></tr>
              <tr><td>+100 BPS</td><td>3% / $1,500</td><td>2% / $3,000</td><td>—</td></tr>
              <tr><td>+150 BPS</td><td>4% / $2,000</td><td>3% / $4,500</td><td>3% / $4,500</td></tr>
              <tr><td>+200 BPS</td><td>5% / $2,500</td><td>4% / $6,000</td><td>4% / $6,000</td></tr>
              <tr><td>Max (64–72 mo)</td><td>—</td><td>5% / $7,500</td><td>—</td></tr>
            </tbody>
          </table>
          <div class="note-box success" style="margin-top:var(--space-3)"><span class="note-icon">✅</span><span>TDAF is open 7 days a week. Supports RouteOne Remote eSign and Dealertrack Remote Signing.</span></div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="note-box info"><span class="note-icon">🚛</span><span><strong>Medium-Duty Truck Program:</strong> New only (Dodge/Ram/Ford/GM/Mercedes/Nissan 1500–5500). GVWR ≤33,000 lbs. T1–T7; 72 mo max; 120% LTV (T1–5), 115% (T6–7).</span></div>
          <div class="note-box danger" style="margin-top:var(--space-3)"><span class="note-icon">🚫</span><span><strong>Ineligible:</strong> Salvage/lemon/factory buy-back titles, motorcycles, RVs, livery, EVs (non-major OEM), Suzuki, unrepaired hail damage, right-hand drive, van conversions, gray market, 2015 and older VW/Audi 2.0 TDI diesel (certain models).</span></div>
        `
      }
    }
  },
  {
    id: 'wellsfargo',
    name: 'Wells Fargo',
    fullName: 'Wells Fargo Auto',
    abbr: 'WFA',
    colorClass: 'lc-wells',
    docTitle: 'Dealer Program Reference Guide',
    effectiveDate: 'October 14, 2025',
    segment: 'prime',
    segmentLabel: 'Prime',
    ficoMin: null,
    ficoNotes: '6 tiers (Super Prime → Regular); specific FICO minimums per tier via callback. No thin file on 84-mo terms.',
    maxTerm: 84,
    maxMileage: '150,000 mi',
    maxLTV: '135%',
    gapMax: '$1,200',
    reserveStructure: 'Max compensation $5,000 per deal; structure communicated via callbacks',
    chargebackWindow: 'See callback',
    uniqueFeature: 'DACA/NPRA eligible; 150K mile limit; broadest backend matrix; no credit card down',
    bureaus: {
      primary: ['equifax','transunion','experian'],
      note: 'Pulls all three bureaus. Uses the middle score.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Tiers',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Tiers</span><span class="info-val">T1 Super Prime → T6 Regular (specific FICO cutoffs via callback)</span></div>
            <div class="info-row"><span class="info-key">84-Month Restriction</span><span class="info-val">No thin file or first-time buyers</span></div>
            <div class="info-row"><span class="info-key">DACA / NPRA</span><span class="info-val">✓ Eligible — valid SSN or ITIN; Form I-766/EAD (DACA); Form I-94 (NPRA)</span></div>
            <div class="info-row"><span class="info-key">ITIN Note</span><span class="info-val">ITIN assignment letter does NOT satisfy Proof of Legal Residency Status</span></div>
          </div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">POR (Within 60 Days)</span><span class="info-val">Billing stmts; mortgage docs; bank/account docs; employment letter on letterhead; 911 address letter; POI (through 2/28); tribal POR letter</span></div>
            <div class="info-row"><span class="info-key">POR (Older Than 60 Days)</span><span class="info-val">Professional mgmt lease; auto insurance policy (eff. 60+ days prior); renter's insurance; valid govt-issued ID</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">W2 Paystub Age</span><span class="info-val">Pay period end ≤30 days; W-2 and year-end paystubs acceptable through Feb 28</span></div>
            <div class="info-row"><span class="info-key">First 90 Days (Annualize)</span><span class="info-val">Remove OT/commission/bonus/tips from current earnings; YTD annualized</span></div>
            <div class="info-row"><span class="info-key">After 90 Days</span><span class="info-val">Only bonus income annualized</span></div>
            <div class="info-row"><span class="info-key">OT Requirement</span><span class="info-val">Employed ≥90 consecutive days same calendar year</span></div>
            <div class="info-row"><span class="info-key">Self-Employed / 1099</span><span class="info-val">Signed full tax return with all schedules; bank statements NOT acceptable</span></div>
            <div class="info-row"><span class="info-key">Military</span><span class="info-val">LES dated ≤30 days</span></div>
            <div class="info-row"><span class="info-key">Retirement Income</span><span class="info-val">Award letter, pension, or bank stmt from identifiable source; 1099-R acceptable through Feb 28</span></div>
          </div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">LTV (New & Used)</span><span class="info-val">135% (all tiers)</span></div>
            <div class="info-row"><span class="info-key">84-Mo LTV Restriction</span><span class="info-val">120% for T1/T2 only (PTI ≤13%)</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">150,000 miles</span></div>
            <div class="info-row"><span class="info-key">Min Amount (≤63 mo)</span><span class="info-val">$5,000.01</span></div>
            <div class="info-row"><span class="info-key">Min Amount (64+ mo)</span><span class="info-val">$7,500.01</span></div>
            <div class="info-row"><span class="info-key">First Payment Window</span><span class="info-val">19–45 days from contract date</span></div>
            <div class="info-row"><span class="info-key">Approval Expiry</span><span class="info-val">30 days</span></div>
          </div>
          <table class="tier-table" style="margin-top:var(--space-4)">
            <thead><tr><th>Vehicle Age</th><th>0–44,999 mi</th><th>45K–74,999 mi</th><th>75K–119,999 mi</th><th>120K–150K mi</th></tr></thead>
            <tbody>
              <tr><td>New</td><td>84 mo</td><td>—</td><td>—</td><td>—</td></tr>
              <tr><td>1 yr old</td><td>84 mo</td><td>75 mo</td><td>—</td><td>—</td></tr>
              <tr><td>2–3 yrs old</td><td>84 mo</td><td>75 mo</td><td>63 mo</td><td>51 mo</td></tr>
              <tr><td>4–7 yrs old</td><td>75 mo</td><td>75 mo</td><td>63 mo</td><td>51 mo</td></tr>
              <tr><td>8–9 yrs old</td><td>63 mo</td><td>63 mo</td><td>63 mo</td><td>51 mo</td></tr>
              <tr><td>10+ yrs old</td><td>51 mo</td><td>51 mo</td><td>51 mo</td><td>51 mo</td></tr>
            </tbody>
          </table>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Total Backend</span><span class="info-val">Greater of $6,000 or 20%; max $12,500 of adjusted collateral value</span></div>
            <div class="info-row"><span class="info-key">VSC</span><span class="info-val">Greater of $4,350 or 18% of adjusted collateral value</span></div>
            <div class="info-row"><span class="info-key">GAP</span><span class="info-val">$1,200 (both waiver and insurance); min 70% LTV (80% SC/IN; 70% CA)</span></div>
            <div class="info-row"><span class="info-key">Tire & Wheel</span><span class="info-val">Greater of $1,550 or 7%</span></div>
            <div class="info-row"><span class="info-key">Maintenance</span><span class="info-val">Greater of $2,350 or 15%</span></div>
            <div class="info-row"><span class="info-key">Windshield</span><span class="info-val">Greater of $2,000 or 3% (not financeable in KY, FL, SC)</span></div>
            <div class="info-row"><span class="info-key">Surface Protection</span><span class="info-val">$2,000 (front-end)</span></div>
            <div class="info-row"><span class="info-key">Anti-Theft</span><span class="info-val">$1,500 (front-end)</span></div>
            <div class="info-row"><span class="info-key">Key Replacement</span><span class="info-val">$1,000 (front-end)</span></div>
            <div class="info-row"><span class="info-key">PDR</span><span class="info-val">$1,500 (front-end)</span></div>
            <div class="info-row"><span class="info-key">Etch</span><span class="info-val">$500 (front-end)</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span>No deferred down payments. No credit card down payments. No cryptocurrency accepted for down payments.</span></div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Compensation</span><span class="info-val">$5,000 per funded contract</span></div>
            <div class="info-row"><span class="info-key">Structure</span><span class="info-val">Communicated via callbacks and funding notifications; updated periodically</span></div>
          </div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="note-box danger"><span class="note-icon">🚫</span><span><strong>Ineligible Makes/Models:</strong> Chamco, Daewoo, Fisker, Freightliner, Hummer (excl. EV), Isuzu, Mercury, Oldsmobile, Plymouth, Pontiac, Saab, Saturn, Suzuki, Ford F-450 to F-750, Dodge Ram 4500–5500, Chevy 4500–6500.</span></div>
          <div class="note-box danger" style="margin-top:var(--space-3)"><span class="note-icon">🚫</span><span><strong>Prohibited:</strong> Auto refinance loans, lease buyouts, cash-out contracts, commercial vehicles, Uber/Lyft vehicles.</span></div>
        `
      }
    }
  },
  {
    id: 'ally',
    name: 'Ally Financial',
    fullName: 'Ally Financial',
    abbr: 'ALY',
    colorClass: 'lc-ally',
    docTitle: 'Underwriting Policies & Provisions',
    effectiveDate: 'February 1, 2026',
    segment: 'prime',
    segmentLabel: 'Prime+',
    ficoMin: 520,
    ficoNotes: 'Retail min 520; Lease min 550. Tiers S, A, B, C, D, E. Max rates: New 24%, Used 25% (or state cap).',
    maxTerm: 84,
    maxMileage: '150,000 mi',
    maxLTV: '140%',
    gapMax: '$1,500 (&lt;$80K) / $2,000 (&gt;$80K)',
    reserveStructure: 'Structure via dealer callback; ADR Retail Bonus Reward effective Feb 1, 2026',
    chargebackWindow: 'See callback',
    uniqueFeature: 'SmartLease + ComTRAC lease; credit card down up to $5K; auction CPO $1K bonus; GAP Plus available',
    bureaus: {
      primary: ['equifax','transunion','experian'],
      note: 'Pulls all three bureaus. Uses the middle score.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Tiers',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Retail Min FICO</span><span class="info-val">520 (all tiers)</span></div>
            <div class="info-row"><span class="info-key">Lease Min FICO</span><span class="info-val">550 (all tiers)</span></div>
            <div class="info-row"><span class="info-key">Tiers (Prime)</span><span class="info-val">S, A, B, C</span></div>
            <div class="info-row"><span class="info-key">Tiers (Non-Prime)</span><span class="info-val">S, A, B, C, D, E</span></div>
            <div class="info-row"><span class="info-key">Max Rate (New)</span><span class="info-val">24.00% or state cap</span></div>
            <div class="info-row"><span class="info-key">Max Rate (Used)</span><span class="info-val">25.00% or state cap</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Consumer Max All-In Advance — Prime (FICO ≥620)</h4>
          <table class="tier-table">
            <thead><tr><th>Term Band</th><th>Tier S</th><th>Tier A</th><th>Tier B New</th><th>Tier B Used</th><th>Tier C New</th><th>Tier C Used</th></tr></thead>
            <tbody>
              <tr><td>≤63 mo</td><td>140%</td><td>135%</td><td>130%</td><td>135%</td><td>125%</td><td>130%</td></tr>
              <tr><td>64–75 mo</td><td>135%</td><td>130%</td><td>125%</td><td>130%</td><td>120%</td><td>125%</td></tr>
              <tr><td>76–84 mo</td><td>135%/130%</td><td>125%/120%</td><td colspan="2" style="text-align:center">115%</td><td colspan="2" style="text-align:center">N/A (used)</td></tr>
            </tbody>
          </table>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Consumer Max All-In Advance — Non-Prime (FICO &lt;620)</h4>
          <table class="tier-table">
            <thead><tr><th>Term Band</th><th>Tier S</th><th>Tier A</th><th>Tier B</th><th>Tier C</th><th>Tier D</th><th>Tier E</th></tr></thead>
            <tbody>
              <tr><td>≤72 mo</td><td>135%</td><td>130%</td><td>125%</td><td>120%</td><td>115%</td><td>115%</td></tr>
              <tr><td>73–75 mo</td><td>130%</td><td>125%</td><td>120%</td><td>115%</td><td>120%</td><td>—</td></tr>
              <tr><td>76–84 mo ⚠️</td><td>125%</td><td>120%</td><td>115%</td><td>115%</td><td colspan="2" style="text-align:center">—</td></tr>
            </tbody>
          </table>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">POR Options</span><span class="info-val">Utility bill, landline/cell phone bill (no prepaid), cable/internet, paystub, mortgage stmt, bank stmt, Ally acct stmt, real estate tax bill, credit card stmt, driver's license, HUD/mortgage closing, SSN docs with address, fixed income award/pension</span></div>
            <div class="info-row"><span class="info-key">Down Payment (Credit Card)</span><span class="info-val">✓ Up to $5,000; name on card must match buyer/co-buyer</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">W2 Paystub Age</span><span class="info-val">Pay date ≤60 days of application; must reflect YTD figures</span></div>
            <div class="info-row"><span class="info-key">Handwritten Checks</span><span class="info-val">4 most recent consecutive paystubs + bank stmts showing deposits</span></div>
            <div class="info-row"><span class="info-key">OT / Bonus</span><span class="info-val">Only when paystubs reflect 3 months of OT/bonus earnings</span></div>
            <div class="info-row"><span class="info-key">Self-Employed / 1099</span><span class="info-val">Current year signed tax return with all schedules; prior year acceptable through Apr 15</span></div>
            <div class="info-row"><span class="info-key">Child Support / Alimony</span><span class="info-val">Court award letter + last 4 consecutive payments OR payment history from Child Support Payment Center</span></div>
            <div class="info-row"><span class="info-key">Social Security</span><span class="info-val">Current year award letter, current SS check, current bank stmt, or prior year W-2 / 1099-R</span></div>
          </div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Retail Term</span><span class="info-val">84 months</span></div>
            <div class="info-row"><span class="info-key">Min All-In Amount Financed</span><span class="info-val">$5,000</span></div>
            <div class="info-row"><span class="info-key">Min for 76–84 mo</span><span class="info-val">$20,000</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">150,000 miles (by vehicle segment)</span></div>
            <div class="info-row"><span class="info-key">New / CSU-2020</span><span class="info-val">Max 84 months</span></div>
            <div class="info-row"><span class="info-key">Used 2019–2015</span><span class="info-val">Max 75 months*</span></div>
            <div class="info-row"><span class="info-key">Used 2014–2013</span><span class="info-val">Max 63 months**</span></div>
            <div class="info-row"><span class="info-key">Approval Expiry</span><span class="info-val">30 days</span></div>
            <div class="info-row"><span class="info-key">Submission Window</span><span class="info-val">Contracts not received within 15 days of contract date may be ineligible; complete within 20 days or subject to payoff</span></div>
            <div class="info-row"><span class="info-key">Auction Price (SmartAuction)</span><span class="info-val">Good for 120 days</span></div>
            <div class="info-row"><span class="info-key">Auction Price (Other)</span><span class="info-val">Good for 90 days</span></div>
            <div class="info-row"><span class="info-key">Lease Programs</span><span class="info-val">SmartLease, ComTRAC available</span></div>
          </div>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Total Aftermarket (&lt;$80K)</span><span class="info-val">Greater of $5,000 or 30% of EDC/AWV; max $10,000</span></div>
            <div class="info-row"><span class="info-key">Total Aftermarket (&gt;$80K)</span><span class="info-val">Greater of $5,000 or 30% of EDC/AWV; max $15,000</span></div>
            <div class="info-row"><span class="info-key">GAP (&lt;$80K)</span><span class="info-val">$1,500; min 70% LTV (80% for commercial/ComTRAC)</span></div>
            <div class="info-row"><span class="info-key">GAP (&gt;$80K)</span><span class="info-val">$2,000; not allowed in NY, DC</span></div>
            <div class="info-row"><span class="info-key">GAP Plus</span><span class="info-val">Available — all states except AK, DC, NE, NY, TX</span></div>
            <div class="info-row"><span class="info-key">Mechanical Service</span><span class="info-val">Greater of $5,000 or 15% of EDC/AWV</span></div>
            <div class="info-row"><span class="info-key">Maintenance</span><span class="info-val">Greater of $2,000 or 15%</span></div>
            <div class="info-row"><span class="info-key">Tire & Wheel</span><span class="info-val">Greater of $1,500 or 7%</span></div>
            <div class="info-row"><span class="info-key">Battery Protection (EV)</span><span class="info-val">Greater of $3,000 or 10% of EDC/AWV</span></div>
            <div class="info-row"><span class="info-key">Etch (&lt;$80K)</span><span class="info-val">$1,200</span></div>
            <div class="info-row"><span class="info-key">DAF</span><span class="info-val">$0–$795 (non-Champions Club); $0 or $500 (Champions Club)</span></div>
          </div>
        `
      },
      reserve: { icon: '💵', label: 'Reserve & Compensation', content: `
          <div class="note-box success" style="margin-bottom:var(--space-3)"><span class="note-icon">✅</span><span>Effective Feb 1, 2026: all prime &amp; non-prime contracts with DAF are eligible for the <strong>ADR Retail Bonus Reward</strong>. Rates returned electronically on the callback sheet.</span></div>

          <h4 style="margin:0 0 var(--space-2);font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;opacity:.7">Retail Dealer Participation — Prime &amp; Non-Prime (DFI by Amount Financed)</h4>
          <table class="tier-table">
            <thead>
              <tr><th>Min DFI &amp; Amt Financed</th><th>$150 flat<br><span style="font-weight:400;font-size:.7rem">$5K–$24,999</span></th><th>$250 flat<br><span style="font-weight:400;font-size:.7rem">$25K–$34,999</span></th><th>$350 flat<br><span style="font-weight:400;font-size:.7rem">$35K–$44,999</span></th><th>$450 flat<br><span style="font-weight:400;font-size:.7rem">$45K–$74,999</span></th><th>$500 flat<br><span style="font-weight:400;font-size:.7rem">$75K–$149,999</span></th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Max DFI — ≤60 mo</strong></td><td colspan="5" style="text-align:center">2.50%</td></tr>
              <tr><td><strong>Max DFI — 61–75 mo</strong></td><td colspan="5" style="text-align:center">2.00%</td></tr>
              <tr><td><strong>Max DFI — 76–84 mo</strong></td><td colspan="4" style="text-align:center">1.50%</td><td style="text-align:center">2.00% (D &amp; E tiers)</td></tr>
            </tbody>
          </table>

          <div class="info-grid" style="margin-top:var(--space-3)">
            <div class="info-row"><span class="info-key">Min Amount Financed</span><span class="info-val">$5,000</span></div>
            <div class="info-row"><span class="info-key">D &amp; E Tiers — All Terms</span><span class="info-val">2.00% Max DFI on all terms; flat scale applies</span></div>
            <div class="info-row"><span class="info-key">Dealer Acq. Fee (DAF)</span><span class="info-val">Up to $795</span></div>
            <div class="info-row"><span class="info-key">Chargeback Window</span><span class="info-val">See callback; contracts not received within 15 days may be ineligible</span></div>
            <div class="info-row"><span class="info-key">Rates subject to</span><span class="info-val">State statutory limits — refer to Program Notes</span></div>
          </div>
          <div class="note-box info" style="margin-top:var(--space-3)"><span class="note-icon">ℹ️</span><span>Maximum advance = % of balance financed <em>after</em> all cash down, rebates, trade equity, aftermarket products, TT&amp;L and fees. Flat schedule: $150 (5K–25K) · $250 (25K–35K) · $350 (35K–45K) · $450 (45K–75K) · $500 (75K–150K).</span></div>
        ` },
      vehicles: { icon: '🚗', label: 'Vehicle Eligibility', content: `<div class="note-box danger"><span class="note-icon">🚫</span><span><strong>Ineligible:</strong> Salvage titles, totaled vehicles, water/flood damaged, frame damaged, odometer rollback.</span></div>` }
    }
  },
  {
    id: 'fifththird',
    name: 'Fifth Third Bank',
    fullName: 'Fifth Third Bank — Auto',
    abbr: '5/3',
    colorClass: 'lc-fifth',
    docTitle: 'Consumer Auto Program Guide — Texas',
    effectiveDate: 'November 12, 2025',
    stateRestriction: 'Texas Only',
    segment: 'near',
    segmentLabel: 'Near-Prime',
    ficoMin: 650,
    ficoNotes: 'Min 650 for 2013+ units. Final buy rate determined by overall credit and deal structure.',
    maxTerm: 84,
    maxMileage: '140,000 mi',
    maxLTV: '140%',
    gapMax: '$1,850 or 5% of amount financed',
    reserveStructure: '3% at buy rate; 100% flat (no cap, no split); Elite bonus up to +0.75%',
    chargebackWindow: '3 payments or 120 days (whichever sooner)',
    uniqueFeature: 'Elite points program with enhanced reserve; guaranteed $4K backend; TX only; uses MSRP/JD Power Retail',
    bureaus: {
      primary: ['equifax','transunion','experian'],
      note: 'Pulls all three bureaus. Confirm bureau preference with Fifth Third rep.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Elite Program',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Minimum FICO</span><span class="info-val">650 (for 2013+ units)</span></div>
            <div class="info-row"><span class="info-key">Bureau</span><span class="info-val">Contact credit center for bureau details</span></div>
          </div>
          <div class="note-box info" style="margin-top:var(--space-3)"><span class="note-icon">⭐</span><span><strong>Elite Program:</strong> Earn points per booked contract (1 pt base, +1 for 2020 or older, +1 for 75+ mo, +1 for under 750 FICO). Elite (30–64 pts): +0.25% flat. Gold Elite (65–94 pts): +0.50% flat. Platinum Elite (95+ pts): +0.75% flat.</span></div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Restrictions',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">ID Requirement</span><span class="info-val">Valid driver's license AND SSN or ITIN required for all signers</span></div>
            <div class="info-row"><span class="info-key">No Trust Accounts</span><span class="info-val">✗ Not accepted</span></div>
            <div class="info-row"><span class="info-key">No Power of Attorney</span><span class="info-val">✗ Not accepted</span></div>
            <div class="info-row"><span class="info-key">Down Payment</span><span class="info-val">Must be cash or cash equivalent</span></div>
            <div class="info-row"><span class="info-key">Doc Fee Cap</span><span class="info-val">Not to exceed $399 (TX: $225+ requires specific TX regulation compliance)</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `<div class="note-box info"><span class="note-icon">ℹ️</span><span>Only income earned by the applicant(s) will be considered. Specific income stip documents are determined by the credit center on a deal-by-deal basis. Contact DDR or credit analyst for requirements. Down payments must be in cash or cash equivalent.</span></div>` },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Front-End Max LTV</span><span class="info-val">115% (includes doc fees and TT&L; excludes qualified backend)</span></div>
            <div class="info-row"><span class="info-key">Total LTV Max</span><span class="info-val">140%</span></div>
            <div class="info-row"><span class="info-key">Valuation Basis</span><span class="info-val">MSRP / JD Power Retail</span></div>
            <div class="info-row"><span class="info-key">Max Amount Funded</span><span class="info-val">$100,000 (plus allowable backend)</span></div>
            <div class="info-row"><span class="info-key">Max MSRP / JD Power</span><span class="info-val">$150,000</span></div>
            <div class="info-row"><span class="info-key">Min Amount Financed</span><span class="info-val">$6,000 (excluding backend)</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">140,000 miles</span></div>
            <div class="info-row"><span class="info-key">Max First Payment</span><span class="info-val">45 days</span></div>
            <div class="info-row"><span class="info-key">Approval Expiry</span><span class="info-val">30 days from original application date</span></div>
          </div>
          <table class="tier-table" style="margin-top:var(--space-4)">
            <thead><tr><th>Model Year</th><th>Available Terms</th><th>Min Value Req</th></tr></thead>
            <tbody>
              <tr><td>2024–2026</td><td>24–84 months</td><td>$20K for 76+ mo</td></tr>
              <tr><td>2021–2023</td><td>24–75 months</td><td>$12.5K for 67+ mo</td></tr>
              <tr><td>2018–2020</td><td>24–72 months</td><td>$10K for 61+ mo</td></tr>
              <tr><td>2016–2017</td><td>24–63 months</td><td>—</td></tr>
              <tr><td>2013–2015</td><td>24–60 months</td><td>—</td></tr>
            </tbody>
          </table>
          <div class="note-box warn" style="margin-top:var(--space-3)"><span class="note-icon">⚠️</span><span>Texas only. Black Book not accepted for valuation. Hail damage: will finance up to $3,000 unrepaired if approved vehicle value reduced by damage amount.</span></div>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Total Backend (Standard)</span><span class="info-val">20% of MSRP/JD Power Retail; max $7,500; guaranteed min $4,000</span></div>
            <div class="info-row"><span class="info-key">Total Backend (Elite)</span><span class="info-val">25% of MSRP/JD Power Retail; max $10,000; guaranteed min $4,000</span></div>
            <div class="info-row"><span class="info-key">VSC</span><span class="info-val">Greater of $3,500 or 15% of MSRP/JD Power Retail (24 mo minimum)</span></div>
            <div class="info-row"><span class="info-key">Maintenance</span><span class="info-val">Greater of $1,500 or 10%; prepaid scheduled maintenance only</span></div>
            <div class="info-row"><span class="info-key">GAP</span><span class="info-val">Lesser of $1,850 or 5% of amount financed; min 70% LTV; $50 admin fee to reserve stmt</span></div>
            <div class="info-row"><span class="info-key">CLAH</span><span class="info-val">✗ No longer accepted (front-end or backend)</span></div>
            <div class="info-row"><span class="info-key">EV Charging Stations</span><span class="info-val">✗ Not eligible for financing</span></div>
          </div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Buy Rate Flat</span><span class="info-val">3% — 100% to dealer (no cap, no split)</span></div>
            <div class="info-row"><span class="info-key">Chargeback</span><span class="info-val">Reserve charged back if paid off before 3 payments or 120 days; product refunds charged back</span></div>
          </div>
          <table class="tier-table" style="margin-top:var(--space-4)">
            <thead><tr><th>Rate Adjustment</th><th>Flat %</th></tr></thead>
            <tbody>
              <tr><td>+1.00%</td><td>5.00%</td></tr>
              <tr><td>+0.75%</td><td>4.50%</td></tr>
              <tr><td>+0.50%</td><td>4.00%</td></tr>
              <tr><td>+0.25%</td><td>3.50%</td></tr>
              <tr><td>Buy Rate</td><td>3.00%</td></tr>
              <tr><td>−0.25%</td><td>2.50%</td></tr>
              <tr><td>−0.50%</td><td>2.00%</td></tr>
              <tr><td>−1.00%</td><td>1.00%</td></tr>
              <tr><td>−1.25%</td><td>0.00%</td></tr>
            </tbody>
          </table>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Flat Payout Examples by Amount Financed</h4>
          <table class="mini-table">
            <thead><tr><th>Amt Financed</th><th>Buy Rate (3%)</th><th>+0.50% (4%)</th><th>+1.00% (5%)</th></tr></thead>
            <tbody>
              <tr><td>$10,000</td><td>$300</td><td>$400</td><td>$500</td></tr>
              <tr><td>$15,000</td><td>$450</td><td>$600</td><td>$750</td></tr>
              <tr><td>$20,000</td><td>$600</td><td>$800</td><td>$1,000</td></tr>
              <tr><td>$25,000</td><td>$750</td><td>$1,000</td><td>$1,250</td></tr>
              <tr><td>$30,000</td><td>$900</td><td>$1,200</td><td>$1,500</td></tr>
              <tr><td>$40,000</td><td>$1,200</td><td>$1,600</td><td>$2,000</td></tr>
              <tr><td>$50,000</td><td>$1,500</td><td>$2,000</td><td>$2,500</td></tr>
            </tbody>
          </table>
          <div class="note-box info" style="margin-top:var(--space-2)"><span class="note-icon">ℹ️</span><span>100% flat to dealer (no split, no cap). Elite program bonus adds up to +0.75% for qualifying point tiers. Chargeback within 3 payments or 120 days.</span></div>
        `
      },
      vehicles: { icon: '🚗', label: 'Vehicle Eligibility', content: `<div class="note-box danger"><span class="note-icon">🚫</span><span><strong>Ineligible:</strong> Branded titles, gray market, frame damage, salvage, lemon law, flood, commercial use (cargo van, livery, delivery, rideshare Uber/Lyft), over 1 ton, RVs, watercraft, ATVs, motorcycles. No trust accounts, no POA, no straw purchases, no brokered contracts, no business-titled loans. Marijuana business income not considered.</span></div>` }
    }
  },
  {
    id: 'gls',
    name: 'GLS / Global Lending',
    fullName: 'GLS (Global Lending Services)',
    abbr: 'GLS',
    colorClass: 'lc-gls',
    docTitle: 'Buying Guidelines / Loan Structure / Program Guidelines',
    effectiveDate: '2025 (v49)',
    segment: 'sub',
    segmentLabel: 'Sub-Prime',
    ficoMin: 400,
    ficoNotes: '400–700 range; zero FICO considered. No self-employed / 1099. Min $1,800/mo income.',
    maxTerm: 78,
    maxMileage: '180,000 mi',
    maxLTV: '135%',
    gapMax: '$1,100',
    reserveStructure: 'T1–T2: up to 3% flat; T3–T4: up to 2%; Select: up to 4% — NO CHARGEBACKS',
    chargebackWindow: 'NO CHARGEBACKS',
    uniqueFeature: '15-second approvals 24/7/365; no chargebacks; self-employed/1099 NOT accepted; 180K mile limit',
    bureaus: {
      primary: ['equifax'],
      note: 'Primarily Equifax. Confirm with GLS rep for any state exceptions.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Credit',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Score Range Considered</span><span class="info-val">400–700 (zero FICO also considered)</span></div>
            <div class="info-row"><span class="info-key">What to Avoid</span><span class="info-val">Self-employed / 1099 earners; open bankruptcies; repos in past 4 months</span></div>
            <div class="info-row"><span class="info-key">Dealership Employees</span><span class="info-val">GLS does not accept sales, management, or F&I personnel</span></div>
            <div class="info-row"><span class="info-key">Max PTI</span><span class="info-val">24%</span></div>
          </div>
          <div class="note-box success" style="margin-top:var(--space-3)"><span class="note-icon">⚡</span><span><strong>Approvals as fast as 15 seconds, 24/7/365.</strong> Clean deals fund in 48 hours. No book-to-look requirements. Current paystub + current utility bill + 3 references = funds your deal.</span></div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">ITIN</span><span class="info-val">✓ Accepted</span></div>
            <div class="info-row"><span class="info-key">POR (Single Doc)</span><span class="info-val">Utility, power, water, cable, or garbage bill tying service to physical street address</span></div>
            <div class="info-row"><span class="info-key">POR (Two Docs)</span><span class="info-val">Any two of: bank stmt, cell phone bill (no prepaid), credit card stmt, driver's license, or paystub — all must verify physical street address</span></div>
            <div class="info-row"><span class="info-key">Permanent Residence Required</span><span class="info-val">Physical street address; must be permanent residence</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">W2 Employees</span><span class="info-val">Most recent paystub ≤30 days of contract date</span></div>
            <div class="info-row"><span class="info-key">Part-Time / Temp</span><span class="info-val">Must be W-2; minimum 6 months on job</span></div>
            <div class="info-row"><span class="info-key">Self-Employed / 1099</span><span class="info-val">✗ NOT ACCEPTED</span></div>
            <div class="info-row"><span class="info-key">Child Support / Alimony</span><span class="info-val">State agency or court order + last 3 months consecutive bank stmts</span></div>
            <div class="info-row"><span class="info-key">SSI / Disability / Pension</span><span class="info-val">Valid award letter + last 3 months consecutive bank stmts</span></div>
            <div class="info-row"><span class="info-key">SSI / Disability Gross-Up</span><span class="info-val">+115% (pension treated as net)</span></div>
            <div class="info-row"><span class="info-key">Minimum Income</span><span class="info-val">$1,800/month</span></div>
          </div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Front-End LTV</span><span class="info-val">Up to 125%</span></div>
            <div class="info-row"><span class="info-key">Total LTV</span><span class="info-val">Up to 135%</span></div>
            <div class="info-row"><span class="info-key">Min Loan Amount</span><span class="info-val">$7,000</span></div>
            <div class="info-row"><span class="info-key">Max Loan Amount</span><span class="info-val">$55,000</span></div>
            <div class="info-row"><span class="info-key">Contract Fee</span><span class="info-val">$199</span></div>
            <div class="info-row"><span class="info-key">Acquisition Fee</span><span class="info-val">As low as $0</span></div>
            <div class="info-row"><span class="info-key">Rates As Low As</span><span class="info-val">9.95%</span></div>
            <div class="info-row"><span class="info-key">Approval Expiry</span><span class="info-val">30 days</span></div>
            <div class="info-row"><span class="info-key">Max Vehicle Age</span><span class="info-val">12 years</span></div>
          </div>
          <table class="tier-table" style="margin-top:var(--space-4)">
            <thead><tr><th>Mileage Range</th><th>Max Term</th></tr></thead>
            <tbody>
              <tr><td>0–20,000 mi</td><td>78 mo (Select) / 75 mo (T1–T4)</td></tr>
              <tr><td>20,001–120,000 mi</td><td>72 months</td></tr>
              <tr><td>120,001–180,000 mi</td><td>66 months</td></tr>
            </tbody>
          </table>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">GAP Maximum</span><span class="info-val">$1,100 or state max (lesser); min 80% front-end LTV; not allowed in MA, NY</span></div>
            <div class="info-row"><span class="info-key">Warranty Maximum</span><span class="info-val">$3,500 (24 mo / 24K mi minimum; must cover seals and gaskets)</span></div>
            <div class="info-row"><span class="info-key">Total Backend</span><span class="info-val">Up to $4,600</span></div>
            <div class="info-row"><span class="info-key">Select Program Backend</span><span class="info-val">Up to 4%</span></div>
          </div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">T1–T2 Flat</span><span class="info-val">Up to 3% of front-end</span></div>
            <div class="info-row"><span class="info-key">T3–T4 Flat</span><span class="info-val">Up to 2% of front-end</span></div>
            <div class="info-row"><span class="info-key">Select Tier Flat</span><span class="info-val">Up to 4% of front-end</span></div>
            <div class="info-row"><span class="info-key">Chargebacks</span><span class="info-val" style="color: var(--color-green); font-weight:700">✓ NO CHARGEBACKS</span></div>
            <div class="info-row"><span class="info-key">Flat Eligibility Window</span><span class="info-val">Contracts received within 20 days of initial application receipt</span></div>
          </div>
          <div class="note-box success" style="margin-top:var(--space-3)"><span class="note-icon">✅</span><span>GLS offers NO chargebacks — one of the very few lenders to guarantee dealer compensation without clawback. Down payment must be cash or actual cash value of trade (no hold checks, borrowed funds, or credit cards).</span></div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="note-box info" style="margin-bottom:var(--space-3)"><span class="note-icon">🔋</span><span><strong>EV Eligible (max 6 yrs / 75K mi):</strong> Tesla Model 3/Y/X/S, Chevrolet Bolt, Ford Mustang Mach-E, Nissan Leaf/Ariya, Hyundai Ioniq/Kona, Kia EV6.</span></div>
          <div class="note-box danger"><span class="note-icon">🚫</span><span><strong>Ineligible:</strong> Discontinued makes, Smart car, weather damaged, branded title, remanufactured title, heavy duty (non-eligible), non-listed EVs, modified vehicles, grey market, salvage, commercial use, rideshare (Uber/Lyft/taxi), manufacturer buybacks, vehicles not in JD Power/KBB.</span></div>
        `
      }
    }
  },
  {
    id: 'capitalone',
    name: 'Capital One',
    fullName: 'Capital One Auto Finance',
    abbr: 'CAP',
    colorClass: 'lc-capone',
    docTitle: 'Executive Diamond Partner Program Guidelines',
    effectiveDate: 'January 2026',
    segment: 'all',
    segmentLabel: 'All Tiers (0–9)',
    ficoMin: null,
    ficoNotes: 'Tiers 0–9 (expanded access); no published FICO minimums — all deals checked via Dealer Navigator.',
    maxTerm: 84,
    maxMileage: '200,000 mi',
    maxLTV: '175%',
    gapMax: '$1,200',
    reserveStructure: 'Up to 2.5% (≤60 mo) / 2% (≤75 mo) / 1.5% (76+ mo); flat $100–$300 at buy rate',
    chargebackWindow: 'See Dealer Navigator callback',
    uniqueFeature: 'Auto Navigator pre-qualified leads; widest mileage (200K); lowest min financed ($2K); 15-yr vehicle age',
    bureaus: {
      primary: ['equifax','transunion','experian'],
      note: 'Pulls all three bureaus. Uses the middle score.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'Tiers & Credit',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Tier System</span><span class="info-val">Tiers 0 through 9 (expanded access)</span></div>
            <div class="info-row"><span class="info-key">How to Submit</span><span class="info-val">Capital One Dealer Navigator — all deals checked for best callback</span></div>
            <div class="info-row"><span class="info-key">Min Income</span><span class="info-val">$1,500/month</span></div>
            <div class="info-row"><span class="info-key">Thin File</span><span class="info-val">$1,000 min income for &lt;2 yrs on file or &lt;3 trade lines</span></div>
            <div class="info-row"><span class="info-key">NDI Requirement</span><span class="info-val">Income − (rent/mortgage + auto payment + living expenses + debt) must be ≥$50</span></div>
          </div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Down Payments',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">T0–T5 Min Down</span><span class="info-val">$1,000 for &lt;4 yrs on file or &lt;4 trade lines</span></div>
            <div class="info-row"><span class="info-key">T0–T1 Min Down</span><span class="info-val">$1,000</span></div>
            <div class="info-row"><span class="info-key">Sales Price Rule</span><span class="info-val">Sales price cannot exceed book if ≥$13K when cash down + trade ≥$6K</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `<div class="note-box info"><span class="note-icon">ℹ️</span><span>Income may be subject to verification. Minimum $1,500/month ($1,000 additional minimum for thin file applicants). NDI calculation: Income minus (rent/mortgage + auto payment + estimated living expenses + debt obligations) must be at least $50.</span></div>`
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">LTV (Prime, Book ≥$25K)</span><span class="info-val">Up to 120%</span></div>
            <div class="info-row"><span class="info-key">LTV (Non-Prime, Book ≥$25K)</span><span class="info-val">Up to 120%</span></div>
            <div class="info-row"><span class="info-key">LTV (Non-Prime, Book &lt;$25K)</span><span class="info-val">Up to 130%</span></div>
            <div class="info-row"><span class="info-key">Total LTV (Book ≥$10K)</span><span class="info-val">Up to 150%</span></div>
            <div class="info-row"><span class="info-key">Total LTV (Book &lt;$10K)</span><span class="info-val">Up to 175%</span></div>
            <div class="info-row"><span class="info-key">Max Loan (Prime)</span><span class="info-val">$75,000</span></div>
            <div class="info-row"><span class="info-key">Max Loan (Subprime)</span><span class="info-val">$55,000</span></div>
            <div class="info-row"><span class="info-key">Min Amount Financed</span><span class="info-val">$2,000 front-end</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">200,000 miles</span></div>
            <div class="info-row"><span class="info-key">Max Vehicle Age</span><span class="info-val">15 years</span></div>
            <div class="info-row"><span class="info-key">Vehicles 13+ Years</span><span class="info-val">Maximum 48 months</span></div>
          </div>
          <table class="tier-table" style="margin-top:var(--space-4)">
            <thead><tr><th>Mileage</th><th>T0–T5 Max Term</th><th>T6–T9 Max Term</th></tr></thead>
            <tbody>
              <tr><td>Under 80K mi</td><td>84 mo (if ≤5 yrs old and &gt;$20K)</td><td>75 mo</td></tr>
              <tr><td>80K–100K mi</td><td>75 mo</td><td>75 mo</td></tr>
              <tr><td>100K–150K mi</td><td>72 mo</td><td>72 mo</td></tr>
              <tr><td>150K–200K mi</td><td>48 mo</td><td>48 mo</td></tr>
            </tbody>
          </table>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">GAP Max</span><span class="info-val">$1,200 or state max (T0–T5); not listed for T6–T9</span></div>
            <div class="info-row"><span class="info-key">VSC T0</span><span class="info-val">Greater of $2,000 or 15% of book value (to $7,000)</span></div>
            <div class="info-row"><span class="info-key">VSC T1</span><span class="info-val">Greater of $2,000 or 25% of book; up to $8,000</span></div>
            <div class="info-row"><span class="info-key">VSC T2</span><span class="info-val">Up to $6,000</span></div>
            <div class="info-row"><span class="info-key">VSC T3</span><span class="info-val">Up to $5,000</span></div>
            <div class="info-row"><span class="info-key">VSC T4</span><span class="info-val">Up to $4,000</span></div>
            <div class="info-row"><span class="info-key">VSC T5</span><span class="info-val">Up to $3,000</span></div>
            <div class="info-row"><span class="info-key">VSC T6</span><span class="info-val">Up to 20%</span></div>
            <div class="info-row"><span class="info-key">VSC T7–T9</span><span class="info-val">None listed</span></div>
            <div class="info-row"><span class="info-key">VSC Min Coverage</span><span class="info-val">2 years / 24,000 miles to qualify as backend</span></div>
          </div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Participation (≤60 mo)</span><span class="info-val">Up to 2.5%</span></div>
            <div class="info-row"><span class="info-key">Participation (≤75 mo)</span><span class="info-val">Up to 2.0%</span></div>
            <div class="info-row"><span class="info-key">Participation (76+ mo)</span><span class="info-val">Up to 1.5%</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;opacity:.7">Flat Fee Schedule — Buy Rate (by Amount Financed)</h4>
          <table class="tier-table">
            <thead><tr><th>Amount Financed</th><th>Flat @ Buy Rate</th></tr></thead>
            <tbody>
              <tr><td>$10,000 – $14,999</td><td>$100</td></tr>
              <tr><td>$15,000 – $19,999</td><td>$150</td></tr>
              <tr><td>$20,000 – $24,999</td><td>$200</td></tr>
              <tr><td>$25,000 – $29,999</td><td>$250</td></tr>
              <tr><td>$30,000+</td><td>$300</td></tr>
            </tbody>
          </table>
          <div class="info-grid" style="margin-top:var(--space-3)">
            <div class="info-row"><span class="info-key">Restriction</span><span class="info-val">Participation or flat cannot exceed the finance charge from Capital One</span></div>
          </div>
          <div class="note-box info" style="margin-top:var(--space-3)"><span class="note-icon">📱</span><span><strong>Auto Navigator:</strong> Capital One pre-qualified leads via Auto Navigator, dealer website, and online platforms. Access for all tiers 0–9; up to 84 months for 0–50K miles on T0–T5.</span></div>
        `
      },
      vehicles: { icon: '🚗', label: 'Vehicle Eligibility', content: `<div class="note-box info"><span class="note-icon">✅</span><span>Accepts vehicles up to 15 years old and 200,000 miles. Widest acceptance in the lender lineup for older/higher-mileage vehicles.</span></div>` }
    }
  },
  {
    id: 'westlake',
    name: 'Westlake Financial',
    fullName: 'WLF (Westlake Financial)',
    abbr: 'WLF',
    colorClass: 'lc-westlake',
    docTitle: 'Program Guidelines v.120925_2',
    effectiveDate: 'January 2026',
    segment: 'deep',
    segmentLabel: 'Deep Sub-Prime',
    ficoMin: null,
    ficoNotes: 'Determined by Buy Program. Rate markup available for 600+. Accepts open bankruptcies with stips.',
    maxTerm: null,
    maxMileage: '150,000 mi (no participation above)',
    maxLTV: 'Determined by Buy Program',
    gapMax: 'Determined by Buy Program',
    reserveStructure: 'Up to 2% markup (600+ FICO); 65/35 split (≤60 mo); no chargebacks on markup',
    chargebackWindow: 'No chargebacks on rate markup',
    uniqueFeature: 'TurboPass income verification; cash income accepted; open bankruptcies with stips; foreign ID / matriculas accepted; branded/salvage vehicles eligible',
    bureaus: {
      primary: ['equifax','transunion','experian'],
      note: 'Pulls all three bureaus. Uses the middle score.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'Credit Flexibility',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Rate Markup Eligibility</span><span class="info-val">Credit score 600+ (up to 2% markup)</span></div>
            <div class="info-row"><span class="info-key">Open BK (Chapter 7)</span><span class="info-val">✓ Accepted — requires proof '341 Meeting of Creditors' completed</span></div>
            <div class="info-row"><span class="info-key">Open BK (Chapter 13)</span><span class="info-val">✓ Accepted — requires signed letter from Ch. 13 trustee authorizing more debt</span></div>
            <div class="info-row"><span class="info-key">Discharged / Dismissed BK</span><span class="info-val">✓ Acceptable</span></div>
            <div class="info-row"><span class="info-key">Ineligible Customers</span><span class="info-val">Prior Westlake/Wilshire/Western Funding/ALPS repo (unless Buy Program explicitly approves); temporary residence (hotel/motel); Washington D.C. residents</span></div>
            <div class="info-row"><span class="info-key">Delinquent Mortgage</span><span class="info-val">Additional stipulation may be requested</span></div>
          </div>
          <div class="note-box warn" style="margin-top:var(--space-3)"><span class="note-icon">⚠️</span><span>Suspended or revoked driver's license is NOT accepted. No customers at temporary residences (hotels, motels, group homes, campgrounds).</span></div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID Types Accepted',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Accepted IDs</span><span class="info-val">State driver's license/ID; foreign ID (passport, matricula consular, consular ID*); Occupational License; Green Card; DHS/State Dept ID</span></div>
            <div class="info-row"><span class="info-key">Foreign IDs Note</span><span class="info-val">Accepted except in states where law prohibits vehicle registration with foreign IDs</span></div>
            <div class="info-row"><span class="info-key">Not Accepted</span><span class="info-val">International Driver's Licenses</span></div>
            <div class="info-row"><span class="info-key">Expired ID</span><span class="info-val">Accepted at Credit Analyst or Manager discretion</span></div>
            <div class="info-row"><span class="info-key">POR Age</span><span class="info-val">Within 45 days of contract date; cannot be past due</span></div>
            <div class="info-row"><span class="info-key">POR Options</span><span class="info-val">Utility bill (gas/electric/water/cable/satellite TV); phone bill; checking account stmt; TurboPass (90 days transaction history); major credit card stmt</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">W2 Paystub</span><span class="info-val">Comp paystub with YTD; printed paystub no YTD; TurboPass Payroll report (direct deposits)</span></div>
            <div class="info-row"><span class="info-key">OT Restriction</span><span class="info-val">OT not counted on paystubs dated before April 1 or with &lt;3 months employment</span></div>
            <div class="info-row"><span class="info-key">Self-Employed (Personal)</span><span class="info-val">3 most recent personal bank stmts (full transaction detail, customer address; consistent deposits; positive ending balance)</span></div>
            <div class="info-row"><span class="info-key">Self-Employed (Business)</span><span class="info-val">3 most recent business bank stmts + business license or articles of incorporation</span></div>
            <div class="info-row"><span class="info-key">TurboPass (Self-Employed)</span><span class="info-val">TurboPass Bravo report; monthly income = 'baseline' income; must have positive average ending balance</span></div>
            <div class="info-row"><span class="info-key">Cash Income</span><span class="info-val">✓ Accepted — job letter or front-and-back images of cashed check + proof of business (website, Yelp, etc.). Tipping/service industries (landscaping, construction, housekeeping).</span></div>
            <div class="info-row"><span class="info-key">Fixed Income</span><span class="info-val">SSI, child support, foster care, IHSS, disability award letter; trust/annuity; student financial aid award</span></div>
            <div class="info-row"><span class="info-key">Military</span><span class="info-val">Leave and Earnings Statement (LES)</span></div>
          </div>
          <div class="note-box warn" style="margin-top:var(--space-3)"><span class="note-icon">⚠️</span><span>Transfers from savings/brokerage/money market accounts and one-time deposits (tax refunds, insurance payouts) do NOT count as income. Self-employed surcharge: $350 (Standard) or $250 (Gold/Platinum) if avg ending balance below car payment.</span></div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>All LTV limits, terms, and rates are determined by Westlake's proprietary <strong>Buy Program</strong> on a deal-by-deal basis. Standard max term and LTV per Buy Program approval.</span></div>
          <div class="info-grid" style="margin-top:var(--space-4)">
            <div class="info-row"><span class="info-key">Max Mileage (for participation)</span><span class="info-val">150,000 miles (no participation above this)</span></div>
            <div class="info-row"><span class="info-key">New Car Definition</span><span class="info-val">Prior-year or current-year, &lt;200 miles; Buy Program applies % adjustment by make/year</span></div>
            <div class="info-row"><span class="info-key">Recontract Trigger</span><span class="info-val">Contract received by Westlake &gt;30 days after contract date OR within 5 days of first payment due date</span></div>
            <div class="info-row"><span class="info-key">Deferred Down Max</span><span class="info-val">$500 (no credit card; certified funds may be required)</span></div>
            <div class="info-row"><span class="info-key">Insurance Waiver</span><span class="info-val">ATPI waived if amount financed ≤$6,500</span></div>
          </div>
        `
      },
      backend: {
        icon: '🏷️',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Products Allowed</span><span class="info-val">GAP Waivers, Extended Service Contracts, Prepaid Maintenance, Tire & Wheel, other ancillary products</span></div>
            <div class="info-row"><span class="info-key">Activation Deadline</span><span class="info-val">All products activated within 30 days of retail installment contract date (Secure One and KMIS GAP excluded)</span></div>
            <div class="info-row"><span class="info-key">Anti-Theft Max</span><span class="info-val">$1,000</span></div>
            <div class="info-row"><span class="info-key">Short-Term VSC (&lt;6 mo)</span><span class="info-val">Max $1,000</span></div>
            <div class="info-row"><span class="info-key">Short-Term VSC (6–11 mo)</span><span class="info-val">Max $1,500</span></div>
            <div class="info-row"><span class="info-key">Backend Limits</span><span class="info-val">See specific Buy Program Approval for backend caps</span></div>
          </div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Rate Markup</span><span class="info-val">Up to 2% for credit scores 600+</span></div>
            <div class="info-row"><span class="info-key">Chargebacks on Markup</span><span class="info-val" style="color: var(--color-green); font-weight:700">✓ NO CHARGEBACKS on markup</span></div>
            <div class="info-row"><span class="info-key">Split Structure</span><span class="info-val">Up to 65/35 for ≤60 months (may vary by state)</span></div>
            <div class="info-row"><span class="info-key">No Participation On</span><span class="info-val">TMU vehicles; other branded vehicles; vehicles &gt;150K miles</span></div>
          </div>
          <div class="note-box success" style="margin-top:var(--space-3)"><span class="note-icon">✅</span><span>NO CHARGEBACKS on rate markup. Westlake's Buy Program determines all parameters on a deal-by-deal basis. Rate buy-down option available.</span></div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="note-box success" style="margin-bottom:var(--space-3)"><span class="note-icon">✅</span><span><strong>Branded/Salvage Vehicles:</strong> WLF may finance salvage, junk, rebuilt, water damaged, storm damaged, lemon, crash test vehicles IF approved by Buy Program. (Not in MA, NY, Puerto Rico.)</span></div>
          <div class="note-box info"><span class="note-icon">🏍️</span><span><strong>Powersports:</strong> May approve motorcycles, ATVs, side-by-sides, personal watercraft (see Powersports Program).</span></div>
          <div class="note-box info" style="margin-top:var(--space-3)"><span class="note-icon">🏎️</span><span><strong>Specialty:</strong> Recreational, commercial, classic, highline/exotic vehicles available (see website).</span></div>
          <div class="note-box warn" style="margin-top:var(--space-3)"><span class="note-icon">⚠️</span><span>No participation on TMU (True Mileage Unknown), other branded titles, or vehicles over 150K miles.</span></div>
        `
      }
    }
  },
  // ── KIA FINANCE ────────────────────────────────────────────
  {
    id: 'kia',
    name: 'Kia Finance',
    fullName: 'Kia Finance America',
    abbr: 'KFA',
    colorClass: 'lc-kia',
    docTitle: 'LTV Advance & Backend Guidelines',
    effectiveDate: 'Q1 2026',
    segment: 'near',
    segmentLabel: 'Near-Prime',
    ficoMin: 580,
    ficoNotes: 'Tiered LTV by FICO band. Loyalty program upgrades tier. Terms 12–75 mo and 76+ mo have separate LTV grids.',
    maxTerm: 84,
    maxMileage: 'N/A',
    maxLTV: '150%',
    gapMax: '$1,500',
    reserveStructure: 'Tiered — 680+ gets 20% or $5K backend; <680 gets 16% or $4K',
    chargebackWindow: 'N/A',
    uniqueFeature: 'Loyalty tier upgrades (up to +1 tier); separate LTV grids for 12–75 mo vs 76+ mo',
    bureaus: {
      primary: ['equifax','transunion','experian'],
      note: 'Confirm bureau with Kia Finance rep — not specified in current program sheet.',
      stateMap: {}
    },
    contactNumber: null,
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Credit',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Minimum Score</span><span class="info-val">Below 580 (90% LTV)</span></div>
            <div class="info-row"><span class="info-key">Tiers (12–75 mo)</span><span class="info-val">&lt;580: 90% | 580–599: 95% | 600–619: 100% | 620–639: 105% | 640–659: 115% | 660–679: 125% | 680–739: 135% | 740+: 150%</span></div>
            <div class="info-row"><span class="info-key">Tiers (76+ mo)</span><span class="info-val">&lt;580: 90% | 580–639: 95% | 640–659: 105% | 660–679: 115% | 680+: 120%</span></div>
            <div class="info-row"><span class="info-key">Loyalty — Tier 2 & 3</span><span class="info-val">Upgrade to Tier 1</span></div>
            <div class="info-row"><span class="info-key">Loyalty — Tier 4</span><span class="info-val">Upgrade to Tier 2</span></div>
            <div class="info-row"><span class="info-key">Loyalty — Tier 5</span><span class="info-val">Upgrade to Tier 3</span></div>
            <div class="info-row"><span class="info-key">Loyalty — Tiers 6–8</span><span class="info-val">Upgrade to Tier 4</span></div>
            <div class="info-row"><span class="info-key">Loyalty Requirement</span><span class="info-val">12 months / Max 1×30-day late / No 60-day late</span></div>
            <div class="info-row"><span class="info-key">LTV & PTI Basis</span><span class="info-val">Based on initial credit score (not upgraded tier)</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>Loyalty program upgrades the customer's pricing tier but LTV and PTI are always calculated using the <strong>initial credit score</strong>, not the upgraded tier.</span></div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Accepted ID</span><span class="info-val">Valid driver's license or state-issued ID</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span>Additional ID/residency details not provided in current program sheet. Confirm with Kia Finance rep.</span></div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">PTI Basis</span><span class="info-val">Calculated on initial credit score tier</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span>Specific income documentation requirements not included in current program sheet. Confirm with Kia Finance rep.</span></div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Term Range</span><span class="info-val">12 – 84 months</span></div>
            <div class="info-row"><span class="info-key">Max LTV (740+ FICO, 12–75 mo)</span><span class="info-val">150%</span></div>
            <div class="info-row"><span class="info-key">Max LTV (680+ FICO, 76+ mo)</span><span class="info-val">120%</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">LTV Grid — 12 to 75 Months</h4>
          <table class="mini-table">
            <thead><tr><th>&lt;580</th><th>580–599</th><th>600–619</th><th>620–639</th><th>640–659</th><th>660–679</th><th>680–739</th><th>740+</th></tr></thead>
            <tbody><tr><td>90%</td><td>95%</td><td>100%</td><td>105%</td><td>115%</td><td>125%</td><td>135%</td><td>150%</td></tr></tbody>
          </table>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">LTV Grid — 76+ Months</h4>
          <table class="mini-table">
            <thead><tr><th>&lt;580</th><th>580–639</th><th>640–659</th><th>660–679</th><th>680+</th></tr></thead>
            <tbody><tr><td>90%</td><td>95%</td><td>105%</td><td>115%</td><td>120%</td></tr></tbody>
          </table>
          <div class="note-box info" style="margin-top:var(--space-3)"><span class="note-icon">ℹ️</span><span>Loyalty tier upgrades apply to rate pricing. LTV and PTI are always based on the <strong>initial credit score</strong>.</span></div>
        `
      },
      backend: {
        icon: '🧩',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Backend (680+)</span><span class="info-val">20% of amount financed or $5,000 — whichever is less</span></div>
            <div class="info-row"><span class="info-key">Max Backend (&lt;680)</span><span class="info-val">16% of amount financed or $4,000 — whichever is less</span></div>
            <div class="info-row"><span class="info-key">Max GAP</span><span class="info-val">$1,500 (all tiers)</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>Backend cap is FICO-tiered. Customers at 680+ receive a higher backend allowance. GAP is capped at $1,500 regardless of tier.</span></div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Chargeback</span><span class="info-val">N/A — confirm with rep</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span>Reserve/flat fee structure not included in current program sheet. Contact your Kia Finance rep for rate participation details.</span></div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Primary Focus</span><span class="info-val">Kia vehicles (new & used)</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span>Full vehicle eligibility details (max miles, model year, etc.) not included in current program sheet. Confirm with Kia Finance rep.</span></div>
        `
      },
      incentives: {
        icon: '🏷️',
        label: 'KFA Incentives',
        content: `
          <!-- ══════ HEADER ══════ -->
          <div class="kfa-header">
            <div class="kfa-header-pill">KFA Bulletin 2026-036 &amp; 2026-037</div>
            <div class="kfa-header-dates">Contracts: Mar 3 – Mar 31, 2026 &nbsp;·&nbsp; Fund by: Apr 14, 2026</div>
          </div>

          <!-- ══════ FLAT FEE KEY ══════ -->
          <div class="kfa-flat-key">
            <div class="kfa-flat-key-title">K500 Flat Fee Schedule</div>
            <div class="kfa-flat-key-grid">
              <div><strong>T1–3:</strong> Premier $200 / VIP $150 / Partner $100</div>
              <div><strong>T4–8:</strong> Premier $150 / VIP $100 / Partner $50</div>
              <div><strong>K506:</strong> Up to $450 flat (all tiers, FICO ≥620)</div>
              <div><strong>Lease K502:</strong> Premier $150 / VIP $150 / Partner $100</div>
            </div>
          </div>

          <!-- nav tabs -->
          <div class="kfa-tab-bar" id="kfa-tab-bar">
            <button class="kfa-tab active" data-model="carnival">Carnival</button>
            <button class="kfa-tab" data-model="carnival-hybrid">Carnival Hybrid</button>
            <button class="kfa-tab" data-model="k4">K4</button>
            <button class="kfa-tab" data-model="k5">K5</button>
            <button class="kfa-tab" data-model="niro">Niro</button>
            <button class="kfa-tab" data-model="seltos">Seltos</button>
            <button class="kfa-tab" data-model="sorento">Sorento</button>
            <button class="kfa-tab" data-model="sorento-hybrid">Sorento Hybrid</button>
            <button class="kfa-tab" data-model="soul">Soul</button>
            <button class="kfa-tab" data-model="sportage">Sportage</button>
            <button class="kfa-tab" data-model="sportage-hybrid">Sportage Hybrid</button>
            <button class="kfa-tab" data-model="telluride">Telluride</button>
            <button class="kfa-tab" data-model="telluride-hybrid">Telluride Hybrid</button>
          </div>

          <!-- ══════════════════════════ CARNIVAL ══════════════════════════ -->
          <div class="kfa-model-panel active" data-panel="carnival">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <!-- APR -->
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2026</span></div>
                <div class="kfa-prog-note">Models: LX (MAC4225), LXS (MAC4235), EX (MAC4245) &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table">
                  <thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead>
                  <tbody>
                    <tr><td>1/2</td><td>720+</td><td>1.90%</td><td>2.49%</td><td>3.99%</td><td>4.49%</td><td>6.25%</td><td>N/A</td><td>Up to $200</td></tr>
                    <tr><td>3</td><td>700–719</td><td>4.50%</td><td>5.00%</td><td>6.25%</td><td>6.50%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                    <tr><td>4</td><td>680–699</td><td>6.25%</td><td>6.50%</td><td>7.50%</td><td>7.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                    <tr><td>5</td><td>660–679</td><td>8.25%</td><td>8.50%</td><td>9.50%</td><td>9.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                    <tr><td>6</td><td>640–659</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                    <tr><td>7</td><td>620–639</td><td>10.25%</td><td>10.50%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                    <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — KFA Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— LX/LXS/EX</div>
                <div class="kfa-prog-note">Models: LX, LXS, EX &nbsp;·&nbsp; Bonus Cash: $1,500 &nbsp;·&nbsp; Max Term: 72mo</div>
                <table class="mini-table">
                  <thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead>
                  <tbody>
                    <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>Up to $450</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — KFA Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— SX/SX-Prestige</div>
                <div class="kfa-prog-note">Models: SX (MAC4285), SX-Prestige (MAC4295) &nbsp;·&nbsp; Bonus Cash: $2,000 &nbsp;·&nbsp; Max Term: 72mo</div>
                <table class="mini-table">
                  <thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead>
                  <tbody>
                    <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>Up to $450</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- LEASE -->
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K502 — KFA Special Lease &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026 — 24mo</span></div>
                <div class="kfa-prog-note">Residual @ 10K mi/yr. Deduct 1% for 12K, 3% for 15K. T1-2 no participation on advertised specials.</div>
                <table class="mini-table">
                  <thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>MF T1-2 (720+)</th><th>MF T3 (700-719)</th><th>Residual</th><th>Reserve</th></tr></thead>
                  <tbody>
                    <tr><td>MAC4225</td><td>LX</td><td>$950</td><td>0.00194</td><td>0.00229</td><td>73%</td><td>Flat only</td></tr>
                    <tr><td>MAC4235</td><td>LXS</td><td>$1,000</td><td>0.00197</td><td>0.00232</td><td>73%</td><td>Flat only</td></tr>
                    <tr><td>MAC4245</td><td>EX</td><td>$1,100</td><td>0.00194</td><td>0.00229</td><td>72%</td><td>0.00040 / $150</td></tr>
                    <tr><td>MAC4285</td><td>SX</td><td>$1,200</td><td>0.00196</td><td>0.00231</td><td>72%</td><td>0.00040 / $150</td></tr>
                    <tr><td>MAC4295</td><td>SX Prestige</td><td>$1,500</td><td>0.00195</td><td>0.00230</td><td>71%</td><td>0.00040 / $150</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K502 — KFA Special Lease &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026 — 36mo</span></div>
                <table class="mini-table">
                  <thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead>
                  <tbody>
                    <tr><td>MAC4225</td><td>LX</td><td>$750</td><td>0.00220</td><td>0.00255</td><td>0.00285</td><td>0.00310</td><td>0.00330</td><td>0.00350</td><td>66%</td></tr>
                    <tr><td>MAC4235</td><td>LXS</td><td>$650</td><td>0.00219</td><td>0.00254</td><td>0.00284</td><td>0.00309</td><td>0.00329</td><td>0.00349</td><td>66%</td></tr>
                    <tr><td>MAC4245</td><td>EX</td><td>$700</td><td>0.00218</td><td>0.00253</td><td>0.00283</td><td>0.00308</td><td>0.00328</td><td>0.00348</td><td>65%</td></tr>
                    <tr><td>MAC4285</td><td>SX</td><td>$750</td><td>0.00218</td><td>0.00253</td><td>0.00283</td><td>0.00308</td><td>0.00328</td><td>0.00348</td><td>65%</td></tr>
                    <tr><td>MAC4295</td><td>SX Prestige</td><td>$900</td><td>0.00219</td><td>0.00254</td><td>0.00284</td><td>0.00309</td><td>0.00329</td><td>0.00349</td><td>64%</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K502 — KFA Special Lease &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026 — 48mo</span></div>
                <table class="mini-table">
                  <thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead>
                  <tbody>
                    <tr><td>MAC4225</td><td>LX</td><td>$1,500</td><td>0.00259</td><td>0.00294</td><td>0.00324</td><td>0.00349</td><td>0.00369</td><td>0.00389</td><td>54%</td></tr>
                    <tr><td>MAC4235</td><td>LXS</td><td>$1,750</td><td>0.00259</td><td>0.00294</td><td>0.00324</td><td>0.00349</td><td>0.00369</td><td>0.00389</td><td>53%</td></tr>
                    <tr><td>MAC4245</td><td>EX</td><td>$1,150</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>54%</td></tr>
                    <tr><td>MAC4285</td><td>SX</td><td>$1,250</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>54%</td></tr>
                    <tr><td>MAC4295</td><td>SX Prestige</td><td>$900</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>54%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════ CARNIVAL HYBRID ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="carnival-hybrid">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2026</span></div>
                <div class="kfa-prog-note">Models: LXS (MAH4235), EX (MAH4245) &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table">
                  <thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead>
                  <tbody>
                    <tr><td>1/2</td><td>720+</td><td>1.90%</td><td>2.49%</td><td>3.99%</td><td>4.49%</td><td>6.25%</td><td>N/A</td><td>Up to $200</td></tr>
                    <tr><td>3</td><td>700–719</td><td>4.50%</td><td>5.00%</td><td>6.25%</td><td>6.50%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                    <tr><td>4</td><td>680–699</td><td>6.25%</td><td>6.50%</td><td>7.50%</td><td>7.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                    <tr><td>5</td><td>660–679</td><td>8.25%</td><td>8.50%</td><td>9.50%</td><td>9.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                    <tr><td>6</td><td>640–659</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                    <tr><td>7</td><td>620–639</td><td>10.25%</td><td>10.50%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                    <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — KFA Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— LXS/EX</div>
                <div class="kfa-prog-note">Models: LXS (MAH4235), EX (MAH4245) &nbsp;·&nbsp; Bonus Cash: $1,500 &nbsp;·&nbsp; Max Term: 72mo</div>
                <table class="mini-table">
                  <thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead>
                  <tbody>
                    <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>Up to $450</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — KFA Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— SX/SX-Prestige</div>
                <div class="kfa-prog-note">Models: SX (MAH4285), SX-Prestige (MAH4295) &nbsp;·&nbsp; Bonus Cash: $2,000 &nbsp;·&nbsp; Max Term: 72mo</div>
                <table class="mini-table">
                  <thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead>
                  <tbody>
                    <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                    <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>Up to $450</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K502 — 24mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div>
                <table class="mini-table">
                  <thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>MF T1-2</th><th>MF T3</th><th>Residual</th><th>Reserve</th></tr></thead>
                  <tbody>
                    <tr><td>MAH4235</td><td>LXS</td><td>$1,750</td><td>0.00194</td><td>0.00229</td><td>71%</td><td>Flat only</td></tr>
                    <tr><td>MAH4245</td><td>EX</td><td>$1,800</td><td>0.00194</td><td>0.00229</td><td>71%</td><td>0.00040 / $150</td></tr>
                    <tr><td>MAH4285</td><td>SX</td><td>$1,750</td><td>0.00196</td><td>0.00231</td><td>71%</td><td>0.00040 / $150</td></tr>
                    <tr><td>MAH4295</td><td>SX Prestige</td><td>$1,700</td><td>0.00196</td><td>0.00231</td><td>71%</td><td>0.00040 / $150</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K502 — 36mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div>
                <table class="mini-table">
                  <thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead>
                  <tbody>
                    <tr><td>MAH4235</td><td>LXS</td><td>$1,250</td><td>0.00218</td><td>0.00253</td><td>0.00283</td><td>0.00308</td><td>0.00328</td><td>0.00348</td><td>64%</td></tr>
                    <tr><td>MAH4245</td><td>EX</td><td>$1,300</td><td>0.00219</td><td>0.00254</td><td>0.00284</td><td>0.00309</td><td>0.00329</td><td>0.00349</td><td>64%</td></tr>
                    <tr><td>MAH4285</td><td>SX</td><td>$1,050</td><td>0.00218</td><td>0.00253</td><td>0.00283</td><td>0.00308</td><td>0.00328</td><td>0.00348</td><td>64%</td></tr>
                    <tr><td>MAH4295</td><td>SX Prestige</td><td>$850</td><td>0.00218</td><td>0.00253</td><td>0.00283</td><td>0.00308</td><td>0.00328</td><td>0.00348</td><td>64%</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K502 — 48mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div>
                <table class="mini-table">
                  <thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead>
                  <tbody>
                    <tr><td>MAH4235</td><td>LXS</td><td>$1,700</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>53%</td></tr>
                    <tr><td>MAH4245</td><td>EX</td><td>$1,750</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>53%</td></tr>
                    <tr><td>MAH4285</td><td>SX</td><td>$1,500</td><td>0.00259</td><td>0.00294</td><td>0.00324</td><td>0.00349</td><td>0.00369</td><td>0.00389</td><td>53%</td></tr>
                    <tr><td>MAH4295</td><td>SX Prestige</td><td>$1,250</td><td>0.00259</td><td>0.00294</td><td>0.00324</td><td>0.00349</td><td>0.00369</td><td>0.00389</td><td>53%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════ K4 ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="k4">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2026</span></div>
                <div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>3.49%</td><td>4.49%</td><td>5.25%</td><td>5.49%</td><td>7.00%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.00%</td><td>6.50%</td><td>7.25%</td><td>7.50%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.25%</td><td>7.50%</td><td>8.50%</td><td>8.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.00%</td><td>9.25%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.00%</td><td>10.25%</td><td>11.00%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2025</span></div>
                <div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>2.90%</td><td>3.99%</td><td>4.75%</td><td>4.99%</td><td>6.50%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>3</td><td>700–719</td><td>5.25%</td><td>6.00%</td><td>6.50%</td><td>6.75%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>4</td><td>680–699</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>5</td><td>660–679</td><td>8.50%</td><td>8.75%</td><td>9.75%</td><td>10.00%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>6</td><td>640–659</td><td>9.50%</td><td>9.75%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>7</td><td>620–639</td><td>10.50%</td><td>10.75%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— LX/LXS</div>
                <div class="kfa-prog-note">Models: LX (2AC3214), LXS (2AC3224) &nbsp;·&nbsp; Bonus Cash: $300</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>Up to $450</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— EX/GT-Line/GT-Line Turbo</div>
                <div class="kfa-prog-note">Models: EX 4D/5D, GT-Line 4D/5D, GT-Line Turbo 4D/5D &nbsp;·&nbsp; Bonus Cash: $600</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>Up to $450</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2025</span> &nbsp;— LX/LXS</div>
                <div class="kfa-prog-note">Models: LX (2AC3214), LXS (2AC3224) &nbsp;·&nbsp; Bonus Cash: $500</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>Up to $450</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2025</span> &nbsp;— EX/GT-Line/GT-Line Turbo</div>
                <div class="kfa-prog-note">Models: EX (2AC3244), GT-Line (2AC3254), GT-Line Turbo (2AC6254) &nbsp;·&nbsp; Bonus Cash: $1,000</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>Up to $450</td></tr>
                </tbody></table>
              </div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 24mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>MF T1-2</th><th>MF T3</th><th>Residual</th><th>Reserve</th></tr></thead><tbody>
                <tr><td>2AC3224</td><td>LXS 4D</td><td>$0</td><td>0.00200</td><td>0.00235</td><td>73%</td><td>Flat only</td></tr>
                <tr><td>2AC3244</td><td>EX 4D</td><td>$0</td><td>0.00207</td><td>0.00242</td><td>73%</td><td>Flat only</td></tr>
                <tr><td>2AC3254</td><td>GT-Line 4D</td><td>$0</td><td>0.00192</td><td>0.00227</td><td>72%</td><td>0.00040 / $150</td></tr>
                <tr><td>2AC6254</td><td>GT-Line Turbo 4D</td><td>$0</td><td>0.00197</td><td>0.00232</td><td>72%</td><td>0.00040 / $150</td></tr>
                <tr><td>2AC3245</td><td>EX 5D</td><td>$0</td><td>0.00212</td><td>0.00247</td><td>73%</td><td>Flat only</td></tr>
                <tr><td>2AC3255</td><td>GT-Line 5D</td><td>$0</td><td>0.00193</td><td>0.00228</td><td>72%</td><td>0.00040 / $150</td></tr>
                <tr><td>2AC6255</td><td>GT-Line Turbo 5D</td><td>$0</td><td>0.00198</td><td>0.00233</td><td>72%</td><td>0.00040 / $150</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 36mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead><tbody>
                <tr><td>2AC3224</td><td>LXS 4D</td><td>$0</td><td>0.00231</td><td>0.00266</td><td>0.00296</td><td>0.00321</td><td>0.00341</td><td>0.00361</td><td>66%</td></tr>
                <tr><td>2AC3244</td><td>EX 4D</td><td>$0</td><td>0.00226</td><td>0.00261</td><td>0.00291</td><td>0.00316</td><td>0.00336</td><td>0.00356</td><td>65%</td></tr>
                <tr><td>2AC3254</td><td>GT-Line 4D</td><td>$0</td><td>0.00230</td><td>0.00265</td><td>0.00295</td><td>0.00320</td><td>0.00340</td><td>0.00360</td><td>65%</td></tr>
                <tr><td>2AC6254</td><td>GT-Line Turbo 4D</td><td>$0</td><td>0.00233</td><td>0.00268</td><td>0.00298</td><td>0.00323</td><td>0.00343</td><td>0.00363</td><td>65%</td></tr>
                <tr><td>2AC3245</td><td>EX 5D</td><td>$0</td><td>0.00234</td><td>0.00269</td><td>0.00299</td><td>0.00324</td><td>0.00344</td><td>0.00364</td><td>65%</td></tr>
                <tr><td>2AC3255</td><td>GT-Line 5D</td><td>$0</td><td>0.00231</td><td>0.00266</td><td>0.00296</td><td>0.00321</td><td>0.00341</td><td>0.00361</td><td>65%</td></tr>
                <tr><td>2AC6255</td><td>GT-Line Turbo 5D</td><td>$0</td><td>0.00249</td><td>0.00284</td><td>0.00314</td><td>0.00339</td><td>0.00359</td><td>0.00379</td><td>66%</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 48mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead><tbody>
                <tr><td>2AC3224</td><td>LXS 4D</td><td>$250</td><td>0.00257</td><td>0.00292</td><td>0.00322</td><td>0.00347</td><td>0.00367</td><td>0.00387</td><td>53%</td></tr>
                <tr><td>2AC3244</td><td>EX 4D</td><td>$0</td><td>0.00266</td><td>0.00301</td><td>0.00331</td><td>0.00356</td><td>0.00376</td><td>0.00396</td><td>54%</td></tr>
                <tr><td>2AC3254</td><td>GT-Line 4D</td><td>$0</td><td>0.00269</td><td>0.00304</td><td>0.00334</td><td>0.00359</td><td>0.00379</td><td>0.00399</td><td>54%</td></tr>
                <tr><td>2AC6254</td><td>GT-Line Turbo 4D</td><td>$0</td><td>0.00270</td><td>0.00305</td><td>0.00335</td><td>0.00360</td><td>0.00380</td><td>0.00400</td><td>54%</td></tr>
                <tr><td>2AC3245</td><td>EX 5D</td><td>$0</td><td>0.00274</td><td>0.00309</td><td>0.00339</td><td>0.00364</td><td>0.00384</td><td>0.00404</td><td>54%</td></tr>
                <tr><td>2AC3255</td><td>GT-Line 5D</td><td>$0</td><td>0.00269</td><td>0.00304</td><td>0.00334</td><td>0.00359</td><td>0.00379</td><td>0.00399</td><td>54%</td></tr>
                <tr><td>2AC6255</td><td>GT-Line Turbo 5D</td><td>$0</td><td>0.00271</td><td>0.00306</td><td>0.00336</td><td>0.00361</td><td>0.00381</td><td>0.00401</td><td>54%</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 24mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2025</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>MF T1-2</th><th>MF T3</th><th>Residual</th><th>Reserve</th></tr></thead><tbody>
                <tr><td>2AC3224</td><td>LXS</td><td>$1,350</td><td>0.00196</td><td>0.00231</td><td>68%</td><td>Flat only</td></tr>
                <tr><td>2AC3244</td><td>EX</td><td>$1,050</td><td>0.00195</td><td>0.00230</td><td>70%</td><td>Flat only</td></tr>
                <tr><td>2AC3254</td><td>GT-Line</td><td>$200</td><td>0.00195</td><td>0.00230</td><td>73%</td><td>0.00040 / $150</td></tr>
                <tr><td>2AC6254</td><td>GT-Line Turbo</td><td>$600</td><td>0.00192</td><td>0.00227</td><td>71%</td><td>0.00040 / $150</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 36mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2025</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead><tbody>
                <tr><td>2AC3224</td><td>LXS</td><td>$1,000</td><td>0.00218</td><td>0.00253</td><td>0.00283</td><td>0.00308</td><td>0.00328</td><td>0.00348</td><td>61%</td></tr>
                <tr><td>2AC3244</td><td>EX</td><td>$700</td><td>0.00216</td><td>0.00251</td><td>0.00281</td><td>0.00306</td><td>0.00326</td><td>0.00346</td><td>63%</td></tr>
                <tr><td>2AC3254</td><td>GT-Line</td><td>$0</td><td>0.00227</td><td>0.00262</td><td>0.00292</td><td>0.00317</td><td>0.00337</td><td>0.00357</td><td>66%</td></tr>
                <tr><td>2AC6254</td><td>GT-Line Turbo</td><td>$200</td><td>0.00217</td><td>0.00252</td><td>0.00282</td><td>0.00307</td><td>0.00327</td><td>0.00347</td><td>64%</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 48mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2025</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead><tbody>
                <tr><td>2AC3224</td><td>LXS</td><td>$1,200</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>49%</td></tr>
                <tr><td>2AC3244</td><td>EX</td><td>$1,200</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>50%</td></tr>
                <tr><td>2AC3254</td><td>GT-Line</td><td>$400</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>53%</td></tr>
                <tr><td>2AC6254</td><td>GT-Line Turbo</td><td>$500</td><td>0.00259</td><td>0.00294</td><td>0.00324</td><td>0.00349</td><td>0.00369</td><td>0.00389</td><td>52%</td></tr>
              </tbody></table></div>
            </div>
          </div>

          <!-- ══════════════════════════ K5 ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="k5">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2026</span></div>
                <div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>2.49%</td><td>3.49%</td><td>4.25%</td><td>4.49%</td><td>6.25%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>3</td><td>700–719</td><td>4.75%</td><td>5.25%</td><td>6.75%</td><td>7.00%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>4</td><td>680–699</td><td>6.25%</td><td>6.50%</td><td>7.50%</td><td>7.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>5</td><td>660–679</td><td>8.25%</td><td>8.50%</td><td>9.50%</td><td>9.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>6</td><td>640–659</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>7</td><td>620–639</td><td>10.25%</td><td>10.50%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — KFA Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— All Trims</div>
                <div class="kfa-prog-note">Bonus Cash: $1,000 &nbsp;·&nbsp; Max Term: 72mo &nbsp;·&nbsp; 1% markup or up to $450 flat</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>—</td></tr>
                </tbody></table>
              </div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 24mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>MF T1-2</th><th>MF T3</th><th>Residual</th><th>Reserve</th></tr></thead><tbody>
                <tr><td>LAC4234</td><td>LXS FWD</td><td>$800</td><td>0.00195</td><td>0.00230</td><td>70%</td><td>Flat only</td></tr>
                <tr><td>LAC4254</td><td>GT-Line FWD</td><td>$150</td><td>0.00199</td><td>0.00234</td><td>72%</td><td>0.00040 / $150</td></tr>
                <tr><td>LAC4264</td><td>EX FWD</td><td>$600</td><td>0.00194</td><td>0.00229</td><td>70%</td><td>0.00040 / $150</td></tr>
                <tr><td>LAC6284</td><td>GT FWD</td><td>$450</td><td>0.00195</td><td>0.00230</td><td>71%</td><td>0.00040 / $150</td></tr>
                <tr><td>LAC4454</td><td>GT-Line AWD</td><td>$0</td><td>0.00207</td><td>0.00242</td><td>73%</td><td>0.00040 / $150</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 36mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead><tbody>
                <tr><td>LAC4234</td><td>LXS FWD</td><td>$400</td><td>0.00217</td><td>0.00252</td><td>0.00282</td><td>0.00307</td><td>0.00327</td><td>0.00347</td><td>63%</td></tr>
                <tr><td>LAC4254</td><td>GT-Line FWD</td><td>$0</td><td>0.00220</td><td>0.00255</td><td>0.00285</td><td>0.00310</td><td>0.00330</td><td>0.00350</td><td>64%</td></tr>
                <tr><td>LAC4264</td><td>EX FWD</td><td>$0</td><td>0.00215</td><td>0.00250</td><td>0.00280</td><td>0.00305</td><td>0.00325</td><td>0.00345</td><td>63%</td></tr>
                <tr><td>LAC6284</td><td>GT FWD</td><td>$0</td><td>0.00218</td><td>0.00253</td><td>0.00283</td><td>0.00308</td><td>0.00328</td><td>0.00348</td><td>64%</td></tr>
                <tr><td>LAC4454</td><td>GT-Line AWD</td><td>$0</td><td>0.00219</td><td>0.00254</td><td>0.00284</td><td>0.00309</td><td>0.00329</td><td>0.00349</td><td>64%</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 48mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead><tbody>
                <tr><td>LAC4234</td><td>LXS FWD</td><td>$0</td><td>0.00258</td><td>0.00293</td><td>0.00323</td><td>0.00348</td><td>0.00368</td><td>0.00388</td><td>55%</td></tr>
                <tr><td>LAC4254</td><td>GT-Line FWD</td><td>$0</td><td>0.00272</td><td>0.00307</td><td>0.00337</td><td>0.00362</td><td>0.00382</td><td>0.00402</td><td>55%</td></tr>
                <tr><td>LAC4264</td><td>EX FWD</td><td>$0</td><td>0.00269</td><td>0.00304</td><td>0.00334</td><td>0.00359</td><td>0.00379</td><td>0.00399</td><td>54%</td></tr>
                <tr><td>LAC6284</td><td>GT FWD</td><td>$0</td><td>0.00267</td><td>0.00302</td><td>0.00332</td><td>0.00357</td><td>0.00377</td><td>0.00397</td><td>55%</td></tr>
                <tr><td>LAC4454</td><td>GT-Line AWD</td><td>$0</td><td>0.00269</td><td>0.00304</td><td>0.00334</td><td>0.00359</td><td>0.00379</td><td>0.00399</td><td>55%</td></tr>
              </tbody></table></div>
            </div>
          </div>

          <!-- ══════════════════════════ NIRO ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="niro">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2026</span></div>
                <div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>2.90%</td><td>3.49%</td><td>4.25%</td><td>4.99%</td><td>6.50%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>3</td><td>700–719</td><td>5.00%</td><td>5.75%</td><td>6.50%</td><td>6.75%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>4</td><td>680–699</td><td>6.25%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>5</td><td>660–679</td><td>8.50%</td><td>8.75%</td><td>9.75%</td><td>10.00%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>6</td><td>640–659</td><td>9.50%</td><td>9.75%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>7</td><td>620–639</td><td>10.50%</td><td>10.75%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — KFA Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— All Trims</div>
                <div class="kfa-prog-note">Bonus Cash: $750 &nbsp;·&nbsp; Max Term: 72mo &nbsp;·&nbsp; 1% markup or up to $450 flat</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>—</td></tr>
                </tbody></table>
              </div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 24mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>MF T1-2</th><th>MF T3</th><th>Residual</th><th>Reserve</th></tr></thead><tbody>
                <tr><td>GAH4225</td><td>LX</td><td>$1,750</td><td>0.00193</td><td>0.00228</td><td>69%</td><td>Flat only</td></tr><tr><td>GAH4245</td><td>EX</td><td>$1,600</td><td>0.00197</td><td>0.00232</td><td>71%</td><td>Flat only</td></tr><tr><td>GAH4265</td><td>SX</td><td>$1,050</td><td>0.00193</td><td>0.00228</td><td>72%</td><td>0.00040 / $150</td></tr><tr><td>GAH4275</td><td>SX Touring</td><td>$1,600</td><td>0.00194</td><td>0.00229</td><td>70%</td><td>0.00040 / $150</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 36mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead><tbody>
                <tr><td>GAH4225</td><td>LX</td><td>$1,700</td><td>0.00218</td><td>0.00253</td><td>0.00283</td><td>0.00308</td><td>0.00328</td><td>0.00348</td><td>62%</td></tr><tr><td>GAH4245</td><td>EX</td><td>$1,500</td><td>0.00217</td><td>0.00252</td><td>0.00282</td><td>0.00307</td><td>0.00327</td><td>0.00347</td><td>64%</td></tr><tr><td>GAH4265</td><td>SX</td><td>$1,100</td><td>0.00219</td><td>0.00254</td><td>0.00284</td><td>0.00309</td><td>0.00329</td><td>0.00349</td><td>65%</td></tr><tr><td>GAH4275</td><td>SX Touring</td><td>$1,500</td><td>0.00218</td><td>0.00253</td><td>0.00283</td><td>0.00308</td><td>0.00328</td><td>0.00348</td><td>63%</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 48mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead><tbody>
                <tr><td>GAH4225</td><td>LX</td><td>$2,200</td><td>0.00259</td><td>0.00294</td><td>0.00324</td><td>0.00349</td><td>0.00369</td><td>0.00389</td><td>50%</td></tr><tr><td>GAH4245</td><td>EX</td><td>$2,150</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>52%</td></tr><tr><td>GAH4265</td><td>SX</td><td>$1,800</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>53%</td></tr><tr><td>GAH4275</td><td>SX Touring</td><td>$1,900</td><td>0.00259</td><td>0.00294</td><td>0.00324</td><td>0.00349</td><td>0.00369</td><td>0.00389</td><td>52%</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — MY 2025 (24/36/48mo) &nbsp;<span class="kfa-badge k502">Code 502</span></div><div class="note-box info"><span class="note-icon">ℹ️</span><span>MY 2025 Niro lease programs include LX, EX, EX Touring, SX, SX Touring. Lease cash ranges from $3,300–$4,350 depending on trim and term. Contact Kia Finance rep for full MY 2025 Niro money factor grid.</span></div></div>
            </div>
          </div>

          <!-- ══════════════════════════ SELTOS ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="seltos">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section"><div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2026</span></div><div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>2.49%</td><td>3.49%</td><td>4.25%</td><td>4.49%</td><td>6.25%</td><td>N/A</td><td>Up to $200</td></tr><tr><td>3</td><td>700–719</td><td>4.75%</td><td>5.25%</td><td>6.75%</td><td>7.00%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr><tr><td>4</td><td>680–699</td><td>6.25%</td><td>6.50%</td><td>7.50%</td><td>7.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>5</td><td>660–679</td><td>8.25%</td><td>8.50%</td><td>9.50%</td><td>9.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>6</td><td>640–659</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>7</td><td>620–639</td><td>10.25%</td><td>10.50%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— LX/S</div><div class="kfa-prog-note">LX (KAC2225/KAC2425), S (KAC2235/KAC2435) &nbsp;·&nbsp; Bonus Cash: $750</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody><tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr><tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr><tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr><tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr><tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr><tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr><tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr><tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>Up to $450</td></tr></tbody></table>
              </div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— EX/SX</div><div class="kfa-prog-note">EX (KAC2245/KAC2445), SX (KAC4485) &nbsp;·&nbsp; Bonus Cash: $1,250</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody><tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr><tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr><tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr><tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr><tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr><tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr><tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr><tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>Up to $450</td></tr></tbody></table>
              </div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 24mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>MF T1-2</th><th>MF T3</th><th>Residual</th><th>Reserve</th></tr></thead><tbody>
                <tr><td>KAC2225</td><td>LX FWD</td><td>$2,000</td><td>0.00195</td><td>0.00230</td><td>66%</td><td>Flat only</td></tr><tr><td>KAC2235</td><td>S FWD</td><td>$950</td><td>0.00192</td><td>0.00227</td><td>70%</td><td>0.00040 / $150</td></tr><tr><td>KAC2245</td><td>EX FWD</td><td>$250</td><td>0.00196</td><td>0.00231</td><td>73%</td><td>0.00040 / $150</td></tr><tr><td>KAC2425</td><td>LX AWD</td><td>$1,300</td><td>0.00193</td><td>0.00228</td><td>69%</td><td>Flat only</td></tr><tr><td>KAC2435</td><td>S AWD</td><td>$200</td><td>0.00192</td><td>0.00227</td><td>73%</td><td>0.00040 / $150</td></tr><tr><td>KAC2445</td><td>EX AWD</td><td>$200</td><td>0.00194</td><td>0.00229</td><td>73%</td><td>0.00040 / $150</td></tr><tr><td>KAC4485</td><td>SX AWD</td><td>$0</td><td>0.00192</td><td>0.00227</td><td>74%</td><td>0.00040 / $150</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 36mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead><tbody>
                <tr><td>KAC2225</td><td>LX FWD</td><td>$1,650</td><td>0.00219</td><td>0.00254</td><td>0.00284</td><td>0.00309</td><td>0.00329</td><td>0.00349</td><td>59%</td></tr><tr><td>KAC2235</td><td>S FWD</td><td>$600</td><td>0.00219</td><td>0.00254</td><td>0.00284</td><td>0.00309</td><td>0.00329</td><td>0.00349</td><td>63%</td></tr><tr><td>KAC2245</td><td>EX FWD</td><td>$0</td><td>0.00227</td><td>0.00262</td><td>0.00292</td><td>0.00317</td><td>0.00337</td><td>0.00357</td><td>66%</td></tr><tr><td>KAC2425</td><td>LX AWD</td><td>$900</td><td>0.00218</td><td>0.00253</td><td>0.00283</td><td>0.00308</td><td>0.00328</td><td>0.00348</td><td>62%</td></tr><tr><td>KAC2435</td><td>S AWD</td><td>$0</td><td>0.00227</td><td>0.00262</td><td>0.00292</td><td>0.00317</td><td>0.00337</td><td>0.00357</td><td>66%</td></tr><tr><td>KAC2445</td><td>EX AWD</td><td>$0</td><td>0.00229</td><td>0.00264</td><td>0.00294</td><td>0.00319</td><td>0.00339</td><td>0.00359</td><td>66%</td></tr><tr><td>KAC4485</td><td>SX AWD</td><td>$0</td><td>0.00229</td><td>0.00264</td><td>0.00294</td><td>0.00319</td><td>0.00339</td><td>0.00359</td><td>67%</td></tr>
              </tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K502 — 48mo &nbsp;<span class="kfa-badge k502">Code 502</span> &nbsp;<span class="kfa-my">MY 2026</span></div><table class="mini-table"><thead><tr><th>Model #</th><th>Trim</th><th>Lease Cash</th><th>T1-2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>Resid.</th></tr></thead><tbody>
                <tr><td>KAC2225</td><td>LX FWD</td><td>$1,300</td><td>0.00260</td><td>0.00295</td><td>0.00325</td><td>0.00350</td><td>0.00370</td><td>0.00390</td><td>50%</td></tr><tr><td>KAC2235</td><td>S FWD</td><td>$250</td><td>0.00258</td><td>0.00293</td><td>0.00323</td><td>0.00348</td><td>0.00368</td><td>0.00388</td><td>54%</td></tr><tr><td>KAC2245</td><td>EX FWD</td><td>$0</td><td>0.00269</td><td>0.00304</td><td>0.00334</td><td>0.00359</td><td>0.00379</td><td>0.00399</td><td>56%</td></tr><tr><td>KAC2425</td><td>LX AWD</td><td>$550</td><td>0.00258</td><td>0.00293</td><td>0.00323</td><td>0.00348</td><td>0.00368</td><td>0.00388</td><td>53%</td></tr><tr><td>KAC2435</td><td>S AWD</td><td>$0</td><td>0.00269</td><td>0.00304</td><td>0.00334</td><td>0.00359</td><td>0.00379</td><td>0.00399</td><td>56%</td></tr><tr><td>KAC2445</td><td>EX AWD</td><td>$0</td><td>0.00270</td><td>0.00305</td><td>0.00335</td><td>0.00360</td><td>0.00380</td><td>0.00400</td><td>56%</td></tr><tr><td>KAC4485</td><td>SX AWD</td><td>$0</td><td>0.00270</td><td>0.00305</td><td>0.00335</td><td>0.00360</td><td>0.00380</td><td>0.00400</td><td>57%</td></tr>
              </tbody></table></div>
            </div>
          </div>

          <!-- ══════════════════════════ SORENTO ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="sorento">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section"><div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2026</span></div><div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>0.00%</td><td>0.90%</td><td>2.99%</td><td>3.49%</td><td>4.49%</td><td>N/A</td><td>Up to $200</td></tr><tr><td>3</td><td>700–719</td><td>3.50%</td><td>4.00%</td><td>5.75%</td><td>5.75%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr><tr><td>4</td><td>680–699</td><td>5.00%</td><td>5.50%</td><td>7.25%</td><td>7.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>5</td><td>660–679</td><td>7.25%</td><td>7.50%</td><td>9.25%</td><td>9.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>6</td><td>640–659</td><td>8.75%</td><td>9.00%</td><td>10.25%</td><td>10.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>7</td><td>620–639</td><td>10.00%</td><td>10.25%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2025</span></div><div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>0.00%</td><td>0.00%</td><td>1.99%</td><td>2.99%</td><td>3.99%</td><td>N/A</td><td>Up to $200</td></tr><tr><td>3</td><td>700–719</td><td>2.25%</td><td>3.25%</td><td>5.00%</td><td>5.25%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr><tr><td>4</td><td>680–699</td><td>4.25%</td><td>5.00%</td><td>6.50%</td><td>6.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>5</td><td>660–679</td><td>7.00%</td><td>7.25%</td><td>8.75%</td><td>9.00%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>6</td><td>640–659</td><td>8.75%</td><td>9.00%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>7</td><td>620–639</td><td>10.00%</td><td>10.25%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— 2.5 GDI</div><div class="kfa-prog-note">LX (7AC3225), S (7AC3235/7AC3435) &nbsp;·&nbsp; Bonus Cash: $2,500</div><table class="mini-table"><thead><tr><th>T</th><th>FICO</th><th>24–48</th><th>49–60</th><th>61–66</th><th>67–72</th><th>Markup</th><th>Flat</th></tr></thead><tbody><tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>$450</td></tr><tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>$450</td></tr><tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>$450</td></tr><tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>$450</td></tr><tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>$450</td></tr><tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>$450</td></tr><tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>$450</td></tr><tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>$450</td></tr></tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— 2.5 Turbo</div><div class="kfa-prog-note">All 2.5T Models &nbsp;·&nbsp; Bonus Cash: $3,000</div><table class="mini-table"><thead><tr><th>T</th><th>FICO</th><th>24–48</th><th>49–60</th><th>61–66</th><th>67–72</th><th>Markup</th><th>Flat</th></tr></thead><tbody><tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>$450</td></tr><tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>$450</td></tr><tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>$450</td></tr><tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>$450</td></tr><tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>$450</td></tr><tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>$450</td></tr><tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>$450</td></tr><tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>$450</td></tr></tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2025</span> &nbsp;— 2.5 GDI</div><div class="kfa-prog-note">Bonus Cash: $3,000</div><table class="mini-table"><thead><tr><th>T</th><th>FICO</th><th>24–48</th><th>49–60</th><th>61–66</th><th>67–72</th><th>Markup</th><th>Flat</th></tr></thead><tbody><tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>$450</td></tr><tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>$450</td></tr><tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>$450</td></tr><tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>$450</td></tr><tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>$450</td></tr><tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>$450</td></tr><tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>$450</td></tr><tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>$450</td></tr></tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2025</span> &nbsp;— 2.5 Turbo</div><div class="kfa-prog-note">Bonus Cash: $3,500</div><table class="mini-table"><thead><tr><th>T</th><th>FICO</th><th>24–48</th><th>49–60</th><th>61–66</th><th>67–72</th><th>Markup</th><th>Flat</th></tr></thead><tbody><tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>$450</td></tr><tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>$450</td></tr><tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>$450</td></tr><tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>$450</td></tr><tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>$450</td></tr><tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>$450</td></tr><tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>$450</td></tr><tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>$450</td></tr></tbody></table></div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="note-box info"><span class="note-icon">ℹ️</span><span>Sorento lease data covers extensive trim combinations. Key 36mo highlights: LX 2.5L FWD MF 0.00217/T1-2, residual 64%; EX 2.5T FWD MF 0.00218/T1-2, residual 64%; X-Line EX AWD MF 0.00217/T1-2, residual 66%. See full PDF for all trim/term combinations.</span></div>
            </div>
          </div>

          <!-- ══════════════════════════ SPORTAGE ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="sportage">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section"><div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2026</span></div><div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>0.00%</td><td>0.90%</td><td>2.99%</td><td>3.99%</td><td>5.99%</td><td>N/A</td><td>Up to $200</td></tr><tr><td>3</td><td>700–719</td><td>3.50%</td><td>4.00%</td><td>5.75%</td><td>6.00%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr><tr><td>4</td><td>680–699</td><td>5.00%</td><td>5.50%</td><td>7.25%</td><td>7.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>5</td><td>660–679</td><td>7.25%</td><td>7.50%</td><td>9.25%</td><td>9.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>6</td><td>640–659</td><td>8.75%</td><td>9.00%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>7</td><td>620–639</td><td>10.00%</td><td>10.25%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr><tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— LX/EX</div><div class="kfa-prog-note">LX (4AC2225/4AC2425), EX (4AC2245/4AC2445) &nbsp;·&nbsp; Bonus Cash: $1,500</div><table class="mini-table"><thead><tr><th>T</th><th>FICO</th><th>24–48</th><th>49–60</th><th>61–66</th><th>67–72</th><th>Markup</th><th>Flat</th></tr></thead><tbody><tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>$450</td></tr><tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>$450</td></tr><tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>$450</td></tr><tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>$450</td></tr><tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>$450</td></tr><tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>$450</td></tr><tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>$450</td></tr><tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>$450</td></tr></tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— Other trims</div><div class="kfa-prog-note">Model #s: 4AC2455, 4AC2265, 4AC2285, 4AC2485, 4AC2495 &nbsp;·&nbsp; Bonus Cash: $2,000</div><table class="mini-table"><thead><tr><th>T</th><th>FICO</th><th>24–48</th><th>49–60</th><th>61–66</th><th>67–72</th><th>Markup</th><th>Flat</th></tr></thead><tbody><tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>$450</td></tr><tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>$450</td></tr><tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>$450</td></tr><tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>$450</td></tr><tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>$450</td></tr><tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>$450</td></tr><tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>$450</td></tr><tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>$450</td></tr></tbody></table></div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="note-box info"><span class="note-icon">ℹ️</span><span>Sportage has extensive FWD/AWD trim combinations. Key 36mo highlights: LX FWD MF 0.00217/T1-2, residual 62%; EX FWD MF 0.00218/T1-2, residual 63%; Hybrid trims available — see full PDF for money factor and residual grid by trim.</span></div>
            </div>
          </div>

          <!-- ══════════════════════════ TELLURIDE ══════════════════════════ -->
          <!-- ══════════════════════════ SOUL ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="soul">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2025</span></div>
                <div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>3.90%</td><td>3.90%</td><td>4.49%</td><td>4.99%</td><td>6.50%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>3</td><td>700–719</td><td>5.50%</td><td>5.75%</td><td>6.50%</td><td>6.75%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>4</td><td>680–699</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>5</td><td>660–679</td><td>8.50%</td><td>8.75%</td><td>9.75%</td><td>10.00%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>6</td><td>640–659</td><td>9.50%</td><td>9.75%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>7</td><td>620–639</td><td>10.50%</td><td>10.75%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — KFA Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2025</span> &nbsp;— All Trims</div>
                <div class="kfa-prog-note">Bonus Cash: $1,000 &nbsp;·&nbsp; Max Term: 72mo &nbsp;·&nbsp; 1% markup or up to $450 flat</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>—</td></tr>
                </tbody></table>
              </div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="note-box info"><span class="note-icon">ℹ️</span><span>Soul lease programs not included in Bulletin 2026-035/2026-037. Contact your Kia Finance rep for current Soul lease availability.</span></div>
            </div>
          </div>

          <!-- ══════════════════════════ SORENTO HYBRID ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="sorento-hybrid">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2026</span></div>
                <div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>0.00%</td><td>0.90%</td><td>2.99%</td><td>3.49%</td><td>4.49%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>3</td><td>700–719</td><td>3.50%</td><td>4.00%</td><td>5.75%</td><td>5.75%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>4</td><td>680–699</td><td>5.00%</td><td>5.50%</td><td>7.25%</td><td>7.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>5</td><td>660–679</td><td>7.25%</td><td>7.50%</td><td>9.25%</td><td>9.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>6</td><td>640–659</td><td>8.75%</td><td>9.00%</td><td>10.25%</td><td>10.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>7</td><td>620–639</td><td>10.00%</td><td>10.25%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — KFA Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— All Trims</div>
                <div class="kfa-prog-note">Bonus Cash: $3,000 &nbsp;·&nbsp; Max Term: 72mo &nbsp;·&nbsp; 1% markup or up to $450 flat</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>—</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2025</span></div>
                <div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>0.00%</td><td>0.00%</td><td>1.99%</td><td>2.99%</td><td>3.99%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>3</td><td>700–719</td><td>2.25%</td><td>3.25%</td><td>5.00%</td><td>5.25%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>4</td><td>680–699</td><td>4.25%</td><td>5.00%</td><td>6.50%</td><td>6.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>5</td><td>660–679</td><td>7.00%</td><td>7.25%</td><td>8.75%</td><td>9.00%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>6</td><td>640–659</td><td>8.75%</td><td>9.00%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>7</td><td>620–639</td><td>10.00%</td><td>10.25%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — KFA Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2025</span> &nbsp;— All Trims</div>
                <div class="kfa-prog-note">Bonus Cash: $3,500 &nbsp;·&nbsp; Max Term: 72mo &nbsp;·&nbsp; 1% markup or up to $450 flat</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>—</td></tr>
                </tbody></table>
              </div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="note-box info"><span class="note-icon">ℹ️</span><span>Sorento Hybrid lease programs not included in Bulletin 2026-037. Contact your Kia Finance rep for current Sorento Hybrid lease availability.</span></div>
            </div>
          </div>

          <!-- ══════════════════════════ SPORTAGE HYBRID ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="sportage-hybrid">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2026</span></div>
                <div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>0.00%</td><td>0.90%</td><td>2.99%</td><td>3.99%</td><td>5.99%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>3</td><td>700–719</td><td>3.50%</td><td>4.00%</td><td>5.75%</td><td>6.00%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>4</td><td>680–699</td><td>5.00%</td><td>5.50%</td><td>7.25%</td><td>7.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>5</td><td>660–679</td><td>7.25%</td><td>7.50%</td><td>9.25%</td><td>9.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>6</td><td>640–659</td><td>8.75%</td><td>9.00%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>7</td><td>620–639</td><td>10.00%</td><td>10.25%</td><td>11.25%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section">
                <div class="kfa-prog-label">K506 — KFA Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2026</span> &nbsp;— All Trims</div>
                <div class="kfa-prog-note">Bonus Cash: $2,000 &nbsp;·&nbsp; Max Term: 72mo &nbsp;·&nbsp; 1% markup or up to $450 flat</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>Up to $450</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>—</td></tr>
                </tbody></table>
              </div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="note-box info"><span class="note-icon">ℹ️</span><span>Sportage Hybrid lease programs not included in Bulletin 2026-037. Contact your Kia Finance rep for current Sportage Hybrid lease availability.</span></div>
            </div>
          </div>

          <!-- ══════════════════════════ TELLURIDE ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="telluride">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section"><div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2027</span></div><div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0 &nbsp;·&nbsp; K506 Dealer Choice not listed for Telluride in this bulletin</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>3.99%</td><td>4.49%</td><td>5.49%</td><td>5.99%</td><td>7.00%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.25%</td><td>6.50%</td><td>7.50%</td><td>7.75%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.25%</td><td>7.50%</td><td>8.50%</td><td>8.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.00%</td><td>9.25%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.00%</td><td>10.25%</td><td>11.00%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2025</span> &nbsp;— LX/S</div><div class="kfa-prog-note">LX (JAC4225), S (JAC4235/JAC4435) &nbsp;·&nbsp; Bonus Cash: $2,000</div><table class="mini-table"><thead><tr><th>T</th><th>FICO</th><th>24–48</th><th>49–60</th><th>61–66</th><th>67–72</th><th>Markup</th><th>Flat</th></tr></thead><tbody><tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>$450</td></tr><tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>$450</td></tr><tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>$450</td></tr><tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>$450</td></tr><tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>$450</td></tr><tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>$450</td></tr><tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>$450</td></tr><tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>$450</td></tr></tbody></table></div>
              <div class="kfa-prog-section"><div class="kfa-prog-label">K506 — Dealer Choice &nbsp;<span class="kfa-badge k506">Code 506</span> &nbsp;<span class="kfa-my">MY 2025</span> &nbsp;— All Other Trims</div><div class="kfa-prog-note">EX, X-Line, SX, SX-P, X-Pro, SX-P AWD &nbsp;·&nbsp; Bonus Cash: $3,000</div><table class="mini-table"><thead><tr><th>T</th><th>FICO</th><th>24–48</th><th>49–60</th><th>61–66</th><th>67–72</th><th>Markup</th><th>Flat</th></tr></thead><tbody><tr><td>1</td><td>740+</td><td>5.25%</td><td>5.50%</td><td>6.25%</td><td>6.25%</td><td>1%</td><td>$450</td></tr><tr><td>2</td><td>720–739</td><td>6.00%</td><td>6.25%</td><td>7.25%</td><td>7.25%</td><td>1%</td><td>$450</td></tr><tr><td>3</td><td>700–719</td><td>6.50%</td><td>6.75%</td><td>7.75%</td><td>8.00%</td><td>1%</td><td>$450</td></tr><tr><td>4</td><td>680–699</td><td>7.50%</td><td>7.75%</td><td>8.50%</td><td>8.75%</td><td>1%</td><td>$450</td></tr><tr><td>5</td><td>660–679</td><td>9.25%</td><td>9.50%</td><td>10.25%</td><td>10.50%</td><td>1%</td><td>$450</td></tr><tr><td>6</td><td>640–659</td><td>10.50%</td><td>10.75%</td><td>11.00%</td><td>11.25%</td><td>1%</td><td>$450</td></tr><tr><td>7</td><td>620–639</td><td>11.50%</td><td>11.75%</td><td>11.75%</td><td>11.75%</td><td>1%</td><td>$450</td></tr><tr><td>8</td><td>580–619</td><td>11.50%</td><td>11.75%</td><td>12.00%</td><td>12.00%</td><td>1%</td><td>$450</td></tr></tbody></table></div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="note-box info"><span class="note-icon">ℹ️</span><span>Telluride MY2027 lease programs not included in Bulletin 2026-037. Contact your Kia Finance rep for current Telluride lease availability.</span></div>
            </div>
          </div>

          <!-- ══════════════════════════ TELLURIDE HYBRID ══════════════════════════ -->
          <div class="kfa-model-panel" data-panel="telluride-hybrid">
            <div class="kfa-program-toggle">
              <button class="kfa-prog-btn active" data-prog="apr">APR (K500 / K506)</button>
              <button class="kfa-prog-btn" data-prog="lease">Lease (K502)</button>
            </div>
            <div class="kfa-prog-panel active" data-progpanel="apr">
              <div class="kfa-prog-section"><div class="kfa-prog-label">K500 — KFA Low APR &nbsp;<span class="kfa-badge k500">Code 500</span> &nbsp;<span class="kfa-my">MY 2027</span></div><div class="kfa-prog-note">All models &nbsp;·&nbsp; Bonus Cash: $0 &nbsp;·&nbsp; K506 Dealer Choice not listed for Telluride Hybrid in this bulletin</div>
                <table class="mini-table"><thead><tr><th>Tier</th><th>FICO</th><th>24–48mo</th><th>49–60mo</th><th>61–66mo</th><th>67–72mo</th><th>73–84mo</th><th>Markup</th><th>Flat</th></tr></thead><tbody>
                  <tr><td>1/2</td><td>720+</td><td>3.99%</td><td>4.49%</td><td>5.49%</td><td>5.99%</td><td>7.00%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>3</td><td>700–719</td><td>6.25%</td><td>6.50%</td><td>7.50%</td><td>7.75%</td><td>0.0%</td><td>N/A</td><td>Up to $200</td></tr>
                  <tr><td>4</td><td>680–699</td><td>7.25%</td><td>7.50%</td><td>8.50%</td><td>8.75%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>5</td><td>660–679</td><td>9.00%</td><td>9.25%</td><td>10.25%</td><td>10.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>6</td><td>640–659</td><td>10.00%</td><td>10.25%</td><td>11.00%</td><td>11.25%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>7</td><td>620–639</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                  <tr><td>8</td><td>580–619</td><td>11.00%</td><td>11.25%</td><td>11.50%</td><td>11.50%</td><td>0.00%</td><td>N/A</td><td>Up to $150</td></tr>
                </tbody></table>
              </div>
            </div>
            <div class="kfa-prog-panel" data-progpanel="lease">
              <div class="note-box info"><span class="note-icon">ℹ️</span><span>Telluride Hybrid MY2027 lease programs not included in Bulletin 2026-037. Contact your Kia Finance rep for current Telluride Hybrid lease availability.</span></div>
            </div>
          </div>

        `
      }
    }
  },

  // ── BANK OF AMERICA ───────────────────────────────────────
  {
    id: 'bofa',
    name: 'Bank of America',
    fullName: 'Bank of America Auto (Access Lending)',
    abbr: 'BOA',
    colorClass: 'lc-bofa',
    docTitle: 'Access Lending Retail Program Sheet',
    effectiveDate: 'February 2, 2026',
    segment: 'prime',
    segmentLabel: 'Prime',
    ficoMin: 640,
    ficoNotes: 'Min 640 FICO all applicants. 720+ required for terms >75 months. Min 4 yrs time in file, 4 satisfactory trade lines.',
    maxTerm: 84,
    maxMileage: '125,000 mi',
    maxLTV: '145%',
    gapMax: '$1,200',
    reserveStructure: 'Flat: paid greater of flat or reserve. No $$$ cap. Buy Rate = 1%, up to 225bps = 5% flat.',
    chargebackWindow: 'N/A (flat fee model)',
    uniqueFeature: 'No cap on flat payouts; EV charging station eligible ($800); 30-day receive / 45-day fund deadline; Small Business program available',
    bureaus: {
      primary: ['experian'],
      note: 'Experian FICO Auto Industry Adjusted Model Version 8.0 — used for both retail and small business.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Credit',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Minimum FICO</span><span class="info-val">640 (all applicants)</span></div>
            <div class="info-row"><span class="info-key">FICO for 76–84 mo</span><span class="info-val">720+ required; max advance 110%; PTI &lt;10%; vehicle ≤3 yrs old; min $25K financed</span></div>
            <div class="info-row"><span class="info-key">Bureau</span><span class="info-val">Experian FICO Auto Industry Adjusted Model v8.0</span></div>
            <div class="info-row"><span class="info-key">File Depth</span><span class="info-val">Min 4 years in file; 4 satisfactory trade lines; limited recent delinquency</span></div>
            <div class="info-row"><span class="info-key">Bankruptcy</span><span class="info-val">Prior BK, charge-off, repo, foreclosure, or significant delinquency may be ineligible</span></div>
            <div class="info-row"><span class="info-key">Contract Order</span><span class="info-val">Must be contracted in the order approved</span></div>
          </div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">ID Required</span><span class="info-val">Valid U.S. Driver’s License</span></div>
            <div class="info-row"><span class="info-key">Address</span><span class="info-val">U.S. physical address required</span></div>
            <div class="info-row"><span class="info-key">Age</span><span class="info-val">Legal age to contract in state of residence</span></div>
            <div class="info-row"><span class="info-key">Power of Attorney</span><span class="info-val">❌ Not eligible</span></div>
            <div class="info-row"><span class="info-key">Trust</span><span class="info-val">❌ Not eligible</span></div>
            <div class="info-row"><span class="info-key">Title</span><span class="info-val">Only contract signers may be on title. Cosigner notice required if not on title.</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span>Lift any credit freeze or lock before submitting — required for faster underwriting response.</span></div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Income Basis</span><span class="info-val">Verifiable income only; only persons signing the contract are considered</span></div>
            <div class="info-row"><span class="info-key">No Income</span><span class="info-val">Enter $0 — do not enter $1, $5, or other placeholder amounts</span></div>
            <div class="info-row"><span class="info-key">Vehicle Use</span><span class="info-val">Personal use only (no business purpose)</span></div>
            <div class="info-row"><span class="info-key">Max PTI</span><span class="info-val">Up to 20% (less than 10% for 76–84 mo terms)</span></div>
          </div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Term</span><span class="info-val">Up to 84 months</span></div>
            <div class="info-row"><span class="info-key">Max Advance</span><span class="info-val">Up to 130% (110% for 76–84 mo)</span></div>
            <div class="info-row"><span class="info-key">Max LTV</span><span class="info-val">Up to 145%</span></div>
            <div class="info-row"><span class="info-key">Max PTI</span><span class="info-val">Up to 20% (under 10% for 76–84 mo)</span></div>
            <div class="info-row"><span class="info-key">Vehicle Age</span><span class="info-val">≤10 model years (≤3 years for 76–84 mo)</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">125,000 miles</span></div>
            <div class="info-row"><span class="info-key">Min Amount Financed</span><span class="info-val">$7,500 ($8,000 in MN; $25,000 for 76–84 mo)</span></div>
            <div class="info-row"><span class="info-key">Min Collateral Value</span><span class="info-val">$6,000</span></div>
            <div class="info-row"><span class="info-key">Contract Deadlines</span><span class="info-val">Receive within 30 days; fund within 45 days of app submission</span></div>
            <div class="info-row"><span class="info-key">First Payment</span><span class="info-val">Min 30 days — Max 45 days from contract date</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>Use Dealertrack® Deal Update or RouteOne® Deal Refresh for quick collateral and structure updates.</span></div>
        `
      },
      backend: {
        icon: '🧩',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Backend</span><span class="info-val">Greater of $5,000 or 25% of New MSRP / Used Collateral Value; subject to Max Approved LTV</span></div>
            <div class="info-row"><span class="info-key">Approved Products</span><span class="info-val">VSC, Maintenance, GAP, Credit Life, A&amp;H, Tire &amp; Wheel, Tire &amp; Wheel Bundles (One Price), Key Replacement</span></div>
            <div class="info-row"><span class="info-key">Max GAP (Most States)</span><span class="info-val">$1,200; no GAP on LTV &lt; 70%</span></div>
            <div class="info-row"><span class="info-key">GAP — TX</span><span class="info-val">Max 5% of total amount financed; no GAP on LTV &lt; 70%</span></div>
            <div class="info-row"><span class="info-key">GAP — CO</span><span class="info-val">Max greater of $600 or 4% of total amount financed</span></div>
            <div class="info-row"><span class="info-key">GAP — NY</span><span class="info-val">Max $225 (Personal Use contracts only); BOA NY GAP Liability Notice required</span></div>
            <div class="info-row"><span class="info-key">EV Charging Station</span><span class="info-val">Up to $800 eligible when financed with an EV purchase</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>All ancillary products must be individually disclosed on the RISC and align with the customer’s intended use (Personal or Business).</span></div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Reserve Cap — ≤60 mo</span><span class="info-val">APR cannot exceed Buy Rate by more than 2.50%</span></div>
            <div class="info-row"><span class="info-key">Reserve Cap — 61–75 mo</span><span class="info-val">APR cannot exceed Buy Rate by more than 2.00%</span></div>
            <div class="info-row"><span class="info-key">Reserve Cap — 76–84 mo</span><span class="info-val">APR cannot exceed Buy Rate by more than 1.50%</span></div>
            <div class="info-row"><span class="info-key">Flat — Buy Rate</span><span class="info-val">1.00% flat (terms 48–84 mo)</span></div>
            <div class="info-row"><span class="info-key">Flat — 50bps markup</span><span class="info-val">1.50% flat</span></div>
            <div class="info-row"><span class="info-key">Flat — 75bps markup</span><span class="info-val">2.00% flat</span></div>
            <div class="info-row"><span class="info-key">Flat — 100bps markup</span><span class="info-val">2.50% flat</span></div>
            <div class="info-row"><span class="info-key">Flat — 125bps markup</span><span class="info-val">3.00% flat</span></div>
            <div class="info-row"><span class="info-key">Flat — 150bps markup</span><span class="info-val">3.50% flat</span></div>
            <div class="info-row"><span class="info-key">Flat — 175bps markup</span><span class="info-val">4.00% flat (48–75 mo only)</span></div>
            <div class="info-row"><span class="info-key">Flat — 200bps markup</span><span class="info-val">4.50% flat (48–75 mo only)</span></div>
            <div class="info-row"><span class="info-key">Flat — 225bps markup</span><span class="info-val">5.00% flat (48–60 mo only)</span></div>
            <div class="info-row"><span class="info-key">Min for Flat</span><span class="info-val">$10,000 amount financed, terms 48–84 mo</span></div>
            <div class="info-row"><span class="info-key">Paid Greater Of</span><span class="info-val">Eligible flat OR reserve — dealer paid the greater amount</span></div>
            <div class="info-row"><span class="info-key">No $$$ Cap</span><span class="info-val">✅ No cap on flat payouts</span></div>
            <div class="info-row"><span class="info-key">Buy Rate Reduction</span><span class="info-val">Waive flat for additional 30bps off buy rate</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Flat Payout Examples by Amount Financed</h4>
          <table class="mini-table">
            <thead><tr><th>Amt Financed</th><th>Buy Rate (1%)</th><th>+50bps (1.5%)</th><th>+100bps (2.5%)</th><th>+150bps (3.5%)</th><th>+175bps (4%)*</th></tr></thead>
            <tbody>
              <tr><td>$15,000</td><td>$150</td><td>$225</td><td>$375</td><td>$525</td><td>$600</td></tr>
              <tr><td>$20,000</td><td>$200</td><td>$300</td><td>$500</td><td>$700</td><td>$800</td></tr>
              <tr><td>$25,000</td><td>$250</td><td>$375</td><td>$625</td><td>$875</td><td>$1,000</td></tr>
              <tr><td>$30,000</td><td>$300</td><td>$450</td><td>$750</td><td>$1,050</td><td>$1,200</td></tr>
              <tr><td>$40,000</td><td>$400</td><td>$600</td><td>$1,000</td><td>$1,400</td><td>$1,600</td></tr>
              <tr><td>$50,000</td><td>$500</td><td>$750</td><td>$1,250</td><td>$1,750</td><td>$2,000</td></tr>
            </tbody>
          </table>
          <div class="note-box warn" style="margin-top:var(--space-2)"><span class="note-icon">⚠️</span><span>*175bps and 200bps limited to 48–75 mo terms. 225bps (5%) limited to 48–60 mo. No cap on payout. Min financed $10K to qualify for flat.</span></div>
          <div class="info-grid" style="margin-top:var(--space-3)">
            <div class="info-row"><span class="info-key">Direct Approvals</span><span class="info-val">1% flat; contract rate cannot exceed Final Approved Buy Rate</span></div>
            <div class="info-row"><span class="info-key">Chargeback</span><span class="info-val">Flat cancel fee: $100 if no new contract replaces flat-cancelled contract; requests &gt;30 days treated as payoff</span></div>
            <div class="info-row"><span class="info-key">Deferred Down</span><span class="info-val">❌ Not eligible (except California)</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>175bps and 200bps markups limited to 48–75 mo terms only. 225bps limited to 48–60 mo only. All other tiers available 48–84 mo. Dealer paid the <strong>greater</strong> of eligible flat or reserve.</span></div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Vehicle Age</span><span class="info-val">≤10 model years (≤3 for 76–84 mo terms)</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">125,000 miles</span></div>
            <div class="info-row"><span class="info-key">Min Collateral Value</span><span class="info-val">$6,000</span></div>
            <div class="info-row"><span class="info-key">Exotic Vehicles</span><span class="info-val">10% cash down required; 90% max advance (Aston Martin, Bentley, Ferrari, Lamborghini, Maybach, McLaren, Rolls Royce)</span></div>
            <div class="info-row"><span class="info-key">Van Conversions</span><span class="info-val">100% of manufacturer invoice + 100% of conversion invoice</span></div>
          </div>
          <div class="note-box error"><span class="note-icon">❌</span><span><strong>Ineligible:</strong> Commercial vehicles, customized vehicles, branded titles, grey market, vehicles over 1 ton, cab &amp; chassis, rental use, business-purpose vehicles.</span></div>
        `
      }
    }
  },

  // ── CHASE AUTO ───────────────────────────────────────────────
  {
    id: 'chase',
    name: 'Chase Auto',
    fullName: 'JPMorgan Chase Auto',
    abbr: 'JPM',
    colorClass: 'lc-chase',
    docTitle: 'Chase Auto Product Reference Sheet',
    effectiveDate: 'November 20, 2025',
    segment: 'prime',
    segmentLabel: 'Prime',
    ficoMin: 620,
    ficoNotes: 'Stable credit history required. No open bankruptcies or unpaid Chase charge-offs. All BKs must be discharged.',
    maxTerm: 84,
    maxMileage: '120,000 mi',
    maxLTV: '150%',
    gapMax: 'State-specific (see Chase Toolkit)',
    reserveStructure: 'Standard FF: 1% at buy rate. Enhanced FF: 2% at +0.75bps markup (max $3,000). Markup cap: 2.5% (≤60 mo) / 2% (61–75) / 1.5% (76+)',
    chargebackWindow: 'N/A (flat fee model)',
    uniqueFeature: 'Standard + Enhanced Flat Fee programs; 150% max LTV; CPO auto-value adjustment; J.D. Power valuation; eContracting preferred',
    bureaus: {
      primary: ['equifax', 'transunion', 'experian'],
      note: 'Pulls all three bureaus. Uses the middle score for decisioning.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Credit',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Credit Standard</span><span class="info-val">Stable income source and credit history showing ability and willingness to pay</span></div>
            <div class="info-row"><span class="info-key">Bankruptcy</span><span class="info-val">No open bankruptcies; all must be discharged. No unpaid Chase charge-offs.</span></div>
            <div class="info-row"><span class="info-key">Approvals Valid</span><span class="info-val">30 days</span></div>
            <div class="info-row"><span class="info-key">Applications</span><span class="info-val">Dealertrack® or RouteOne® only</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>Available in: AL, AR, CT, DC, DE, FL, GA, IA, IL, KS, KY, LA, MA, MD, ME, MI, MN, MO, MS, NC, ND, NE, NH, NJ, NY, OH, OK, PA, RI, SC, SD, TN, TX, VA, VT, WI, WV</span></div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">ID Required</span><span class="info-val">Copy of current valid government ID (may be required based on transaction)</span></div>
            <div class="info-row"><span class="info-key">Down Payment</span><span class="info-val">Required based on transaction; must be paid at or before delivery (except CA)</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Income Standard</span><span class="info-val">Stable source of income required</span></div>
            <div class="info-row"><span class="info-key">Proof of Insurance</span><span class="info-val">May be required based on transaction characteristics</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>Dealer discount fees may be assessed based on transaction — cannot be passed on to the customer.</span></div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max LTV (Total)</span><span class="info-val">150% (includes TT&amp;L and all backend products)</span></div>
            <div class="info-row"><span class="info-key">New / ≤4-yr used</span><span class="info-val">Up to 84 months</span></div>
            <div class="info-row"><span class="info-key">≤6-yr used</span><span class="info-val">Up to 75 months</span></div>
            <div class="info-row"><span class="info-key">≤10-yr used</span><span class="info-val">Up to 72 months</span></div>
            <div class="info-row"><span class="info-key">&gt;75 mo min collateral</span><span class="info-val">$25,000 minimum collateral value</span></div>
            <div class="info-row"><span class="info-key">Max Vehicle Age</span><span class="info-val">10 years</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">120,000 miles (used)</span></div>
            <div class="info-row"><span class="info-key">Min Amount Financed</span><span class="info-val">$4,000 (excl. backend); $10,000 for Standard FF; $12,000 for Enhanced FF</span></div>
            <div class="info-row"><span class="info-key">First Payment Due</span><span class="info-val">Not to exceed 45 days from contract</span></div>
            <div class="info-row"><span class="info-key">Approval Valid</span><span class="info-val">30 days</span></div>
            <div class="info-row"><span class="info-key">Max Interest Rate</span><span class="info-val">24.99% or state max, whichever is lower</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>All previously titled vehicles or vehicles with &gt;6,000 miles book out as Used. J.D. Power Clean Trade-in by Region is the official used car guide.</span></div>
        `
      },
      backend: {
        icon: '🧩',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">GAP — New (MSRP &gt;$12K)</span><span class="info-val">Greater of $4,500 or 20% of MSRP</span></div>
            <div class="info-row"><span class="info-key">GAP — New (MSRP ≤$12K)</span><span class="info-val">35% of MSRP</span></div>
            <div class="info-row"><span class="info-key">GAP — Used (CSP &gt;$12K)</span><span class="info-val">Greater of $4,500 or 20% of Cash Selling Price</span></div>
            <div class="info-row"><span class="info-key">GAP — Used (CSP ≤$12K)</span><span class="info-val">35% of Cash Selling Price</span></div>
            <div class="info-row"><span class="info-key">Pre-Paid Maintenance</span><span class="info-val">Greater of $2,400 or 7% of MSRP/CSP</span></div>
            <div class="info-row"><span class="info-key">Tire &amp; Wheel</span><span class="info-val">Greater of $1,200 or 7% of MSRP/CSP</span></div>
            <div class="info-row"><span class="info-key">MBP — New</span><span class="info-val">Greater of $4,000 or 12% of MSRP (max $3,500 if MSRP &lt;$12K)</span></div>
            <div class="info-row"><span class="info-key">MBP — Used</span><span class="info-val">Greater of $4,000 or 12% of Cash Sales Price</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>See Chase Toolkit for state-specific GAP guidelines. Additional LTV advance available for permitted Voluntary Protection products.</span></div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Standard Flat Fee</span><span class="info-val">1% of Total Amount Financed at buy rate; no max amount; min $10,000 financed</span></div>
            <div class="info-row"><span class="info-key">Enhanced Flat Fee</span><span class="info-val">2% of Total Amount Financed at buy rate +0.75bps; max $3,000; min $12,000 financed</span></div>
            <div class="info-row"><span class="info-key">Markup Cap — ≤60 mo</span><span class="info-val">Buy rate + 2.50% max</span></div>
            <div class="info-row"><span class="info-key">Markup Cap — 61–75 mo</span><span class="info-val">Buy rate + 2.00% max</span></div>
            <div class="info-row"><span class="info-key">Markup Cap — 76+ mo</span><span class="info-val">Buy rate + 1.50% max</span></div>
            <div class="info-row"><span class="info-key">Subvented Contracts</span><span class="info-val">❌ Not eligible for flat fee programs</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Standard FF Payout Examples (1% of Amount Financed)</h4>
          <table class="mini-table">
            <thead><tr><th>Amt Financed</th><th>Standard FF (1%)</th><th>Enhanced FF (2%, max $3K)</th></tr></thead>
            <tbody>
              <tr><td>$12,000</td><td>$120</td><td>$240</td></tr>
              <tr><td>$15,000</td><td>$150</td><td>$300</td></tr>
              <tr><td>$20,000</td><td>$200</td><td>$400</td></tr>
              <tr><td>$25,000</td><td>$250</td><td>$500</td></tr>
              <tr><td>$30,000</td><td>$300</td><td>$600</td></tr>
              <tr><td>$40,000</td><td>$400</td><td>$800</td></tr>
              <tr><td>$50,000</td><td>$500</td><td>$1,000</td></tr>
              <tr><td>$75,000</td><td>$750</td><td>$1,500</td></tr>
              <tr><td>$150,000</td><td>$1,500</td><td>$3,000 (cap)</td></tr>
            </tbody>
          </table>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>See Chase Toolkit for Buydown Program guidelines. eContracting is the preferred funding method. Standard FF: min $10K financed. Enhanced FF: min $12K financed, must mark up exactly +0.75bps.</span></div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">120,000 miles</span></div>
            <div class="info-row"><span class="info-key">Max Vehicle Age</span><span class="info-val">10 years</span></div>
            <div class="info-row"><span class="info-key">CPO</span><span class="info-val">✅ Manufacturer CPO gets automatic wholesale value adjustment to reflect CPO pricing</span></div>
            <div class="info-row"><span class="info-key">Valuation</span><span class="info-val">J.D. Power Clean Trade-in by Region (used); Invoice (new)</span></div>
          </div>
          <div class="note-box error"><span class="note-icon">❌</span><span><strong>Ineligible:</strong> Commercial use, Sprinters, livery/taxi/rideshare vehicles, lemon law, hail damaged, reconditioned, branded/salvage titled, grey market, or frame-damaged vehicles.</span></div>
        `
      }
    }
  },

  // ── PNC BANK ──────────────────────────────────────────────────
  {
    id: 'pnc',
    name: 'PNC Bank',
    fullName: 'PNC Dealer Finance',
    abbr: 'PNC',
    colorClass: 'lc-pnc',
    docTitle: 'PNC Dealer Finance Program Guidelines',
    effectiveDate: 'January 1, 2026',
    segment: 'prime',
    segmentLabel: 'Prime',
    ficoMin: 680,
    ficoNotes: 'Tier 0 (800+) to Tier 4 (680–699). Uses both PNC Custom Score and Experian FICO 09 Auto Enhanced. Tiers 0–4 eligible.',
    maxTerm: 84,
    maxMileage: '125,000 mi',
    maxLTV: '140%',
    gapMax: 'Included in backend cap (LTV 95%+: $3,500 or 16% NMSRP + GAP)',
    reserveStructure: 'Buy Rate = 1%; +0.50% = 2%; +1.00% = 3%. Max flat $3,000. No flat on terms <48 mo or <$10K financed.',
    chargebackWindow: 'N/A (flat fee model)',
    uniqueFeature: 'PNC Custom Score + Experian dual scoring; tiered LTV grid T0–T4; 125% LTV (Tier 0 new); max advance 140%; BuyDown program; 60-day approval validity',
    bureaus: {
      primary: ['experian'],
      note: 'Experian FICO 09 Auto Enhanced. Also uses PNC Custom Score — both scores influence tier and rate.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Tiers',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Bureau</span><span class="info-val">Experian FICO 09 Auto Enhanced + PNC Custom Score</span></div>
            <div class="info-row"><span class="info-key">Tier 0</span><span class="info-val">800+</span></div>
            <div class="info-row"><span class="info-key">Tier 1</span><span class="info-val">760–799</span></div>
            <div class="info-row"><span class="info-key">Tier 2</span><span class="info-val">725–759</span></div>
            <div class="info-row"><span class="info-key">Tier 3</span><span class="info-val">700–724</span></div>
            <div class="info-row"><span class="info-key">Tier 4</span><span class="info-val">680–699</span></div>
            <div class="info-row"><span class="info-key">Tiers 0–3 (marked **)</span><span class="info-val">Subject to credit approval; term exceptions available</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>LTV and buy rate determined by both PNC Custom Score and Experian FICO 09 Auto Enhanced. Any changes to deal structure, term, or LTV may affect pricing.</span></div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">ID Required</span><span class="info-val">Government-issued ID required</span></div>
            <div class="info-row"><span class="info-key">Business Applications</span><span class="info-val">❌ Not eligible for financing</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Payoff Quotes</span><span class="info-val">Via Dealertrack or RouteOne (call 800-289-7028 if system outage)</span></div>
            <div class="info-row"><span class="info-key">Min Front End Amount</span><span class="info-val">$5,000</span></div>
            <div class="info-row"><span class="info-key">First Payment</span><span class="info-val">Up to 60 days; PA max 45 days</span></div>
            <div class="info-row"><span class="info-key">Approvals Valid</span><span class="info-val">60 days</span></div>
          </div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Total Advance</span><span class="info-val">140% of Factory Invoice (New) or Used Vehicle Value Source</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">125,000 miles (tier and term conditions apply)</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Front End LTV by Tier — New Vehicles</h4>
          <table class="mini-table">
            <thead><tr><th>Tier 0 (800+)</th><th>Tier 1 (760–799)</th><th>Tier 2 (725–759)</th><th>Tier 3 (700–724)</th><th>Tier 4 (680–699)</th></tr></thead>
            <tbody><tr><td>125% (≤72mo) / 115% (73–84mo)</td><td>115%</td><td>110%</td><td>110%</td><td>110%</td></tr></tbody>
          </table>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Front End LTV by Tier — Used Vehicles</h4>
          <table class="mini-table">
            <thead><tr><th>Tier 0 (800+)</th><th>Tier 1 (760–799)</th><th>Tier 2 (725–759)</th><th>Tier 3 (700–724)</th><th>Tier 4 (680–699)</th></tr></thead>
            <tbody><tr><td>115% (≤72mo) / 115% (73–84mo)</td><td>115%</td><td>110%</td><td>110%</td><td>110%</td></tr></tbody>
          </table>
          <div class="note-box info" style="margin-top:var(--space-3)"><span class="note-icon">ℹ️</span><span>Advance includes: Selling Price + all Taxes (front &amp; back end) + Title + License + Hard Adds + Dealer Fees + ALL Back End Products divided by Invoice/Used Value Source. Max advance is 140%.</span></div>
          <div class="note-box warn" style="margin-top:var(--space-2)"><span class="note-icon">⚠️</span><span>If Used Vehicle Value is not available, call underwriting at 800-752-2561 Option 1. No “like-invoice” or other values accepted.</span></div>
        `
      },
      backend: {
        icon: '🧩',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">GAP (LTV ≤95%)</span><span class="info-val">Greater of $3,500 or 16% of New Car Invoice / Used Vehicle Value Source, plus GAP</span></div>
            <div class="info-row"><span class="info-key">GAP (LTV &gt;95%)</span><span class="info-val">Greater of $3,500 or 15% of New Car Invoice / Used Vehicle Value Source, plus GAP</span></div>
            <div class="info-row"><span class="info-key">Max Total Advance</span><span class="info-val">140% of Factory Invoice (New) or Used Value Source</span></div>
            <div class="info-row"><span class="info-key">Aftermarket Products</span><span class="info-val">Only physically-added customizations; must be cancelable. No Credit Life, Disability, A&amp;H.</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>Vehicle must be untitled at time of sale to be eligible for customization valuation adjustment. Installation charges not included.</span></div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Buy Rate</span><span class="info-val">1% of amount financed</span></div>
            <div class="info-row"><span class="info-key">Buy Rate +0.50%</span><span class="info-val">2% of amount financed</span></div>
            <div class="info-row"><span class="info-key">Buy Rate +1.00%</span><span class="info-val">3% of amount financed</span></div>
            <div class="info-row"><span class="info-key">Max Flat Paid</span><span class="info-val">$3,000 (rounded to nearest dollar)</span></div>
            <div class="info-row"><span class="info-key">Min for Flat</span><span class="info-val">Terms ≥48 mo and amount financed ≥$10,000</span></div>
            <div class="info-row"><span class="info-key">Rate Cap — New (≤63 mo)</span><span class="info-val">2.50% over buy rate</span></div>
            <div class="info-row"><span class="info-key">Rate Cap — New (64–75 mo)</span><span class="info-val">2.00% over buy rate</span></div>
            <div class="info-row"><span class="info-key">Rate Cap — New (76–84 mo)</span><span class="info-val">1.75% over buy rate</span></div>
            <div class="info-row"><span class="info-key">Rate Cap — Used (≤75 mo)</span><span class="info-val">2.00% over buy rate</span></div>
            <div class="info-row"><span class="info-key">Rate Cap — Used (76–84 mo)</span><span class="info-val">1.75% over buy rate</span></div>
            <div class="info-row"><span class="info-key">BuyDown Program</span><span class="info-val">✅ Available — see approval callback for details</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Flat Payout Examples by Amount Financed (max $3,000)</h4>
          <table class="mini-table">
            <thead><tr><th>Amt Financed</th><th>Buy Rate (1%)</th><th>+0.50% (2%)</th><th>+1.00% (3%)</th></tr></thead>
            <tbody>
              <tr><td>$10,000</td><td>$100</td><td>$200</td><td>$300</td></tr>
              <tr><td>$15,000</td><td>$150</td><td>$300</td><td>$450</td></tr>
              <tr><td>$20,000</td><td>$200</td><td>$400</td><td>$600</td></tr>
              <tr><td>$25,000</td><td>$250</td><td>$500</td><td>$750</td></tr>
              <tr><td>$30,000</td><td>$300</td><td>$600</td><td>$900</td></tr>
              <tr><td>$50,000</td><td>$500</td><td>$1,000</td><td>$1,500</td></tr>
              <tr><td>$100,000</td><td>$1,000</td><td>$2,000</td><td>$3,000 (cap)</td></tr>
            </tbody>
          </table>
          <div class="note-box warn" style="margin-top:var(--space-2)"><span class="note-icon">⚠️</span><span>Max flat paid: $3,000. No flat on terms &lt;48 mo or financed &lt;$10,000. No flat or reserve paid on $75,000+ deals.</span></div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">New Vehicles</span><span class="info-val">Model years 2025–2027</span></div>
            <div class="info-row"><span class="info-key">Used Vehicles</span><span class="info-val">Model years 2019–2026 (varies by loan amount and term)</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">125,000 miles (tier and term conditions apply)</span></div>
            <div class="info-row"><span class="info-key">Used Value Source</span><span class="info-val">Kelly Blue Book (AZ, CA, CO, ID, NV, NM, OR, UT, WA) | J.D. Power Clean Retail (all other states)</span></div>
          </div>
          <div class="note-box error"><span class="note-icon">❌</span><span><strong>Ineligible:</strong> Branded/salvage/grey market/lemon/emergency/law enforcement vehicles; buses; cargo vans; Class 4–6 trucks; Class 7–8 medium/heavy duty; cab chassis; cutaway van chassis; commercial passenger vans; livery; ride share; rental; private or personal taxi service.</span></div>
        `
      }
    }
  },

  // ── DRIVEWAY FINANCE (DFC) ───────────────────────────────────
  {
    id: 'dfc',
    name: 'Driveway Finance',
    fullName: 'Driveway Finance Corporation (DFC)',
    abbr: 'DFC',
    colorClass: 'lc-dfc',
    docTitle: 'Lending Program Reference Sheet + Funding Guidelines',
    effectiveDate: 'August 13, 2025',
    segment: 'sub',
    segmentLabel: 'Sub-Prime',
    ficoMin: 580,
    ficoNotes: 'Tiers P0–P11 plus P10 No-Hit. Equifax FICO Version 8. P10 No-Hit accepted at reduced LTV. FICO 580+ required for flat fee.',
    maxTerm: 84,
    maxMileage: '175,000 mi',
    maxLTV: '135%',
    gapMax: '$1,200',
    reserveStructure: '85/15 split reserve. Flat: 1.5% at buy rate + optional 0.5% with AutoPay form. No flat on $75K+ deals.',
    chargebackWindow: 'N/A — confirm with rep',
    uniqueFeature: 'P10 No-Hit accepted; 14-yr vehicle age max; 175K mileage cap; 85/15 reserve split; AutoPay flat bonus; up to $100K max financed',
    bureaus: {
      primary: ['equifax'],
      note: 'Equifax FICO Version 8 used to determine score for tiering.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Tiers',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Bureau</span><span class="info-val">Equifax FICO Version 8</span></div>
            <div class="info-row"><span class="info-key">No-Hit / No Score</span><span class="info-val">P10 No-Hit tier accepted at reduced LTV (New: 90% front / 100% total; Used: 80% front / 90% total)</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Tier LTV Grid — New Vehicles</h4>
          <table class="mini-table">
            <thead><tr><th>Tier</th><th>Max Term</th><th>Front LTV</th><th>Total LTV</th></tr></thead>
            <tbody>
              <tr><td>P0</td><td>84 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P1</td><td>84 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P2</td><td>84 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P3</td><td>84 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P4</td><td>84 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P5</td><td>72 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P6</td><td>72 mo</td><td>120%</td><td>130%</td></tr>
              <tr><td>P7</td><td>72 mo</td><td>120%</td><td>130%</td></tr>
              <tr><td>P8</td><td>72 mo</td><td>120%</td><td>130%</td></tr>
              <tr><td>P9</td><td>60 mo</td><td>110%</td><td>120%</td></tr>
              <tr><td>P10</td><td>60 mo</td><td>100%</td><td>110%</td></tr>
              <tr><td>P11</td><td>72 mo</td><td>110%</td><td>120%</td></tr>
              <tr><td>P10 (No Hit)</td><td>60 mo</td><td>90%</td><td>100%</td></tr>
            </tbody>
          </table>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Tier LTV Grid — Used Vehicles</h4>
          <table class="mini-table">
            <thead><tr><th>Tier</th><th>Max Term</th><th>Front LTV</th><th>Total LTV</th></tr></thead>
            <tbody>
              <tr><td>P0</td><td>84 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P1</td><td>84 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P2</td><td>84 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P3</td><td>84 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P4</td><td>84 mo</td><td>120%</td><td>135%</td></tr>
              <tr><td>P5</td><td>72 mo</td><td>110%</td><td>125%</td></tr>
              <tr><td>P6</td><td>72 mo</td><td>110%</td><td>120%</td></tr>
              <tr><td>P7</td><td>72 mo</td><td>110%</td><td>120%</td></tr>
              <tr><td>P8</td><td>72 mo</td><td>110%</td><td>120%</td></tr>
              <tr><td>P9</td><td>60 mo</td><td>100%</td><td>110%</td></tr>
              <tr><td>P10</td><td>60 mo</td><td>100%</td><td>110%</td></tr>
              <tr><td>P11</td><td>72 mo</td><td>100%</td><td>110%</td></tr>
              <tr><td>P10 (No Hit)</td><td>60 mo</td><td>80%</td><td>90%</td></tr>
            </tbody>
          </table>
          <div class="note-box info" style="margin-top:var(--space-2)"><span class="note-icon">ℹ️</span><span>Loans over $75,000 require supervisor approval and may take additional time. No flat or reserve paid on $75K+ deals.</span></div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">ID Required</span><span class="info-val">Valid government-issued ID</span></div>
            <div class="info-row"><span class="info-key">Address</span><span class="info-val">Physical residence address required at application</span></div>
            <div class="info-row"><span class="info-key">POR Documents</span><span class="info-val">Must be in applicant’s name, dated within 30 days. Acceptable: DL, mortgage, utility bill, paystub, lease, credit/bank statement, doctor bill, Medicare/Medicaid, property tax, SS/pension summary, insurance declaration, or passport.</span></div>
            <div class="info-row"><span class="info-key">Co-Applicants</span><span class="info-val">If at same address: combined income. If separate: each must qualify individually.</span></div>
            <div class="info-row"><span class="info-key">References</span><span class="info-val">Up to 5 references may be required (name + 10-digit phone; 3 must be at separate address)</span></div>
            <div class="info-row"><span class="info-key">Welcome Call</span><span class="info-val">May be required prior to funding; must reach applicant by cell or landline</span></div>
          </div>
        `
      },
      income: {
        icon: '💰',
        label: 'Income Verification',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Paystub Requirement</span><span class="info-val">Within 30 days of contract date; must include employer name and YTD earnings</span></div>
            <div class="info-row"><span class="info-key">Internet Paystubs</span><span class="info-val">❌ Not accepted. Employment letters not accepted.</span></div>
            <div class="info-row"><span class="info-key">Alternative Docs</span><span class="info-val">Bank statements (all pages, up to 6 months most recent) may substitute paystub</span></div>
            <div class="info-row"><span class="info-key">Tip Income</span><span class="info-val">Only if consistent and applicant has been on job 6+ months</span></div>
            <div class="info-row"><span class="info-key">SSI / SSD / VA / Retirement</span><span class="info-val">Award letter or bank statements accepted. Non-taxable income may be grossed up 20%.</span></div>
            <div class="info-row"><span class="info-key">Alimony / Foster Care</span><span class="info-val">Up to 1 year bank statements required</span></div>
            <div class="info-row"><span class="info-key">Ineligible</span><span class="info-val">Seasonal, infrequent, or temporary employment does not qualify</span></div>
            <div class="info-row"><span class="info-key">Jan 1–Apr 1 Note</span><span class="info-val">DFC may request additional POI for accurate YTD assessment</span></div>
          </div>
        `
      },
      ltv: {
        icon: '📐',
        label: 'LTV & Terms',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Term</span><span class="info-val">Up to 84 months (P0–P4 new only)</span></div>
            <div class="info-row"><span class="info-key">Max Amount Financed</span><span class="info-val">$100,000 (no exceptions)</span></div>
            <div class="info-row"><span class="info-key">Max Vehicle Age</span><span class="info-val">14 model years old max; vehicles &gt;14 yrs or &gt;175K miles auto-declined (call for exception)</span></div>
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">175,000 miles (auto-decline above this)</span></div>
            <div class="info-row"><span class="info-key">New Vehicle Mileage Cap</span><span class="info-val">≤7,500 miles to qualify as new</span></div>
            <div class="info-row"><span class="info-key">Insurance</span><span class="info-val">Collision &amp; comprehensive required; max $1,000 deductible; all applicants must be covered drivers</span></div>
          </div>
        `
      },
      backend: {
        icon: '🧩',
        label: 'Backend Products',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Allowable Products</span><span class="info-val">Service Contracts (FESC), Maintenance Packages (lifetime oil), cancelable bundles with refund, GAP</span></div>
            <div class="info-row"><span class="info-key">Max GAP</span><span class="info-val">$1,200 or state cap (whichever is less); min 80% FELTV; min $12K amount financed; 60+ mo term</span></div>
            <div class="info-row"><span class="info-key">GAP — NY</span><span class="info-val">Available through TFS; max $190</span></div>
            <div class="info-row"><span class="info-key">Backend Allowance</span><span class="info-val">Dollar amount listed on deal approval — all products must be cancelable</span></div>
            <div class="info-row"><span class="info-key">Contract Coverage</span><span class="info-val">Service contract must cover at least half the term of the loan</span></div>
          </div>
        `
      },
      reserve: {
        icon: '💵',
        label: 'Reserve & Compensation',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Reserve Split</span><span class="info-val">85/15 split</span></div>
            <div class="info-row"><span class="info-key">Max Markup</span><span class="info-val">2 pts on terms 36–75 mo; 1 pt on terms over 75 mo</span></div>
            <div class="info-row"><span class="info-key">Flat — Buy Rate</span><span class="info-val">1.5% of amount financed (FICO 580+; 36 mo+; &lt;$75K OTD)</span></div>
            <div class="info-row"><span class="info-key">AutoPay Bonus Flat</span><span class="info-val">Additional 0.50% with completed &amp; current AutoPay form</span></div>
            <div class="info-row"><span class="info-key">No Flat / Reserve</span><span class="info-val">Loans $75,000+ — no flat or reserve paid</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Flat Payout Examples by Amount Financed</h4>
          <table class="mini-table">
            <thead><tr><th>Amt Financed</th><th>Buy Rate (1.5%)</th><th>With AutoPay (+0.5% = 2%)</th></tr></thead>
            <tbody>
              <tr><td>$10,000</td><td>$150</td><td>$200</td></tr>
              <tr><td>$15,000</td><td>$225</td><td>$300</td></tr>
              <tr><td>$20,000</td><td>$300</td><td>$400</td></tr>
              <tr><td>$25,000</td><td>$375</td><td>$500</td></tr>
              <tr><td>$30,000</td><td>$450</td><td>$600</td></tr>
              <tr><td>$40,000</td><td>$600</td><td>$800</td></tr>
              <tr><td>$50,000</td><td>$750</td><td>$1,000</td></tr>
            </tbody>
          </table>
          <div class="note-box warn" style="margin-top:var(--space-2)"><span class="note-icon">⚠️</span><span>FICO 580+ required for flat. Min 36 mo term. Under $75K OTD. AutoPay bonus requires completed &amp; current AutoPay form. Reserve split: 85% dealer / 15% DFC. Max markup: 2pts (36–75 mo), 1pt (76+ mo).</span></div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Mileage</span><span class="info-val">175,000 miles (auto-decline over limit)</span></div>
            <div class="info-row"><span class="info-key">Max Vehicle Age</span><span class="info-val">14 model years</span></div>
            <div class="info-row"><span class="info-key">New Vehicle Max Miles</span><span class="info-val">7,500 miles</span></div>
            <div class="info-row"><span class="info-key">Valuation</span><span class="info-val">KBB Lending Value or JD Power Clean Trade (dealership must pick one and be consistent)</span></div>
            <div class="info-row"><span class="info-key">CPO</span><span class="info-val">❌ No value increase for CPO</span></div>
          </div>
          <div class="note-box error"><span class="note-icon">❌</span><span><strong>Ineligible:</strong> Commercial use, large work trucks, cargo vans fitted for commercial/delivery, ride-sharing (“For Hire”), branded titles, grey market vehicles.</span></div>
          <div class="note-box warn" style="margin-top:var(--space-2)"><span class="note-icon">⚠️</span><span>Vehicles &gt;14 model years old or &gt;175,000 miles are auto-declined. Call for exception.</span></div>
        `
      }
    }
  },

  // ── FLAGSHIP CREDIT ACCEPTANCE ─────────────────────────────
  {
    id: 'flagship',
    name: 'Flagship Credit',
    fullName: 'Flagship Credit Acceptance',
    abbr: 'FCA',
    colorClass: 'lc-flagship',
    docTitle: 'National Program Guidelines v1.1',
    effectiveDate: 'January 2026',
    segment: 'sub',
    segmentLabel: 'Sub-Prime',
    ficoMin: 'Tier-based',
    ficoNotes: 'Tier-based approval. No stated minimum — see callback for tier structure. 7 days/week live analyst decisions plus automation.',
    maxTerm: 72,
    maxMileage: '140,000 mi (≤60 mo) / 120,000 mi (≤72 mo)',
    maxLTV: '150%',
    gapMax: '$1,200 or state max',
    reserveStructure: '70/30 split. Up to 2% participation per callback. Chargeback if loan closed before 3 payments or within 90 days.',
    chargebackWindow: '3 payments / 90 days',
    uniqueFeature: 'Live analysts 7 days/week; CPO +5% vehicle value auto-applied; protected income gross-up 25%; $4,500 max back-end',
    bureaus: {
      primary: ['equifax', 'transunion', 'experian'],
      note: 'All three bureaus — confirm primary bureau with rep at time of submission.',
      stateMap: {}
    },
    sections: {
      fico: {
        icon: '📊',
        label: 'FICO & Tiers',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">FICO Model</span><span class="info-val">Tier-based — see callback for specific tier cutoffs</span></div>
            <div class="info-row"><span class="info-key">Decisions</span><span class="info-val">Automated + Live Analysts, 7 days a week</span></div>
            <div class="info-row"><span class="info-key">Approval Validity</span><span class="info-val">30 days from approval date</span></div>
            <div class="info-row"><span class="info-key">Down Payment</span><span class="info-val">As low as $0 (varies by tier)</span></div>
          </div>
          <div class="note-box info"><span class="note-icon">ℹ️</span><span>Flagship provides expedited decisions with both automation and live analyst review available 7 days a week via Dealertrack and RouteOne.</span></div>
        `
      },
      terms: {
        icon: '📋',
        label: 'Terms & LTV',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Max Term</span><span class="info-val">Up to 72 months</span></div>
            <div class="info-row"><span class="info-key">Max Mileage (≤60 mo)</span><span class="info-val">140,000 miles</span></div>
            <div class="info-row"><span class="info-key">Max Mileage (≤72 mo)</span><span class="info-val">120,000 miles</span></div>
            <div class="info-row"><span class="info-key">Front-End Advance</span><span class="info-val">Up to 125%</span></div>
            <div class="info-row"><span class="info-key">Total LTV</span><span class="info-val">Up to 150%</span></div>
            <div class="info-row"><span class="info-key">Amount Financed</span><span class="info-val">$7,500 – $50,000</span></div>
            <div class="info-row"><span class="info-key">Vehicle Age</span><span class="info-val">Model year 10 years or newer</span></div>
            <div class="info-row"><span class="info-key">Vehicle Valuation</span><span class="info-val">JD Power Clean Trade (CA: KBB Lending Value Good)</span></div>
          </div>
          <div class="note-box success"><span class="note-icon">✅</span><span><strong>CPO Program:</strong> Approval pricing automatically reflects a 5% increase to vehicle value. Supporting CPO documents required to fund.</span></div>
        `
      },
      backend: {
        icon: '💰',
        label: 'Backend & Reserve',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Participation (Reserve)</span><span class="info-val">Up to 2% — see callback for rate</span></div>
            <div class="info-row"><span class="info-key">Reserve Split</span><span class="info-val">70/30 dealer/lender split</span></div>
            <div class="info-row"><span class="info-key">Chargeback</span><span class="info-val">Charged back if loan closed before 3 payments OR within 90 days</span></div>
            <div class="info-row"><span class="info-key">Max Back-End</span><span class="info-val">$4,500 total (subject to credit policy & state max)</span></div>
            <div class="info-row"><span class="info-key">Loan Processing Fee</span><span class="info-val">As low as $99</span></div>
            <div class="info-row"><span class="info-key">Discount Fee</span><span class="info-val">As low as $0 (may NOT be charged to applicant)</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Participation Products &amp; Caps</h4>
          <div class="info-grid">
            <div class="info-row"><span class="info-key">GAP</span><span class="info-val">$1,200 or state max</span></div>
            <div class="info-row"><span class="info-key">VSC</span><span class="info-val">$3,500 max — must be 24 mo / 24,000 mi minimum; must cover seals &amp; gaskets</span></div>
            <div class="info-row"><span class="info-key">Tire &amp; Wheel</span><span class="info-val">$1,500 max</span></div>
            <div class="info-row"><span class="info-key">Maintenance</span><span class="info-val">$1,500 max</span></div>
          </div>
        `
      },
      id: {
        icon: '🪪',
        label: 'ID & Residency',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Acceptable ID</span><span class="info-val">Valid Driver's License</span></div>
            <div class="info-row"><span class="info-key">Proof of Residence</span><span class="info-val">Driver's license, utility bill, phone bill, or cell phone bill — within 30 days of contract date</span></div>
            <div class="info-row"><span class="info-key">Valid Contact Info</span><span class="info-val">Required on all applications</span></div>
          </div>
        `
      },
      income: {
        icon: '💵',
        label: 'Income & Stips',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Minimum Income</span><span class="info-val">$3,000 per application</span></div>
            <div class="info-row"><span class="info-key">W2 Employment</span><span class="info-val">Minimum 3 months employment; if POI required, provide pay stub within 30 days</span></div>
            <div class="info-row"><span class="info-key">1099 / Self-Employed</span><span class="info-val">Minimum 12 months job length; last 3 months bank statements reflecting deposits + verification of business</span></div>
            <div class="info-row"><span class="info-key">Second Job Income</span><span class="info-val">Minimum 12 months at second job required for income to count</span></div>
            <div class="info-row"><span class="info-key">Protected Income Gross-Up</span><span class="info-val">Non-taxed income (SSI, pension, disability, etc.) grossed-up 25% by dealer at submission</span></div>
          </div>
          <div class="note-box warn"><span class="note-icon">⚠️</span><span><strong>Protected Income:</strong> Must be grossed up 25% by the dealer before submission. SSI requires most recent bank statement showing deposits + current year award letter or recent check (within 60 days; 90 days if award letter matches).</span></div>
          <div class="note-box error"><span class="note-icon">❌</span><span><strong>Ineligible:</strong> Employees of the submitting dealership are not eligible.</span></div>
        `
      },
      funding: {
        icon: '📦',
        label: 'Funding Requirements',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Approval Expiration</span><span class="info-val">30 days from approval</span></div>
            <div class="info-row"><span class="info-key">First Payment Deadline</span><span class="info-val">Contract must fund at least 5 business days prior to contracted first payment due date</span></div>
            <div class="info-row"><span class="info-key">Returned Contract Fee</span><span class="info-val">$195 per occurrence</span></div>
            <div class="info-row"><span class="info-key">Down Payment</span><span class="info-val">No post-dated checks, borrowed funds, or credit card charges accepted</span></div>
            <div class="info-row"><span class="info-key">eContracting</span><span class="info-val">Available on Dealertrack and RouteOne</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Required Funding Documents</h4>
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Contract</span><span class="info-val">Retail Installment Sales Contract — all pages of signed credit application</span></div>
            <div class="info-row"><span class="info-key">Buyer's Order</span><span class="info-val">Buyer's Order / Purchase Agreement</span></div>
            <div class="info-row"><span class="info-key">Vehicle</span><span class="info-val">Vehicle Invoice/Bookout + Title Application</span></div>
            <div class="info-row"><span class="info-key">Insurance</span><span class="info-val">Proof of Insurance required</span></div>
            <div class="info-row"><span class="info-key">Odometer</span><span class="info-val">Odometer statement required for ALL model years</span></div>
            <div class="info-row"><span class="info-key">Products</span><span class="info-val">VSC, GAP, and Maintenance Contract documentation (if applicable)</span></div>
          </div>
          <h4 style="margin:var(--space-3) 0 var(--space-2);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">Contact</h4>
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Credit / Decisions</span><span class="info-val">800-699-1438</span></div>
            <div class="info-row"><span class="info-key">Funding</span><span class="info-val">866-662-2652</span></div>
            <div class="info-row"><span class="info-key">Fax</span><span class="info-val">610-717-1924</span></div>
            <div class="info-row"><span class="info-key">Corporate</span><span class="info-val">800-707-0114</span></div>
          </div>
        `
      },
      vehicles: {
        icon: '🚗',
        label: 'Vehicle Eligibility',
        content: `
          <div class="info-grid">
            <div class="info-row"><span class="info-key">Model Year</span><span class="info-val">10 model years or newer</span></div>
            <div class="info-row"><span class="info-key">New Vehicle Definition</span><span class="info-val">Current model year; 6,000+ miles = treated as used</span></div>
            <div class="info-row"><span class="info-key">Max Mileage (≤60 mo)</span><span class="info-val">140,000 miles</span></div>
            <div class="info-row"><span class="info-key">Max Mileage (≤72 mo)</span><span class="info-val">120,000 miles</span></div>
            <div class="info-row"><span class="info-key">Valuation</span><span class="info-val">JD Power Clean Trade (CA: KBB Lending Value Good)</span></div>
            <div class="info-row"><span class="info-key">Multiple Vehicles</span><span class="info-val">Must be disclosed upfront; vehicle must be for applicant — no third-party purchases</span></div>
            <div class="info-row"><span class="info-key">Primary Use</span><span class="info-val">Personal only — no rideshare, delivery, or rental</span></div>
          </div>
          <div class="note-box error"><span class="note-icon">❌</span><span><strong>Ineligible:</strong> Branded/salvaged titles, TMU, lemon law, flood damage, frame/unibody damage, grey market vehicles, rideshare/delivery/rental use. Commercial use prohibited.</span></div>
        `
      }
    }
  }
];

// ============================================================
// DOM REFERENCES & STATE
// ============================================================
let currentTheme = 'dark';
let currentLender = null;
let searchQuery = '';

// ============================================================
// UTILITIES
// ============================================================
function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

function segmentToFicoClass(seg) {
  return { prime: 'green', near: 'blue', sub: 'amber', deep: 'red', all: 'blue' }[seg] || 'blue';
}
function segmentToBadge(seg) {
  return { prime: 'badge-prime', near: 'badge-near', sub: 'badge-sub', deep: 'badge-deep', all: 'badge-all' }[seg] || '';
}

// ============================================================
// THEME
// ============================================================
function initTheme() {
  // Respect system preference on first load
  currentTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  applyTheme();
}
function applyTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  const btn = $('#theme-toggle');
  if (btn) btn.title = currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme();
}

// ============================================================
// SIDEBAR RENDERING
// ============================================================
function buildSidebar() {
  const container = $('#sidebar-lenders');
  if (!container) return;
  container.innerHTML = LENDERS.map(l => `
    <div class="sidebar-item" data-id="${l.id}" role="button" tabindex="0" aria-label="View ${l.name}">
      <span class="sidebar-item-dot" style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:var(--color-${l.segment === 'prime' ? 'green' : l.segment === 'near' ? 'blue' : l.segment === 'all' ? 'blue' : l.segment === 'sub' ? 'accent' : 'red'})"></span>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.name}</span>
      <span class="lender-badge ${segmentToBadge(l.segment)}">${l.segmentLabel.split('-')[0]}</span>
    </div>
  `).join('');
}

// ============================================================
// COMPARE TABLE
// ============================================================
function buildCompareTable() {
  const tbody = $('#compare-tbody');
  if (!tbody) return;
  tbody.innerHTML = LENDERS.map(l => `
    <tr data-id="${l.id}" title="Click to view full ${l.name} program details">
      <td>
        <div class="lender-name-cell">
          ${l.name}
          <small>${l.fullName}</small>
          ${l.stateRestriction ? `<small style="color:var(--color-red)">${l.stateRestriction}</small>` : ''}
        </div>
      </td>
      <td><span class="fico-chip ${segmentToFicoClass(l.segment)}">${l.ficoMin ? l.ficoMin + '+' : 'Tier-Based'}</span></td>
      <td><span class="chip ${segmentToFicoClass(l.segment)}">${l.segmentLabel}</span></td>
      <td>${l.maxTerm ? l.maxTerm + ' mo' : 'Per Program'}</td>
      <td>${l.maxMileage}</td>
      <td>${l.maxLTV}</td>
      <td>${l.gapMax}</td>
      <td style="max-width:200px;font-size:var(--text-xs);color:var(--color-text-2)">${l.reserveStructure}</td>
      <td>
        <span class="chargeback-badge" style="${l.chargebackWindow === 'NO CHARGEBACKS' ? 'background:var(--color-green-dim);border-color:rgba(34,197,94,0.3);color:var(--color-green)' : ''}">
          ${l.chargebackWindow}
        </span>
      </td>
    </tr>
  `).join('');
}

// ============================================================
// LENDER DETAIL PAGE
// ============================================================
function buildLenderDetail(lender) {
  const view = $('#view-lender');
  if (!view) return;

  const chips = [
    lender.maxTerm ? `<span class="chip">${lender.maxTerm} mo max</span>` : '<span class="chip">Term per Buy Program</span>',
    `<span class="chip">${lender.maxMileage}</span>`,
    `<span class="chip ${segmentToFicoClass(lender.segment)}">${lender.segmentLabel}</span>`,
    lender.ficoMin ? `<span class="chip green">FICO ${lender.ficoMin}+</span>` : `<span class="chip">FICO Tier-Based</span>`,
    lender.stateRestriction ? `<span class="chip red">${lender.stateRestriction}</span>` : ''
  ].filter(Boolean).join('');

  const stats = [
    { label: 'Min FICO', value: lender.ficoMin ? lender.ficoMin.toString() : 'N/A', sub: lender.ficoNotes.substring(0, 40) + '…', cls: 'green' },
    { label: 'Max Term', value: lender.maxTerm ? lender.maxTerm + ' mo' : 'Per Prog.', sub: 'Maximum finance term', cls: '' },
    { label: 'Max Mileage', value: lender.maxMileage, sub: 'Vehicle odometer limit', cls: 'blue' },
    { label: 'Max LTV', value: lender.maxLTV, sub: 'Total loan-to-value', cls: 'accent' },
    { label: 'GAP Max', value: lender.gapMax, sub: 'Maximum GAP product', cls: '' },
    { label: 'Chargeback', value: lender.chargebackWindow === 'NO CHARGEBACKS' ? '✓ None' : lender.chargebackWindow.replace('payments', 'pymts'), sub: 'Chargeback window', cls: lender.chargebackWindow === 'NO CHARGEBACKS' ? 'green' : '' }
  ];

  const sectionsHTML = Object.values(lender.sections).map(s => `
    <div class="detail-section">
      <div class="detail-section-header">
        <div class="section-icon">${s.icon}</div>
        <h3>${s.label}</h3>
        <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="detail-section-body">${s.content}</div>
    </div>
  `).join('');

  view.innerHTML = `
    <div class="lender-hero">
      <div class="lender-icon ${lender.colorClass}" aria-hidden="true">${lender.abbr}</div>
      <div class="lender-hero-info">
        <h1>${lender.fullName}</h1>
        <div class="doc-meta">${lender.docTitle} &nbsp;·&nbsp; Effective ${lender.effectiveDate}</div>
        <div class="lender-hero-chips">${chips}</div>
        <div class="note-box info" style="margin-top:var(--space-3);font-size:var(--text-xs)">
          <span class="note-icon">ℹ️</span>
          <span>${lender.ficoNotes}</span>
        </div>
        ${lender.uniqueFeature ? `<div class="note-box success" style="margin-top:var(--space-2);font-size:var(--text-xs)"><span class="note-icon">⭐</span><span><strong>Notable:</strong> ${lender.uniqueFeature}</span></div>` : ''}
      </div>
    </div>

    <div class="stat-grid">
      ${stats.map(s => `
        <div class="stat-card">
          <div class="stat-label">${s.label}</div>
          <div class="stat-value ${s.cls}">${s.value}</div>
          <div class="stat-sub">${s.sub}</div>
        </div>
      `).join('')}
    </div>

    ${sectionsHTML}
  `;

  // Section collapse/expand
  $$('.detail-section-header', view).forEach(hdr => {
    hdr.addEventListener('click', () => {
      hdr.closest('.detail-section').classList.toggle('collapsed');
    });
    hdr.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') hdr.click();
    });
  });
}

// ============================================================
// NAVIGATION
// ============================================================
function showView(name, lenderId) {
  // Hide all views
  $$('.view').forEach(v => v.classList.remove('active'));
  $$('.sidebar-item').forEach(s => s.classList.remove('active'));

  if (name === 'compare') {
    $('#view-compare').classList.add('active');
    $('#sidebar-compare').classList.add('active');
    currentLender = null;
  } else if (name === 'lender' && lenderId) {
    const lender = LENDERS.find(l => l.id === lenderId);
    if (!lender) return;
    buildLenderDetail(lender);
    $('#view-lender').classList.add('active');
    currentLender = lenderId;
    const sidebarItem = $(`.sidebar-item[data-id="${lenderId}"]`);
    if (sidebarItem) sidebarItem.classList.add('active');
    // Scroll main to top
    $('#main').scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // Mobile: close sidebar
  closeMobileSidebar();
}

// ============================================================
// SEARCH
// ============================================================
function handleSearch(query) {
  searchQuery = query.trim().toLowerCase();
  if (!searchQuery) return;

  // Filter sidebar items
  $$('.sidebar-item[data-id]').forEach(item => {
    const lenderId = item.getAttribute('data-id');
    const lender = LENDERS.find(l => l.id === lenderId);
    const text = (lender.name + ' ' + lender.fullName + ' ' + lender.ficoNotes).toLowerCase();
    item.style.display = text.includes(searchQuery) ? '' : 'none';
  });
}

function clearSearch() {
  searchQuery = '';
  $$('.sidebar-item[data-id]').forEach(item => { item.style.display = ''; });
}

// ============================================================
// MOBILE SIDEBAR
// ============================================================
function openMobileSidebar() {
  $('#sidebar').classList.add('open');
  $('#sidebar-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMobileSidebar() {
  $('#sidebar').classList.remove('open');
  const overlay = $('#sidebar-overlay');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ============================================================
// INIT
// ============================================================
function init() {
  initTheme();
  buildSidebar();
  buildCompareTable();

  // Theme toggle
  const themeBtn = $('#theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Compare view click (sidebar)
  const sidebarCompare = $('#sidebar-compare');
  if (sidebarCompare) sidebarCompare.addEventListener('click', () => showView('compare'));
  sidebarCompare?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') showView('compare'); });

  // Lender sidebar items
  $$('.sidebar-item[data-id]').forEach(item => {
    item.addEventListener('click', () => showView('lender', item.getAttribute('data-id')));
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') item.click(); });
  });

  // Compare table row click
  $$('#compare-tbody tr').forEach(row => {
    row.addEventListener('click', () => showView('lender', row.getAttribute('data-id')));
  });

  // Search
  const searchInput = $('#search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const q = e.target.value;
      if (!q) clearSearch();
      else handleSearch(q);
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') { searchInput.value = ''; clearSearch(); }
    });
  }

  // Mobile menu toggle
  const menuToggle = $('#menu-toggle');
  if (menuToggle) menuToggle.addEventListener('click', openMobileSidebar);

  const overlay = $('#sidebar-overlay');
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  // Start on compare view
  showView('compare');

  // Tools
  initIncomeCalculator();
  initDateCalculator();
  initBureauSearch();
  initLTVCalculator();
  initDealStructurer();
  initSideBySideCompare();
}

document.addEventListener('DOMContentLoaded', init);

// ============================================================
// KFA INCENTIVES — Model tab + APR/Lease toggle (delegated)
// Must live here (not in template string) because innerHTML
// does not execute injected <script> tags.
// ============================================================
document.addEventListener('click', function(e) {
  // Model tab switching
  const tab = e.target.closest('.kfa-tab');
  if (tab) {
    const bar = tab.closest('.kfa-tab-bar');
    const container = bar && bar.parentElement;
    if (!bar || !container) return;
    bar.querySelectorAll('.kfa-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const model = tab.dataset.model;
    container.querySelectorAll('.kfa-model-panel').forEach(p => p.classList.remove('active'));
    const panel = container.querySelector(`.kfa-model-panel[data-panel="${model}"]`);
    if (panel) panel.classList.add('active');
    return;
  }
  // APR / Lease prog-type toggle within each model panel
  const progBtn = e.target.closest('.kfa-prog-btn');
  if (progBtn) {
    const modelPanel = progBtn.closest('.kfa-model-panel');
    if (!modelPanel) return;
    const toggle = progBtn.closest('.kfa-program-toggle');
    toggle.querySelectorAll('.kfa-prog-btn').forEach(b => b.classList.remove('active'));
    progBtn.classList.add('active');
    const prog = progBtn.dataset.prog;
    modelPanel.querySelectorAll('.kfa-prog-panel').forEach(p => p.classList.remove('active'));
    const progPanel = modelPanel.querySelector(`.kfa-prog-panel[data-progpanel="${prog}"]`);
    if (progPanel) progPanel.classList.add('active');
  }
});

// ============================================================
// INCOME CALCULATOR
// ============================================================
function initIncomeCalculator() {
  const btn      = $('#income-calc-btn');
  const modal    = $('#modal-income');
  const closeBtn = $('#income-modal-close');
  const backdrop = modal?.querySelector('.tool-modal-backdrop');
  const typeEl   = $('#income-type');
  const hoursRow = $('#income-hours-row');
  const runBtn   = $('#income-calc-run');

  if (!btn || !modal) return;

  function openModal() {
    modal.hidden = false;
    modal.removeAttribute('hidden');
    $('#income-amount')?.focus();
  }
  function closeModal() { modal.hidden = true; modal.setAttribute('hidden', ''); }

  btn.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  const paystubRow  = $('#income-paystub-row');
  const amountLabel = $('#income-amount-label');

  // Show/hide contextual rows based on pay type
  function updateIncomeFields() {
    const t = typeEl.value;
    if (hoursRow)   hoursRow.style.display   = t === 'hourly'  ? 'flex' : 'none';
    if (paystubRow) paystubRow.style.display  = t === 'paystub' ? 'flex' : 'none';
    if (amountLabel) amountLabel.textContent  = t === 'paystub' ? 'Period Gross Amount ($)' : 'Gross Amount ($)';
  }
  typeEl?.addEventListener('change', updateIncomeFields);
  updateIncomeFields(); // run on init (biweekly default — hides both extra rows)

  runBtn?.addEventListener('click', () => {
    const type   = typeEl?.value;
    const amount = parseFloat($('#income-amount')?.value);
    const hours  = parseFloat($('#income-hours')?.value) || 40;

    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid dollar amount.');
      return;
    }

    let annual = 0;
    let noteText = '';

    switch (type) {
      case 'hourly':
        annual = amount * hours * 52;
        noteText = `Based on $${amount.toFixed(2)}/hr × ${hours} hrs/wk × 52 weeks.`;
        break;
      case 'weekly':
        annual = amount * 52;
        noteText = `Based on $${fmt(amount)} weekly × 52 pay periods.`;
        break;
      case 'biweekly':
        annual = amount * 26;
        noteText = `Based on $${fmt(amount)} bi-weekly × 26 pay periods.`;
        break;
      case 'semimonthly':
        annual = amount * 24;
        noteText = `Based on $${fmt(amount)} semi-monthly × 24 pay periods.`;
        break;
      case 'monthly':
        annual = amount * 12;
        noteText = `Based on $${fmt(amount)} monthly × 12 months.`;
        break;
      case 'annual':
        annual = amount;
        noteText = `Annual salary entered directly.`;
        break;
      case 'paystub': {
        const startVal = $('#income-period-start')?.value;
        const endVal   = $('#income-period-end')?.value;
        if (!startVal || !endVal) { alert('Please enter both period start and end dates.'); return; }
        const [sy, sm, sd] = startVal.split('-').map(Number);
        const [ey, em, ed] = endVal.split('-').map(Number);
        const startDate = new Date(sy, sm - 1, sd);
        const endDate   = new Date(ey, em - 1, ed);
        const diffDays  = Math.round((endDate - startDate) / 86400000) + 1; // inclusive
        if (diffDays <= 0) { alert('Period end date must be after start date.'); return; }
        const dailyGross = amount / diffDays;
        annual = dailyGross * 365;
        noteText = `Pay period: ${diffDays} days | Gross: $${fmt(amount)} | Daily rate: $${fmt(dailyGross)} | Annualized using 365-day method.`;
        break;
      }
    }

    const monthly  = annual / 12;
    const biweekly = annual / 26;
    const weekly   = annual / 52;

    $('#res-annual').textContent   = '$' + fmt(annual);
    $('#res-monthly').textContent  = '$' + fmt(monthly);
    $('#res-biweekly').textContent = '$' + fmt(biweekly);
    $('#res-weekly').textContent   = '$' + fmt(weekly);
    $('#income-note').textContent  = noteText;

    const results = $('#income-results');
    results.hidden = false;
    results.removeAttribute('hidden');
  });

  // Allow Enter key to trigger calc
  $('#income-amount')?.addEventListener('keydown', e => { if (e.key === 'Enter') runBtn?.click(); });
  $('#income-hours')?.addEventListener('keydown',  e => { if (e.key === 'Enter') runBtn?.click(); });
}

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================================
// 20-DAY DATE CALCULATOR
// ============================================================
function initDateCalculator() {
  const btn      = $('#date-calc-btn');
  const modal    = $('#modal-date');
  const closeBtn = $('#date-modal-close');
  const backdrop = modal?.querySelector('.tool-modal-backdrop');
  const runBtn   = $('#date-calc-run');
  const dateInput = $('#date-start');

  if (!btn || !modal) return;

  function openModal() {
    modal.hidden = false;
    modal.removeAttribute('hidden');
    // Default to today
    if (!dateInput.value) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      dateInput.value = `${y}-${m}-${d}`;
    }
  }
  function closeModal() { modal.hidden = true; modal.setAttribute('hidden', ''); }

  btn.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  runBtn?.addEventListener('click', () => {
    const val = dateInput?.value;
    if (!val) { alert('Please select a start date.'); return; }

    // Parse date as local (avoid UTC offset shift)
    const [yr, mo, dy] = val.split('-').map(Number);
    const start = new Date(yr, mo - 1, dy);
    const deadline = new Date(yr, mo - 1, dy + 20);

    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    function fmtDate(d) {
      return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    // Days remaining from today
    const todayMid = new Date();
    todayMid.setHours(0,0,0,0);
    const diffMs = deadline - todayMid;
    const daysLeft = Math.ceil(diffMs / 86400000);

    const isWeekend = deadline.getDay() === 0 || deadline.getDay() === 6;

    $('#res-start-date').textContent  = fmtDate(start);
    $('#res-20day').textContent       = fmtDate(deadline);
    $('#res-day-of-week').textContent = DAYS[deadline.getDay()];

    const daysLeftEl = $('#res-days-left');
    if (daysLeft < 0) {
      daysLeftEl.textContent = 'Expired';
      daysLeftEl.style.color = 'var(--color-red)';
    } else if (daysLeft === 0) {
      daysLeftEl.textContent = 'TODAY';
      daysLeftEl.style.color = 'var(--color-accent)';
    } else {
      daysLeftEl.textContent = daysLeft + (daysLeft === 1 ? ' day' : ' days');
      daysLeftEl.style.color = daysLeft <= 3 ? 'var(--color-red)' : daysLeft <= 7 ? 'var(--color-accent)' : '';
    }

    let note = '20 calendar days from the contract date.';
    if (isWeekend) note += ' ⚠️ Deadline falls on a ' + DAYS[deadline.getDay()] + ' — confirm with lender for business-day adjustments.';
    if (daysLeft < 0) note += ' This deadline has already passed.';
    $('#date-note').textContent = note;

    const results = $('#date-results');
    results.hidden = false;
    results.removeAttribute('hidden');
  });

  // Enter key triggers calc
  dateInput?.addEventListener('keydown', e => { if (e.key === 'Enter') runBtn?.click(); });
}

// ============================================================
// BUREAU SEARCH
// ============================================================
function initBureauSearch() {
  const btn      = $('#bureau-search-btn');
  const modal    = $('#modal-bureau');
  const closeBtn = $('#bureau-modal-close');
  const backdrop = modal?.querySelector('.tool-modal-backdrop');
  const runBtn   = $('#bureau-search-run');

  if (!btn || !modal) return;

  function openModal() {
    modal.hidden = false;
    modal.removeAttribute('hidden');
    $('#bureau-eq')?.focus();
  }
  function closeModal() { modal.hidden = true; modal.setAttribute('hidden', ''); }

  btn.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  runBtn?.addEventListener('click', () => {
    const eq = parseInt($('#bureau-eq')?.value) || null;
    const tu = parseInt($('#bureau-tu')?.value) || null;
    const ex = parseInt($('#bureau-ex')?.value) || null;

    if (!eq && !tu && !ex) {
      alert('Please enter at least one bureau score.');
      return;
    }

    const scores = { equifax: eq, transunion: tu, experian: ex };
    const BUREAU_LABELS = { equifax: 'Equifax', transunion: 'TransUnion', experian: 'Experian' };
    const BUREAU_COLORS = { equifax: '#e74c3c', transunion: '#3498db', experian: '#8e44ad' };

    // Build results for each lender
    const results = LENDERS.map(l => {
      if (!l.bureaus) return null;

      // Find the best score this lender can see
      let bestScore = null;
      let bestBureau = null;
      let qualifies = false;
      const usedBureaus = [];

      l.bureaus.primary.forEach(b => {
        const s = scores[b];
        if (s !== null) {
          usedBureaus.push({ bureau: b, score: s });
          if (bestScore === null || s > bestScore) {
            bestScore = s;
            bestBureau = b;
          }
        }
      });

      if (bestScore !== null && bestScore >= l.ficoMin) {
        qualifies = true;
      }

      return { lender: l, bestScore, bestBureau, usedBureaus, qualifies };
    }).filter(Boolean);

    const passing = results.filter(r => r.qualifies);
    const failing = results.filter(r => !r.qualifies);

    const list = $('#bureau-results-list');
    list.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-1)';
    header.innerHTML = `
      <span style="font-size:var(--text-sm);font-weight:700">Scores entered:</span>
      ${['equifax','transunion','experian'].map(b => scores[b] ? `<span style="background:${BUREAU_COLORS[b]}22;border:1px solid ${BUREAU_COLORS[b]}66;color:${BUREAU_COLORS[b]};border-radius:20px;padding:2px 10px;font-size:var(--text-xs);font-weight:700">${BUREAU_LABELS[b]}: ${scores[b]}</span>` : '').join('')}
    `;
    list.appendChild(header);

    // Passing lenders
    if (passing.length) {
      const passLabel = document.createElement('div');
      passLabel.style.cssText = 'font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-green);margin-top:var(--space-2)';
      passLabel.textContent = `✓ ${passing.length} Lender${passing.length !== 1 ? 's' : ''} Can Work`;
      list.appendChild(passLabel);

      passing.forEach(r => {
        const card = buildBureauCard(r, scores, BUREAU_LABELS, BUREAU_COLORS, true);
        list.appendChild(card);
      });
    }

    // Failing lenders
    if (failing.length) {
      const failLabel = document.createElement('div');
      failLabel.style.cssText = 'font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-red);margin-top:var(--space-3)';
      failLabel.textContent = `✗ ${failing.length} Lender${failing.length !== 1 ? 's' : ''} Below Minimum`;
      list.appendChild(failLabel);

      failing.forEach(r => {
        const card = buildBureauCard(r, scores, BUREAU_LABELS, BUREAU_COLORS, false);
        list.appendChild(card);
      });
    }

    // Note
    const noteEl = $('#bureau-note');
    noteEl.textContent = 'Results based on lender bureau preference and minimum FICO from program guidelines. Always verify bureau usage with lender prior to submitting.';

    const resultsEl = $('#bureau-results');
    resultsEl.hidden = false;
    resultsEl.removeAttribute('hidden');
  });

  // Enter on any score input triggers search
  ['bureau-eq','bureau-tu','bureau-ex'].forEach(id => {
    $(`#${id}`)?.addEventListener('keydown', e => { if (e.key === 'Enter') runBtn?.click(); });
  });
}

function buildBureauCard(r, scores, BUREAU_LABELS, BUREAU_COLORS, qualifies) {
  const l = r.lender;
  const card = document.createElement('div');
  card.style.cssText = `background:var(--color-bg-3);border:1px solid ${qualifies ? 'var(--color-green)' : 'var(--color-border-strong)'};border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);display:flex;flex-direction:column;gap:6px;cursor:pointer;transition:border-color .15s;`;

  // Row 1: lender name + segment badge + FICO min
  const top = document.createElement('div');
  top.style.cssText = 'display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap';
  top.innerHTML = `
    <span class="lender-badge ${segmentToBadge(l.segment)}" style="font-size:.65rem">${l.segmentLabel}</span>
    <span style="font-weight:700;font-size:var(--text-sm)">${l.name}</span>
    <span style="margin-left:auto;font-size:var(--text-xs);color:var(--color-text-3)">Min FICO: <strong style="color:var(--color-text)">${l.ficoMin}</strong></span>
  `;
  card.appendChild(top);

  // Row 2: bureau score chips
  const bureauRow = document.createElement('div');
  bureauRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center';

  l.bureaus.primary.forEach(b => {
    const score = scores[b];
    const isBest = b === r.bestBureau;
    const meetsMin = score !== null && score >= l.ficoMin;
    const color = BUREAU_COLORS[b];
    const chip = document.createElement('span');
    chip.style.cssText = `background:${color}22;border:1.5px solid ${isBest && qualifies ? color : meetsMin ? color + '66' : 'var(--color-border-strong)'};color:${score !== null ? color : 'var(--color-text-3)'};border-radius:20px;padding:2px 10px;font-size:var(--text-xs);font-weight:700;display:inline-flex;align-items:center;gap:4px`;
    chip.innerHTML = `${BUREAU_LABELS[b]}: ${score !== null ? score : '<em style="font-weight:400">N/A</em>'}`
      + (isBest && qualifies ? ' <span title="Used for decision" style="font-size:.8em">&#9679;</span>' : '');
    bureauRow.appendChild(chip);
  });
  card.appendChild(bureauRow);

  // Row 3: bureau note
  if (l.bureaus.note) {
    const noteDiv = document.createElement('div');
    noteDiv.style.cssText = 'font-size:var(--text-xs);color:var(--color-text-3);line-height:1.4';
    noteDiv.textContent = l.bureaus.note;
    card.appendChild(noteDiv);
  }

  // Click through to lender detail
  card.addEventListener('click', () => {
    closeAllModals();
    showView('lender', l.id);
  });
  card.addEventListener('mouseenter', () => { card.style.borderColor = qualifies ? 'var(--color-green)' : 'var(--color-accent)'; });
  card.addEventListener('mouseleave', () => { card.style.borderColor = qualifies ? 'var(--color-green)' : 'var(--color-border-strong)'; });

  return card;
}

function closeAllModals() {
  ['modal-income','modal-bureau','modal-date','modal-ltv','modal-deal','modal-compare-tool'].forEach(id => {
    const m = $(`#${id}`);
    if (m) { m.hidden = true; m.setAttribute('hidden',''); }
  });
}

// ============================================================
// LTV CALCULATOR
// ============================================================
function initLTVCalculator() {
  const openBtn  = $('#ltv-calc-btn');
  const modal    = $('#modal-ltv');
  const closeBtn = $('#ltv-modal-close');
  const backdrop = modal?.querySelector('.tool-modal-backdrop');
  const runBtn   = $('#ltv-calc-run');

  function openModal() {
    closeAllModals();
    modal.hidden = false;
    modal.removeAttribute('hidden');
    $('#ltv-book')?.focus();
  }
  function closeModal() { modal.hidden = true; modal.setAttribute('hidden',''); }

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  // Enter on inputs triggers run
  ['ltv-book','ltv-financed'].forEach(id => {
    $(`#${id}`)?.addEventListener('keydown', e => { if (e.key === 'Enter') runBtn?.click(); });
  });

  runBtn?.addEventListener('click', () => {
    const book     = parseFloat($('#ltv-book').value) || 0;
    const financed = parseFloat($('#ltv-financed').value) || 0;
    const vtype    = $('#ltv-type').value;

    if (!book || !financed) {
      alert('Please enter both a book value and amount financed.');
      return;
    }

    const actualLTV = (financed / book) * 100;

    // Summary box
    const summaryEl = $('#ltv-summary');
    const ltvColor  = actualLTV <= 110 ? 'var(--color-green)' : actualLTV <= 130 ? 'var(--color-accent)' : actualLTV <= 150 ? '#f97316' : 'var(--color-red)';
    summaryEl.innerHTML = `
      <div class="ltv-summary-box" style="border-color:${ltvColor}">
        <div class="ltv-summary-stat">
          <div class="ltv-summary-label">Book Value</div>
          <div class="ltv-summary-val">$${book.toLocaleString()}</div>
        </div>
        <div class="ltv-summary-stat">
          <div class="ltv-summary-label">Amount Financed</div>
          <div class="ltv-summary-val">$${financed.toLocaleString()}</div>
        </div>
        <div class="ltv-summary-stat highlight">
          <div class="ltv-summary-label">Actual LTV</div>
          <div class="ltv-summary-val" style="color:${ltvColor}">${actualLTV.toFixed(1)}%</div>
        </div>
      </div>`;

    // Per-lender results
    const listEl = $('#ltv-lender-results');
    listEl.innerHTML = '';

    // Separate passing from failing
    const passing = [];
    const failing = [];

    LENDERS.forEach(l => {
      const ltvStr = l.maxLTV || '';
      const ltvNum = parseFloat(ltvStr.replace('%',''));
      if (isNaN(ltvNum)) return; // skip if no parseable LTV

      // For front-end advance check (some lenders split front vs total)
      // We use maxLTV as the total cap
      const passes = actualLTV <= ltvNum;
      (passes ? passing : failing).push({ l, ltvNum, passes });
    });

    // Sort passing by LTV cap descending (most flexible first)
    passing.sort((a, b) => b.ltvNum - a.ltvNum);
    failing.sort((a, b) => b.ltvNum - a.ltvNum);

    // Section: Eligible
    if (passing.length) {
      const hdr = document.createElement('div');
      hdr.className = 'bureau-section-label pass';
      hdr.textContent = `✅ Eligible (${passing.length} lender${passing.length !== 1 ? 's' : ''})`;
      listEl.appendChild(hdr);
      passing.forEach(({ l, ltvNum }) => listEl.appendChild(buildLTVCard(l, actualLTV, ltvNum, true)));
    }

    // Section: Ineligible
    if (failing.length) {
      const hdr = document.createElement('div');
      hdr.className = 'bureau-section-label fail';
      hdr.textContent = `❌ Over LTV Cap (${failing.length} lender${failing.length !== 1 ? 's' : ''})`;
      listEl.appendChild(hdr);
      failing.forEach(({ l, ltvNum }) => listEl.appendChild(buildLTVCard(l, actualLTV, ltvNum, false)));
    }

    const resultsEl = $('#ltv-results');
    resultsEl.hidden = false;
    resultsEl.removeAttribute('hidden');
  });
}

function buildLTVCard(l, actualLTV, capLTV, passes) {
  const card = document.createElement('div');
  card.style.cssText = `background:var(--color-bg-3);border:1px solid ${passes ? 'var(--color-green)' : 'var(--color-border-strong)'};border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);display:flex;align-items:center;gap:var(--space-3);cursor:pointer;transition:border-color .15s;`;

  const headroom = capLTV - actualLTV;
  const barWidth = Math.min(100, (actualLTV / capLTV) * 100);
  const barColor = passes
    ? (headroom > 20 ? 'var(--color-green)' : 'var(--color-accent)')
    : 'var(--color-red)';

  card.innerHTML = `
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:4px;flex-wrap:wrap">
        <span class="lender-badge ${segmentToBadge(l.segment)}" style="font-size:.65rem">${l.segmentLabel}</span>
        <span style="font-weight:700;font-size:var(--text-sm)">${l.name}</span>
        <span style="margin-left:auto;font-size:var(--text-xs);color:var(--color-text-3)">Cap: <strong style="color:var(--color-text)">${capLTV}%</strong></span>
      </div>
      <div style="background:var(--color-bg-2);border-radius:4px;height:6px;overflow:hidden;margin-top:4px">
        <div style="height:100%;width:${barWidth}%;background:${barColor};border-radius:4px;transition:width .3s"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:var(--text-xs);color:var(--color-text-3)">
        <span>Your LTV: <strong style="color:${barColor}">${actualLTV.toFixed(1)}%</strong></span>
        <span>${passes ? `<span style="color:var(--color-green)">+${headroom.toFixed(1)}% headroom</span>` : `<span style="color:var(--color-red)">${Math.abs(headroom).toFixed(1)}% over cap</span>`}</span>
      </div>
    </div>`;

  card.addEventListener('click', () => { closeAllModals(); showView('lender', l.id); });
  card.addEventListener('mouseenter', () => { card.style.borderColor = passes ? 'var(--color-green)' : 'var(--color-accent)'; });
  card.addEventListener('mouseleave', () => { card.style.borderColor = passes ? 'var(--color-green)' : 'var(--color-border-strong)'; });
  return card;
}

// ============================================================
// DEAL STRUCTURER
// ============================================================
function initDealStructurer() {
  const openBtn  = $('#deal-struct-btn');
  const modal    = $('#modal-deal');
  const closeBtn = $('#deal-modal-close');
  const backdrop = modal?.querySelector('.tool-modal-backdrop');
  const runBtn   = $('#deal-struct-run');

  function openModal() {
    closeAllModals();
    modal.hidden = false;
    modal.removeAttribute('hidden');
    $('#ds-price')?.focus();
  }
  function closeModal() { modal.hidden = true; modal.setAttribute('hidden',''); }

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  runBtn?.addEventListener('click', () => {
    const price   = parseFloat($('#ds-price').value)   || 0;
    const trade   = parseFloat($('#ds-trade').value)   || 0;
    const down    = parseFloat($('#ds-down').value)    || 0;
    const backend = parseFloat($('#ds-backend').value) || 0;
    const target  = parseFloat($('#ds-target').value)  || 0;
    const prefTerm= parseInt($('#ds-term').value)      || 0;
    const fico    = parseInt($('#ds-fico').value)      || 0;
    const vtype   = $('#ds-vtype').value;

    if (!price) { alert('Please enter a vehicle price.'); return; }

    // Amount financed = price - trade equity - down + backend
    const amtFinanced = price - trade - down + backend;
    const bookLTV     = price > 0 ? (amtFinanced / price) * 100 : 0;

    if (amtFinanced <= 0) {
      alert('Amount financed is zero or negative — deal is already paid off with trade/down.');
      return;
    }

    // Summary
    const summaryEl = $('#deal-summary');
    summaryEl.innerHTML = `
      <div class="ltv-summary-box" style="border-color:var(--color-accent)">
        <div class="ltv-summary-stat">
          <div class="ltv-summary-label">Vehicle Price</div>
          <div class="ltv-summary-val">$${price.toLocaleString()}</div>
        </div>
        <div class="ltv-summary-stat">
          <div class="ltv-summary-label">Trade ${trade >= 0 ? 'Equity' : 'Payoff'}</div>
          <div class="ltv-summary-val" style="color:${trade >= 0 ? 'var(--color-green)' : 'var(--color-red)'}">
            ${trade >= 0 ? '+' : ''}$${trade.toLocaleString()}
          </div>
        </div>
        <div class="ltv-summary-stat">
          <div class="ltv-summary-label">Cash Down</div>
          <div class="ltv-summary-val">$${down.toLocaleString()}</div>
        </div>
        <div class="ltv-summary-stat">
          <div class="ltv-summary-label">Backend</div>
          <div class="ltv-summary-val">$${backend.toLocaleString()}</div>
        </div>
        <div class="ltv-summary-stat highlight">
          <div class="ltv-summary-label">Amt Financed</div>
          <div class="ltv-summary-val" style="color:var(--color-accent)">$${amtFinanced.toLocaleString()}</div>
        </div>
        <div class="ltv-summary-stat highlight">
          <div class="ltv-summary-label">LTV vs Price</div>
          <div class="ltv-summary-val" style="color:var(--color-accent)">${bookLTV.toFixed(1)}%</div>
        </div>
      </div>`;

    // Per-lender deal structuring
    const listEl = $('#deal-lender-results');
    listEl.innerHTML = '';

    const results = [];

    LENDERS.forEach(l => {
      const issues = [];

      // 1. FICO check
      if (fico && typeof l.ficoMin === 'number' && fico < l.ficoMin) {
        issues.push(`FICO ${fico} below minimum ${l.ficoMin}`);
      }

      // 2. LTV check
      const ltvStr = l.maxLTV || '';
      const ltvNum = parseFloat(ltvStr.replace('%',''));
      if (!isNaN(ltvNum) && bookLTV > ltvNum) {
        issues.push(`LTV ${bookLTV.toFixed(1)}% exceeds ${ltvNum}% cap`);
      }

      // 3. Amount financed minimums
      const amtOk = amtFinanced >= 4000; // general floor; per-lender could be tuned
      if (!amtOk) issues.push('Amount financed likely below lender minimum');

      // 4. Term options — use lender maxTerm
      const maxT = l.maxTerm || 84;
      const termCandidates = [84, 72, 60, 48, 36].filter(t => t <= maxT);
      if (prefTerm && termCandidates.includes(prefTerm)) {
        // use preferred term only
      }

      // Estimate payments using markup cap midpoint as sell rate estimate
      // Approximate rate: segment-based estimate
      const segRates = { prime: 0.06, near: 0.09, sub: 0.14, deep: 0.20 };
      const apr = segRates[l.segment] || 0.09;
      const monthlyRate = apr / 12;

      const payments = termCandidates.map(t => {
        const pmt = amtFinanced * (monthlyRate * Math.pow(1 + monthlyRate, t)) / (Math.pow(1 + monthlyRate, t) - 1);
        return { term: t, pmt };
      });

      const eligible = issues.length === 0;
      const bestTerm = prefTerm && termCandidates.includes(prefTerm)
        ? payments.find(p => p.term === prefTerm)
        : payments[0]; // longest term = lowest payment

      const meetsTarget = !target || (bestTerm && bestTerm.pmt <= target);

      results.push({ l, issues, eligible, payments, bestTerm, meetsTarget, apr });
    });

    // Sort: eligible + meets target first, then eligible, then ineligible
    results.sort((a, b) => {
      if (a.eligible && a.meetsTarget && !(b.eligible && b.meetsTarget)) return -1;
      if (!(a.eligible && a.meetsTarget) && b.eligible && b.meetsTarget) return 1;
      if (a.eligible && !b.eligible) return -1;
      if (!a.eligible && b.eligible) return 1;
      return (a.bestTerm?.pmt || 9999) - (b.bestTerm?.pmt || 9999);
    });

    const good    = results.filter(r => r.eligible && r.meetsTarget);
    const close   = results.filter(r => r.eligible && !r.meetsTarget);
    const noGo    = results.filter(r => !r.eligible);

    if (good.length) {
      const hdr = document.createElement('div');
      hdr.className = 'bureau-section-label pass';
      hdr.textContent = `✅ Can Structure (${good.length} lender${good.length !== 1 ? 's' : ''})`;
      listEl.appendChild(hdr);
      good.forEach(r => listEl.appendChild(buildDealCard(r, target)));
    }
    if (close.length) {
      const hdr = document.createElement('div');
      hdr.className = 'bureau-section-label warn';
      hdr.textContent = `⚠️ Eligible But Over Target Payment (${close.length})`;
      listEl.appendChild(hdr);
      close.forEach(r => listEl.appendChild(buildDealCard(r, target)));
    }
    if (noGo.length) {
      const hdr = document.createElement('div');
      hdr.className = 'bureau-section-label fail';
      hdr.textContent = `❌ Ineligible (${noGo.length})`;
      listEl.appendChild(hdr);
      noGo.forEach(r => listEl.appendChild(buildDealCard(r, target)));
    }

    if (!good.length && !close.length) {
      const note = document.createElement('div');
      note.className = 'note-box warn';
      note.innerHTML = '<span class="note-icon">⚠️</span><span>No lenders meet all criteria. Try adjusting down payment, trade equity, or backend amount.</span>';
      listEl.appendChild(note);
    }

    const resultsEl = $('#deal-results');
    resultsEl.hidden = false;
    resultsEl.removeAttribute('hidden');
  });
}

function buildDealCard(r, target) {
  const { l, issues, eligible, payments, bestTerm, apr } = r;
  const card = document.createElement('div');
  const borderColor = eligible && (!target || r.meetsTarget)
    ? 'var(--color-green)'
    : eligible ? 'var(--color-accent)'
    : 'var(--color-border-strong)';

  card.style.cssText = `background:var(--color-bg-3);border:1px solid ${borderColor};border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);cursor:pointer;transition:border-color .15s;`;

  // Payment chips for each term
  const paymentChips = payments.map(p => {
    const isTarget = target && p.pmt <= target;
    const isBest   = p.term === bestTerm?.term;
    return `<span class="deal-pmt-chip ${isBest ? 'best' : ''}" style="background:${isTarget ? 'var(--color-green)22' : 'var(--color-bg-2)'};border:1px solid ${isTarget ? 'var(--color-green)' : isBest ? 'var(--color-accent)' : 'var(--color-border-strong)'};color:${isTarget ? 'var(--color-green)' : 'var(--color-text)'}">
      <span style="font-size:.6rem;opacity:.7">${p.term}mo</span>
      <span style="font-weight:700">$${Math.round(p.pmt).toLocaleString()}/mo</span>
    </span>`;
  }).join('');

  const issueHtml = issues.length
    ? `<div style="margin-top:var(--space-2);display:flex;flex-wrap:wrap;gap:4px">${issues.map(i => `<span style="font-size:var(--text-xs);color:var(--color-red);background:var(--color-red)1a;border-radius:4px;padding:1px 7px">${i}</span>`).join('')}</div>`
    : '';

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);flex-wrap:wrap">
      <span class="lender-badge ${segmentToBadge(l.segment)}" style="font-size:.65rem">${l.segmentLabel}</span>
      <span style="font-weight:700;font-size:var(--text-sm)">${l.name}</span>
      <span style="margin-left:auto;font-size:var(--text-xs);color:var(--color-text-3)">Est. APR ~${(apr*100).toFixed(0)}%</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${paymentChips}</div>
    ${issueHtml}
    <div style="margin-top:6px;font-size:var(--text-xs);color:var(--color-text-3)">⚠️ Payments are estimates using a representative rate. Always verify actual buy rate on callback.</div>`;

  card.addEventListener('click', () => { closeAllModals(); showView('lender', l.id); });
  card.addEventListener('mouseenter', () => { card.style.borderColor = 'var(--color-accent)'; });
  card.addEventListener('mouseleave', () => { card.style.borderColor = borderColor; });
  return card;
}

// ============================================================
// SIDE-BY-SIDE LENDER COMPARE
// ============================================================
function initSideBySideCompare() {
  const openBtn  = $('#compare-tool-btn');
  const modal    = $('#modal-compare-tool');
  const closeBtn = $('#compare-tool-modal-close');
  const backdrop = modal?.querySelector('.tool-modal-backdrop');
  const runBtn   = $('#sbs-run');

  // Populate selects with all lenders
  function populateSelects() {
    [0,1,2].forEach(i => {
      const sel = $(`#sbs-sel-${i}`);
      if (!sel) return;
      // Keep the blank option, add lenders
      sel.innerHTML = '<option value="">— Select —</option>';
      LENDERS.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = l.name;
        sel.appendChild(opt);
      });
    });
  }

  function openModal() {
    closeAllModals();
    populateSelects();
    modal.hidden = false;
    modal.removeAttribute('hidden');
    // Hide results on open
    const res = $('#sbs-results');
    if (res) { res.hidden = true; res.setAttribute('hidden',''); }
  }
  function closeModal() { modal.hidden = true; modal.setAttribute('hidden',''); }

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  runBtn?.addEventListener('click', () => {
    const ids = [0,1,2].map(i => $(`#sbs-sel-${i}`)?.value).filter(Boolean);
    if (ids.length < 2) { alert('Please select at least 2 lenders to compare.'); return; }

    const selected = ids.map(id => LENDERS.find(l => l.id === id)).filter(Boolean);

    // Row definitions: [label, accessor function]
    const rows = [
      ['Segment',         l => l.segmentLabel],
      ['Min FICO',        l => typeof l.ficoMin === 'number' ? l.ficoMin : l.ficoMin || '—'],
      ['Max Term',        l => l.maxTerm ? `${l.maxTerm} mo` : '—'],
      ['Max LTV',         l => l.maxLTV || '—'],
      ['Max Mileage',     l => l.maxMileage || '—'],
      ['Bureau',          l => l.bureaus?.primary?.map(b => b.charAt(0).toUpperCase() + b.slice(1)).join(', ') || '—'],
      ['GAP Max',         l => l.gapMax || '—'],
      ['Reserve/Flat',    l => l.reserveStructure || '—'],
      ['Chargeback',      l => l.chargebackWindow || '—'],
      ['Effective Date',  l => l.effectiveDate || '—'],
      ['Key Feature',     l => l.uniqueFeature || '—'],
    ];

    // Build table
    const table = $('#sbs-table');
    table.innerHTML = '';

    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th class="sbs-row-label"></th>' +
      selected.map(l => `
        <th class="sbs-col-header">
          <div class="sbs-lender-pill ${l.colorClass}">${l.abbr || l.name}</div>
          <div class="sbs-lender-name">${l.name}</div>
        </th>`).join('');
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows
    const tbody = document.createElement('tbody');
    rows.forEach(([label, fn], rowIdx) => {
      const tr = document.createElement('tr');
      tr.className = rowIdx % 2 === 0 ? 'sbs-row-even' : '';
      tr.innerHTML = `<td class="sbs-row-label">${label}</td>` +
        selected.map(l => `<td class="sbs-cell">${fn(l)}</td>`).join('');
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    const resultsEl = $('#sbs-results');
    resultsEl.hidden = false;
    resultsEl.removeAttribute('hidden');
  });
}
