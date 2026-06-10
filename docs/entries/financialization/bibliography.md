# Annotated bibliography — Financialization triptych

Source-of-record for every quantity used in the three panels and the
scrollytelling narrative. Each entry lists the exact figures the exhibit
takes from the source, verified against the source itself (June 2026).
Quantities marked **(corrected)** were fixed in the exhibit after this
audit; the previous values are noted.

All real-dollar figures use the CPI-U deflation base described in the
final section.

## Data series

### Federal Reserve Z.1 Financial Accounts — net equity issuance

- **Series:** Nonfinancial Corporate Business; Corporate Equities;
  Liability, Transactions. FRED `NCBCEBA027N` (annual, $M).
  <https://fred.stlouisfed.org/series/NCBCEBA027N>
- **Used for:** Panel I bar chart and scrollytelling Act I (51
  observations, 1975–2025); the "Net Buybacks" sink of the 2024 Sankey.
- **Verified quantities (real 2025 $, base 321.0):**
  - Cumulative 1982–2025: **−$12.47T** (quoted as "$12.4 trillion").
  - 2007 trough: **−$838B** real (−$541B nominal) — deepest real-terms
    year in the series; the *nominal* record is 2018 (−$628B).
  - 1984–89 LBO-wave average: **−$271B/yr (corrected** from −$278B; the
    figure is not reproducible from the series at any base year**)**.
  - Cumulative 1975–2025, *nominal*: **−$8.5T (corrected** from −$10.4T
    in Panel I's deflation note**)**.
  - 2010–2019 average: **−$484B/yr** (Panel I, verified).
  - 1994–2025: 32 consecutive negative years (verified).
  - 1982: **+$6.4B** real (net issuance, i.e. an *inflow*).
  - 2024: **−$416B** real (−$406.5B nominal).
- **Note:** every annual value embedded in the pages reproduces the
  current FRED vintage deflated by CPI-U to within ±$0.3B.

### Federal Reserve Z.1 F.103 — nonfinancial corporate cash flows

- **Series (annual flows, $M):** capital expenditures
  `BOGZ1FA105050005A`; net dividends paid `BOGZ1FA106121075A`; net
  increase in debt securities + loans `BOGZ1FA104104005A`.
- **Used for:** the 1982 and 2024 Sankey diagrams (Panel III and
  scrollytelling Act III). Outflows and net new debt are taken from
  F.103 directly; operating cash flow is the residual that closes the
  identity (money is fungible — see the proportional-split caveat on
  Panel III).
- **Verified quantities (real 2025 $B):**

  | Flow | 1982 | 2024 |
  |---|---|---|
  | Capital expenditure | **1,117 (corrected** from 1,035**)** | **3,025 (corrected** from 2,995**)** |
  | Dividends | **180 (corrected** from 287**)** | **1,575 (corrected** from 1,615**)** |
  | Net buybacks (= −net equity issuance, floor 0) | **0 (corrected** from 8; 1982 net issuance was *positive* $6.4B**)** | **416 (corrected** from 415**)** |
  | Net new debt | **317 (corrected** from 265**)** | **459 (corrected** from 815**)** |
  | Operating cash flow (residual) | **980 (corrected** from 1,065**)** | **4,557 (corrected** from 4,210**)** |
  | Total | **1,297** | **5,016** |

- **Root cause of the debt overstatement:** the original Panel III
  derived net borrowing by differencing the debt *level* series
  (`BCNSDODNS`), which mixes valuation and other non-transaction
  changes into the flow; the Z.1 *transactions* series
  (`BOGZ1FA104104005A`) is the correct measure and is used now.
- **Narrative consequences of the corrections:** dividends grew
  ~**8.7×** real ("nearly ninefold", previously "fivefold"); 2024 net
  borrowing (**$459B**) alone exceeds 2024 net buybacks (**$416B**) —
  it could cover the buyback bill ~1.1×, *not* "twice over" and not
  "most of shareholder payouts"; debt's share of inflows *fell* from
  ~24% (1982) to ~9% (2024), so the exhibit no longer claims borrowing
  grew as an inflow share; the 2024 sector handles **3.9×** the real
  dollar volume of 1982 (previously 3.8×).

### Federal Reserve Distributional Financial Accounts (DFA)

- **Series:** top-1% share of household net worth, FRED `WFRBST01134`
  (quarterly, **begins 1989 Q3**).
  <https://fred.stlouisfed.org/series/WFRBST01134>
  Equity-ownership shares by wealth percentile: `WFRBST01122` (top 1%)
  and companions.
- **Used for:** the DFA line in Panel II / Act II; the equity-ownership
  incidence bar in Panel III / Act III.
- **Verified quantities:** 1989 Q3 = **22.8%**; 2024 Q4 = **31.0%**;
  2025 Q3 = **31.7%** (the chart endpoint — vintage label corrected
  from "2024 Q4" to "2025 Q3"). Equity ownership 2024 Q4: top 1%
  **≈49.9%**, bottom 50% **≈1%** (the printed 49.8/37.2/12/1 bar is
  within rounding of the current vintage).
- **Coverage note (corrected):** DFA has no observations before
  1989 Q3. The Panel II median and envelope span the three available
  series (PSZ, SZZ, KSS) for 1985–88 and all four from 1989; the
  four-dataset overlap window is **1989–2016**, not "1985–2016" as
  previously stated. The scrollytelling DFA line now starts at 1989.

### S&P Dow Jones Indices — S&P 500 buybacks

- **Source:** S&P DJI quarterly buyback press releases.
  2024 record: <https://press.spglobal.com/2025-03-19-S-P-500-Q4-2024-Buybacks-Increase-7-4-and-2024-Expenditure-Sets-New-Record-by-Increasing-18-5-Earnings-Per-Share-Increases-from-Buybacks-Decline-for-the-Quarter,-as-Q1-2025s-Impact-is-Expected-to-Increase>
- **Verified quantities:** 2018: **$806.4B** (then-record); 2024:
  **$942.5B** (annual record, +18.5% over 2023's $795.2B); cumulative
  2010–2019: **≈$5.29T** ("$5.3 trillion", verified by summing the
  annual releases).
- **Incidence arithmetic:** $5.29T × 50.1% (the DFA top-1% equity-share
  *average over 2010–2019*, `WFRBST01122`) = **$2.65T** — "approximately
  $2.6 trillion to the top 1%" is correct as printed.

### BLS CPI-U deflator

- **Series:** `CUUR0000SA0` (all items, U.S. city average, NSA),
  annual averages. 1982 = 96.5; 2024 = 313.7.
- **Base caveat:** BLS did not publish an October 2025 index (lapse in
  appropriations), so no official 2025 annual average exists. The
  eleven published 2025 months average **321.9**. The exhibit's base of
  **321.0** (estimated from releases through April 2025) is retained
  across all panels for consistency; using 321.9 would scale every real
  figure up ≈0.3%, within the rounding shown.

## Academic and policy literature

- **Saez, Emmanuel & Gabriel Zucman**, "Wealth Inequality in the United
  States since 1913: Evidence from Capitalized Income Tax Data," *QJE*
  131(2), 2016; series updated at gabriel-zucman.eu/usdina (2024
  vintage). — The "PSZ" line; top-1% reaching ≈38.5% (2022) at the top
  of the envelope.
- **Smith, Matthew, Owen Zidar & Eric Zwick**, "Top Wealth in America:
  New Estimates under Heterogeneous Returns," *QJE* 138(1), 2023. —
  The "SZZ" line (covers 1966–2016 in the exhibit's window).
- **Kuhn, Moritz, Moritz Schularick & Ulrike Steins**, "Income and
  Wealth Inequality in America, 1949–2016," *JPE* 128(9), 2020. — The
  "KSS" line.
- **Catherine, Sylvain, Max Miller & Natasha Sarin**, "Social Security
  and Trends in Wealth Inequality," *Journal of Finance* 80(3),
  1497–1531, 2025. <https://onlinelibrary.wiley.com/doi/10.1111/jofi.13440>
  — The "CMS" dashed line: top-1% share including Social Security
  entitlements rises from 22% (1989) to ≈24% (2019) — the same
  direction at lower altitude and smaller slope.
- **Lazonick, William**, "Profits Without Prosperity," *Harvard
  Business Review*, September 2014. — Framing; buyback-era corporate
  allocation critique.
- **Mason, J.W.**, "Disgorge the Cash: The Disconnect Between Corporate
  Borrowing and Investment," Roosevelt Institute, 2015. — The
  marginal-funds (debt→payout) interpretation, noted but not depicted.
- **Palladino, Lenore & William Lazonick**, "Regulating Stock Buybacks:
  The $6.3 Trillion Question," Roosevelt Institute working paper, 2021.
- **Gruber, Joseph W. & Steven Kamin**, "Corporate Buybacks and Capital
  Investment: An International Perspective," Federal Reserve Board,
  IFDP Notes, April 11, 2017.
  <https://www.federalreserve.gov/econres/notes/ifdp-notes/corporate-buybacks-and-capital-investment-an-international-perspective-20170411.htm>
  — Macro-level skepticism of the buybacks-crowd-out-capex causal
  chain; cited as the counterweight in Panel III's methodology.
- **Almeida, Heitor, Vyacheslav Fos & Mathias Kronlund**, "The Real
  Effects of Share Repurchases," *JFE* 119(1), 2016. — Firm-level
  evidence on the EPS-motive margin (Panel III methodology).

## Policy facts (verified)

- SEC **Rule 10b-18** adopted November 17, 1982 (safe harbor for
  open-market repurchases).
- **§162(m)** enacted in OBRA 1993, effective 1994: caps deductibility
  of covered-executive compensation above $1M, originally exempting
  *performance-based* pay (qualifying options; not all equity grants).
- **TCJA** (P.L. 115-97, 2017): corporate rate 35%→21%; repealed the
  §162(m) performance-based exception.
- **ARPA** (2021): broadened §162(m) covered employees (effective 2027).
- **IRA** (2022): 1% excise tax on net buybacks, effective 2023.
