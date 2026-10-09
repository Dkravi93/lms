import { test } from "node:test";
import assert from "node:assert/strict";
import { runBre, calculateAge } from "./bre";
import { calculateLoan } from "./loanMath";

const today = new Date("2026-10-09T00:00:00Z");
const base = {
  dateOfBirth: new Date("1995-01-01T00:00:00Z"),
  monthlySalary: 40000,
  pan: "ABCDE1234F",
  employmentMode: "SALARIED" as const,
};

test("passes a valid applicant", () => assert.equal(runBre(base, today).passed, true));
test("age boundaries 23 and 50 inclusive", () => {
  assert.equal(runBre({ ...base, dateOfBirth: new Date("2003-10-09T00:00:00Z") }, today).passed, true); // 23 today
  assert.equal(runBre({ ...base, dateOfBirth: new Date("2003-10-10T00:00:00Z") }, today).passed, false); // 22
  assert.equal(runBre({ ...base, dateOfBirth: new Date("1976-10-09T00:00:00Z") }, today).passed, true); // 50
  assert.equal(runBre({ ...base, dateOfBirth: new Date("1975-10-08T00:00:00Z") }, today).passed, false); // 51
});
test("salary floor", () => {
  assert.equal(runBre({ ...base, monthlySalary: 25000 }, today).passed, true);
  assert.equal(runBre({ ...base, monthlySalary: 24999 }, today).passed, false);
});
test("PAN format", () => {
  for (const pan of ["abcde1234f", "ABCD1234F", "ABCDE12345", "ABCDE1234", "1BCDE1234F"])
    assert.equal(runBre({ ...base, pan }, today).passed, false, pan);
});
test("unemployed rejected and all reasons collected", () => {
  const r = runBre({ ...base, employmentMode: "UNEMPLOYED", monthlySalary: 1000 }, today);
  assert.equal(r.reasons.length, 2);
});
test("calculateAge handles birthday not yet reached", () =>
  assert.equal(calculateAge(new Date("2000-12-31T00:00:00Z"), today), 25));
test("simple interest math", () => {
  const q = calculateLoan(100000, 365);
  assert.equal(q.interest, 12000);
  assert.equal(q.totalRepayment, 112000);
  assert.equal(calculateLoan(50000, 30).interest, 493.15);
});
