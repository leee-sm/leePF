const temperatureRules = [
  { min: 25, top: "\uC587\uC740 \uAE30\uB2A5\uC131 \uBC18\uD314 \uD2F0", bottom: "\uB7EC\uB2DD \uC1FC\uCE20", accessories: ["\uBAA8\uC790", "\uC218\uBD84 \uBCF4\uCDA9"] },
  { min: 20, max: 24, top: "\uBC18\uD314 \uAE30\uB2A5\uC131 \uD2F0", bottom: "\uB7EC\uB2DD \uC1FC\uCE20", accessories: ["\uAC00\uBCBC\uC6B4 \uC591\uB9D0"] },
  { min: 15, max: 19, top: "\uAE34\uD314 \uAE30\uB2A5\uC131 \uD2F0 \uB610\uB294 \uBC18\uD314 + \uC587\uC740 \uB808\uC774\uC5B4", bottom: "\uC1FC\uCE20 \uB610\uB294 \uC587\uC740 \uB7EC\uB2DD \uD0C0\uC774\uCE20", accessories: [] },
  { min: 10, max: 14, top: "\uAE30\uB2A5\uC131 \uAE34\uD314 \uD2F0", bottom: "\uB7EC\uB2DD \uD0C0\uC774\uCE20", accessories: ["\uC587\uC740 \uBC14\uB78C\uB9C9\uC774"] },
  { min: 5, max: 9, top: "\uBCF4\uC628 \uAE30\uB2A5\uC131 \uBCA0\uC774\uC2A4\uB808\uC774\uC5B4", bottom: "\uAE30\uBAA8 \uB7EC\uB2DD \uD0C0\uC774\uCE20", accessories: ["\uBC14\uB78C\uB9C9\uC774", "\uC7A5\uAC11"] },
  { min: 0, max: 4, top: "\uBCF4\uC628 \uBCA0\uC774\uC2A4\uB808\uC774\uC5B4 + \uB7EC\uB2DD \uC7AC\uD0B7", bottom: "\uAE30\uBAA8 \uB7EC\uB2DD \uD0C0\uC774\uCE20", accessories: ["\uC7A5\uAC11", "\uBE44\uB2C8"] },
  { max: -1, top: "\uBC29\uD55C \uBCA0\uC774\uC2A4\uB808\uC774\uC5B4 + \uBC29\uD48D \uC7AC\uD0B7", bottom: "\uAE30\uBAA8 \uB7EC\uB2DD \uD0C0\uC774\uCE20", accessories: ["\uC7A5\uAC11", "\uBE44\uB2C8", "\uB125\uC6CC\uBA38"] }
];
function matchRule(temperature) {
  return temperatureRules.find((rule) => (rule.min === void 0 || temperature >= rule.min) && (rule.max === void 0 || temperature <= rule.max)) || temperatureRules.at(-1);
}
function recommendRunningOutfit(input) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  if (input.temperature === null) return { top: "\uB0A0\uC528 \uB370\uC774\uD130 \uD655\uC778 \uD544\uC694", bottom: "\uB0A0\uC528 \uB370\uC774\uD130 \uD655\uC778 \uD544\uC694", accessories: [], notices: ["\uAE30\uC628 \uB370\uC774\uD130\uAC00 \uC5C6\uC5B4 \uBCF5\uC7A5 \uCD94\uCC9C\uC744 \uACC4\uC0B0\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."], condition: "caution", conditionLabel: "\uD310\uB2E8 \uBCF4\uB958" };
  const baseTemperature = Math.round((_a = input.feelsLikeTemperature) != null ? _a : input.temperature);
  const rule = matchRule(baseTemperature);
  const accessories = new Set(rule.accessories);
  const notices = [];
  if (((_b = input.precipitation) != null ? _b : 0) > 0) {
    accessories.add("\uBC29\uC218 \uC7AC\uD0B7 \uB610\uB294 \uB7EC\uB2DD \uCEA1");
    notices.push("\uAC15\uC218 \uAC00\uB2A5\uC131\uC774 \uC788\uC5B4 \uBBF8\uB044\uB7EC\uC6B4 \uAD6C\uAC04\uC5D0 \uC8FC\uC758\uD558\uC138\uC694.");
  }
  if (((_c = input.precipitation) != null ? _c : 0) <= 0 && baseTemperature >= 15) accessories.add("\uC120\uAE00\uB77C\uC2A4");
  if (baseTemperature >= 20 && ((_d = input.precipitation) != null ? _d : 0) <= 0) accessories.add("\uBAA8\uC790");
  if (((_e = input.windSpeed) != null ? _e : 0) >= 5) {
    accessories.add("\uBC14\uB78C\uB9C9\uC774");
    notices.push("\uBC14\uB78C\uC774 \uAC15\uD574 \uCCB4\uAC10\uC628\uB3C4\uAC00 \uB0AE\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
  }
  if (((_f = input.humidity) != null ? _f : 0) >= 75 && baseTemperature >= 20) notices.push("\uC2B5\uB3C4\uAC00 \uB192\uC544 \uBB34\uB9AC\uD558\uC9C0 \uC54A\uB294 \uD398\uC774\uC2A4\uB97C \uAD8C\uC7A5\uD569\uB2C8\uB2E4.");
  if (((_g = input.pm10) != null ? _g : 0) > 80 || ((_h = input.pm25) != null ? _h : 0) > 35) notices.push("\uBBF8\uC138\uBA3C\uC9C0 \uB610\uB294 \uCD08\uBBF8\uC138\uBA3C\uC9C0\uAC00 \uB192\uC544 \uC57C\uC678 \uC6B4\uB3D9 \uAC15\uB3C4\uB97C \uB0AE\uCD94\uB294 \uAC83\uC744 \uAD8C\uC7A5\uD569\uB2C8\uB2E4.");
  const poor = ((_i = input.pm10) != null ? _i : 0) > 80 || ((_j = input.pm25) != null ? _j : 0) > 35 || ((_k = input.precipitation) != null ? _k : 0) > 2 || ((_l = input.windSpeed) != null ? _l : 0) >= 8 || baseTemperature > 30 || baseTemperature < -5;
  const caution = poor || ((_m = input.pm10) != null ? _m : 0) > 30 || ((_n = input.pm25) != null ? _n : 0) > 15 || ((_o = input.precipitation) != null ? _o : 0) > 0 || ((_p = input.humidity) != null ? _p : 0) >= 75 || ((_q = input.windSpeed) != null ? _q : 0) >= 5 || baseTemperature > 27 || baseTemperature < 0;
  return { top: rule.top, bottom: rule.bottom, accessories: [...accessories], notices, condition: poor ? "poor" : caution ? "caution" : "good", conditionLabel: poor ? "\uB6F0\uAE30 \uC5B4\uB824\uC6C0" : caution ? "\uC870\uAC74\uC774 \uC560\uB9E4\uD568" : "\uB6F0\uAE30 \uC88B\uC74C" };
}

export { recommendRunningOutfit as r };
//# sourceMappingURL=runningOutfitService.mjs.map
