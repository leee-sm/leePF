import { _ as _sfc_main$1 } from './AddressSearch-CHXVukCx.mjs';
import { _ as _sfc_main$2 } from './StateBlock-zlgToguO.mjs';
import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderList } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue/server-renderer/index.mjs';
import { a as useSeoMeta, u as useHead, b as useRuntimeConfig } from './server.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/ofetch/dist/node.mjs';
import '../_/renderer.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/h3/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/ufo/dist/index.mjs';
import '../_/nitro.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/destr/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/hookable/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/node-mock-http/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/unstorage/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/unstorage/drivers/fs.mjs';
import 'file:///C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/@nuxt/nitro-server/dist/runtime/utils/cache-driver.js';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/unstorage/drivers/fs-lite.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/ohash/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/klona/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/defu/dist/defu.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/scule/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/radix3/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/@prisma/client/default.js';
import 'node:fs';
import 'node:url';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/pathe/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/unhead/dist/server.mjs';
import 'node:async_hooks';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/devalue/index.js';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/unhead/dist/plugins.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/unhead/dist/utils.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/unctx/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue-router/vue-router.node.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "weather",
  __ssrInlineRender: true,
  setup(__props) {
    const selected = ref(null);
    const weather = ref(null);
    const pending = ref(false);
    const errorMessage = ref("");
    const selectedHour = ref(null);
    const selectedOutfit = ref(null);
    const selectedOutfitPending = ref(false);
    const displayOutfit = computed(() => {
      var _a;
      return selectedOutfit.value || ((_a = weather.value) == null ? void 0 : _a.outfit) || { top: "-", bottom: "-", accessories: [], notices: [], condition: "caution", conditionLabel: "\uD310\uB2E8 \uBCF4\uB958" };
    });
    function conditionClass(condition) {
      return condition === "good" ? "bg-emerald-100 text-emerald-800" : condition === "poor" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";
    }
    function conditionDotClass(condition) {
      return condition === "good" ? "bg-emerald-500" : condition === "poor" ? "bg-red-500" : "bg-amber-500";
    }
    async function selectAddress(item) {
      var _a;
      selected.value = item;
      pending.value = true;
      errorMessage.value = "";
      weather.value = null;
      selectedHour.value = null;
      selectedOutfit.value = null;
      try {
        const response = await $fetch("/api/running/weather", { query: { lat: item.latitude, lon: item.longitude, nx: item.nx, ny: item.ny, label: item.roadAddress, sido: item.sido } });
        if (!response.success) {
          errorMessage.value = ((_a = response.error) == null ? void 0 : _a.message) || "\uB0A0\uC528 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
          return;
        }
        weather.value = response.data || null;
      } catch {
        errorMessage.value = "\uB0A0\uC528 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
      } finally {
        pending.value = false;
      }
    }
    const config = useRuntimeConfig();
    useSeoMeta({ title: "\uC624\uB298 \uB7EC\uB2DD \uB0A0\uC528\uC640 \uBCF5\uC7A5 \uCD94\uCC9C", description: "\uD604\uC7AC \uAE30\uC628\uACFC \uC2DC\uAC04\uBCC4 \uB7EC\uB2DD \uD658\uACBD\uC744 \uD655\uC778\uD558\uACE0 \uC2DC\uAC04\uB300\uBCC4 \uBCF5\uC7A5\uC744 \uCD94\uCC9C\uBC1B\uC73C\uC138\uC694.", ogUrl: `${config.public.appBaseUrl}/running/weather` });
    useHead({ link: [{ rel: "canonical", href: `${config.public.appBaseUrl}/running/weather` }] });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f;
      const _component_AddressSearch = _sfc_main$1;
      const _component_StateBlock = _sfc_main$2;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "page-shell py-8" }, _attrs))}><div class="mb-5"><p class="text-sm font-black uppercase tracking-wide text-running">Running Weather</p><h1 class="mt-2 text-3xl font-black text-ink">\uC624\uB298 \uB7EC\uB2DD \uB0A0\uC528\uC640 \uBCF5\uC7A5 \uCD94\uCC9C</h1><p class="mt-2 text-sm leading-6 text-slate-600">\uC8FC\uC18C\uB97C \uAC80\uC0C9\uD558\uBA74 \uD604\uC7AC \uB0A0\uC528\uC640 \uC2DC\uAC04\uBCC4 \uB7EC\uB2DD \uD658\uACBD\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p></div>`);
      _push(ssrRenderComponent(_component_AddressSearch, {
        label: "\uB7EC\uB2DD \uC704\uCE58",
        onSelect: selectAddress
      }, null, _parent));
      if (unref(selected)) {
        _push(`<section class="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><h2 class="text-xl font-black text-ink">${ssrInterpolate(unref(selected).roadAddress)}</h2>`);
        if (unref(pending)) {
          _push(`<div class="mt-4 h-28 animate-pulse rounded-xl bg-slate-100"></div>`);
        } else if (unref(errorMessage)) {
          _push(ssrRenderComponent(_component_StateBlock, {
            class: "mt-4",
            eyebrow: "Weather unavailable",
            title: "\uB0A0\uC528 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
            text: unref(errorMessage)
          }, null, _parent));
        } else if (unref(weather)) {
          _push(`<div class="mt-4 grid min-w-0 gap-4">`);
          if (!unref(weather).current) {
            _push(ssrRenderComponent(_component_StateBlock, {
              eyebrow: "API setup required",
              title: "\uACF5\uACF5\uB370\uC774\uD130 API \uC5F0\uB3D9 \uC900\uBE44 \uC0C1\uD0DC",
              text: "PUBLIC_DATA_SERVICE_KEY\uB97C \uC124\uC815\uD558\uBA74 \uD604\uC7AC \uB0A0\uC528\uC640 \uC2DC\uAC04\uBCC4 \uB0A0\uC528\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4."
            }, null, _parent));
          } else {
            _push(`<section class="grid gap-4"><section class="rounded-2xl border border-teal-100 bg-teal-50 p-5"><p class="text-sm font-black text-running">\uD604\uC7AC \uB7EC\uB2DD \uD658\uACBD</p><div class="${ssrRenderClass([conditionClass(unref(displayOutfit).condition), "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black"])}"><span class="${ssrRenderClass([conditionDotClass(unref(displayOutfit).condition), "h-2.5 w-2.5 rounded-full"])}"></span> ${ssrInterpolate(unref(displayOutfit).conditionLabel)}</div><div class="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4"><div><span class="text-xs text-slate-500">\uAE30\uC628</span><strong class="mt-1 block text-2xl text-ink">${ssrInterpolate((_a = unref(weather).current.temperature) != null ? _a : "-")}\xB0C</strong></div><div><span class="text-xs text-slate-500">\uC2B5\uB3C4</span><strong class="mt-1 block text-2xl text-ink">${ssrInterpolate((_b = unref(weather).current.humidity) != null ? _b : "-")}%</strong></div><div><span class="text-xs text-slate-500">\uAC15\uC218\uB7C9</span><strong class="mt-1 block text-2xl text-ink">${ssrInterpolate((_c = unref(weather).current.precipitation) != null ? _c : 0)}mm</strong></div><div><span class="text-xs text-slate-500">\uD48D\uC18D</span><strong class="mt-1 block text-2xl text-ink">${ssrInterpolate((_d = unref(weather).current.windSpeed) != null ? _d : "-")}m/s</strong></div><div><span class="text-xs text-slate-500">\uBBF8\uC138\uBA3C\uC9C0 PM10</span><strong class="mt-1 block text-2xl text-ink">${ssrInterpolate((_e = unref(weather).current.pm10) != null ? _e : "-")}\u338D/m\xB3</strong></div><div><span class="text-xs text-slate-500">\uCD08\uBBF8\uC138\uBA3C\uC9C0 PM2.5</span><strong class="mt-1 block text-2xl text-ink">${ssrInterpolate((_f = unref(weather).current.pm25) != null ? _f : "-")}\u338D/m\xB3</strong></div></div></section>`);
            if (unref(weather).hourly.length) {
              _push(`<section class="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 p-4"><h2 class="font-black text-ink">\uC2DC\uAC04\uBCC4 \uB0A0\uC528</h2><p class="mt-1 text-xs text-slate-500">\uC2DC\uAC04\uB300\uB97C \uB204\uB974\uBA74 \uD574\uB2F9 \uC2DC\uAC04 \uAE30\uC900 \uBCF5\uC7A5 \uCD94\uCC9C\uC73C\uB85C \uBC14\uB01D\uB2C8\uB2E4.</p><div class="mt-3 max-w-full overflow-x-auto pb-2"><div class="flex min-w-max gap-3"><!--[-->`);
              ssrRenderList(unref(weather).hourly, (hour) => {
                var _a2, _b2, _c2, _d2;
                _push(`<button type="button" class="${ssrRenderClass([((_a2 = unref(selectedHour)) == null ? void 0 : _a2.time) === hour.time ? "bg-teal-100 ring-2 ring-running" : "bg-slate-50 hover:bg-teal-50", "w-28 shrink-0 rounded-xl p-3 text-center transition"])}"><p class="text-xs text-slate-500">${ssrInterpolate(hour.time.slice(-4, -2))}:${ssrInterpolate(hour.time.slice(-2))}</p><strong class="mt-2 block text-lg text-ink">${ssrInterpolate((_b2 = hour.temperature) != null ? _b2 : "-")}\xB0</strong><p class="mt-1 text-xs text-slate-500">\uC2B5\uB3C4 ${ssrInterpolate((_c2 = hour.humidity) != null ? _c2 : "-")}%</p><p class="text-xs text-slate-500">\uAC15\uC218 ${ssrInterpolate((_d2 = hour.precipitationProbability) != null ? _d2 : "-")}%</p></button>`);
              });
              _push(`<!--]--></div></div></section>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<section class="min-w-0 max-w-full overflow-x-auto rounded-xl bg-teal-50 p-4"><p class="text-sm font-black text-running">\uBCF5\uC7A5 \uCD94\uCC9C `);
            if (unref(selectedHour)) {
              _push(`<span class="font-normal text-slate-600">\xB7 ${ssrInterpolate(unref(selectedHour).time.slice(-4, -2))}:${ssrInterpolate(unref(selectedHour).time.slice(-2))} \uAE30\uC900</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p>`);
            if (unref(selectedOutfitPending)) {
              _push(`<div class="mt-3 h-12 animate-pulse rounded-lg bg-white/70"></div>`);
            } else {
              _push(`<div><dl class="mt-3 grid min-w-[32rem] gap-3 sm:grid-cols-3"><div><dt class="text-xs text-slate-500">\uC0C1\uC758</dt><dd class="font-bold text-ink">${ssrInterpolate(unref(displayOutfit).top)}</dd></div><div><dt class="text-xs text-slate-500">\uD558\uC758</dt><dd class="font-bold text-ink">${ssrInterpolate(unref(displayOutfit).bottom)}</dd></div><div><dt class="text-xs text-slate-500">\uAE30\uD0C0 \uCD94\uCC9C</dt><dd class="font-bold text-ink">${ssrInterpolate(unref(displayOutfit).accessories.join(", ") || "\uC5C6\uC74C")}</dd></div></dl>`);
              if (unref(displayOutfit).notices.length) {
                _push(`<p class="mt-3 text-sm text-slate-700">${ssrInterpolate(unref(displayOutfit).notices.join(" "))}</p>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            }
            _push(`</section></section>`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/running/weather.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=weather-N_jIgv-N.mjs.map
