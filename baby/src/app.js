const formatter = new Intl.NumberFormat("ko-KR");

const values = {
  firstMeet: {
    first: 2_000_000,
    later: 3_000_000,
  },
  medical: {
    single: 1_000_000,
    multiple: 1_400_000,
  },
  parentBenefit24Months: 18_000_000,
  childAllowance24Months: 2_400_000,
  regionalExample24Months: 120_000,
};

const birthOrder = document.querySelector("#birthOrder");
const pregnancyType = document.querySelector("#pregnancyType");
const includeRegion = document.querySelector("#includeRegion");
const result = document.querySelector("#estimateResult");

function updateEstimate() {
  const total =
    values.firstMeet[birthOrder.value] +
    values.medical[pregnancyType.value] +
    values.parentBenefit24Months +
    values.childAllowance24Months +
    (includeRegion.checked ? values.regionalExample24Months : 0);

  result.value = `24개월 기준 약 ${formatter.format(total)}원`;
  result.textContent = result.value;
}

[birthOrder, pregnancyType, includeRegion].forEach((element) => {
  element.addEventListener("change", updateEstimate);
});

updateEstimate();
