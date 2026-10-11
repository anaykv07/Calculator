export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  payoffMonths: number;
  schedule: AmortizationRow[];
}

export function calculateLoan(
  principal: number,
  annualRatePct: number,
  years: number,
  extraMonthly: number = 0
): LoanResult {
  if (principal <= 0 || years <= 0) {
    return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0, payoffMonths: 0, schedule: [] };
  }

  const monthlyRate = annualRatePct / 100 / 12;
  const totalMonths = years * 12;

  let baseMonthly = 0;
  if (monthlyRate === 0) {
    baseMonthly = principal / totalMonths;
  } else {
    baseMonthly = (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }

  const effectiveMonthly = baseMonthly + extraMonthly;
  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let m = 0;

  while (balance > 0.01 && m < totalMonths + 360) {
    m++;
    const interest = balance * monthlyRate;
    let payment = effectiveMonthly;
    let princ = payment - interest;

    if (princ > balance) {
      princ = balance;
      payment = princ + interest;
      balance = 0;
    } else {
      balance -= princ;
    }

    totalInterest += interest;

    // Record first 24 months or every 12th month for schedule summary
    if (m <= 24 || m % 12 === 0 || balance <= 0.01) {
      schedule.push({
        month: m,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(princ * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.max(0, Math.round(balance * 100) / 100),
      });
    }

    if (balance <= 0.01) break;
  }

  return {
    monthlyPayment: Math.round(baseMonthly * 100) / 100,
    totalPayment: Math.round((principal + totalInterest) * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    payoffMonths: m,
    schedule,
  };
}

export interface CompoundYearRow {
  year: number;
  totalDeposited: number;
  interestEarned: number;
  endingBalance: number;
}

export interface CompoundResult {
  futureValue: number;
  totalDeposited: number;
  totalInterest: number;
  yearlyBreakdown: CompoundYearRow[];
}

export function calculateCompoundInterest(
  initialDeposit: number,
  monthlyContribution: number,
  annualRatePct: number,
  years: number
): CompoundResult {
  const r = annualRatePct / 100;
  const monthlyRate = r / 12;
  const totalMonths = years * 12;

  let balance = initialDeposit;
  let totalDeposited = initialDeposit;
  const yearlyBreakdown: CompoundYearRow[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    balance += monthlyContribution;
    totalDeposited += monthlyContribution;
    const interest = balance * monthlyRate;
    balance += interest;

    if (m % 12 === 0 || m === totalMonths) {
      const yearNum = Math.ceil(m / 12);
      yearlyBreakdown.push({
        year: yearNum,
        totalDeposited: Math.round(totalDeposited * 100) / 100,
        interestEarned: Math.round((balance - totalDeposited) * 100) / 100,
        endingBalance: Math.round(balance * 100) / 100,
      });
    }
  }

  return {
    futureValue: Math.round(balance * 100) / 100,
    totalDeposited: Math.round(totalDeposited * 100) / 100,
    totalInterest: Math.round((balance - totalDeposited) * 100) / 100,
    yearlyBreakdown,
  };
}

export interface TipResult {
  tipAmount: number;
  totalWithTip: number;
  tipPerPerson: number;
  totalPerPerson: number;
}

export function calculateTip(
  billAmount: number,
  tipPercent: number,
  numPeople: number = 1
): TipResult {
  const count = Math.max(1, numPeople);
  const tipAmount = billAmount * (tipPercent / 100);
  const totalWithTip = billAmount + tipAmount;

  return {
    tipAmount: Math.round(tipAmount * 100) / 100,
    totalWithTip: Math.round(totalWithTip * 100) / 100,
    tipPerPerson: Math.round((tipAmount / count) * 100) / 100,
    totalPerPerson: Math.round((totalWithTip / count) * 100) / 100,
  };
}
