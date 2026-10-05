import { _ as _sfc_main$1 } from './StateBlock-zlgToguO.mjs';
import { a as useSeoMeta, u as useHead, _ as __nuxt_component_0, b as useRuntimeConfig } from './server.mjs';
import { defineComponent, ref, computed, watch, withAsyncContext, mergeProps, unref, withCtx, createVNode, toDisplayString, useSSRContext } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate, ssrRenderComponent, ssrRenderClass } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue/server-renderer/index.mjs';
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

const pageSize = 5;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const month = ref((/* @__PURE__ */ new Date()).toISOString().slice(0, 7));
    const region = ref("");
    const status = ref("");
    const distance = ref("");
    const selectedDate = ref("");
    const currentPage = ref(1);
    const items = ref([]);
    const loading = ref(false);
    const regions = ["\uC11C\uC6B8", "\uC778\uCC9C", "\uACBD\uAE30", "\uAC15\uC6D0", "\uB300\uC804", "\uB300\uAD6C", "\uBD80\uC0B0", "\uAD11\uC8FC", "\uC6B8\uC0B0", "\uC138\uC885", "\uCDA9\uBD81", "\uCDA9\uB0A8", "\uC804\uBD81", "\uC804\uB0A8", "\uACBD\uBD81", "\uACBD\uB0A8", "\uC81C\uC8FC"];
    const weekDays = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
    const monthLabel = computed(() => {
      const [year, value] = month.value.split("-");
      return `${year}\uB144 ${Number(value)}\uC6D4`;
    });
    const grouped = computed(() => items.value.reduce((all, item) => {
      var _a;
      if (item.raceDate) (all[_a = item.raceDate] || (all[_a] = [])).push(item);
      return all;
    }, {}));
    const calendarCells = computed(() => {
      const [year, value] = month.value.split("-").map(Number);
      const first = new Date(year, value - 1, 1).getDay();
      const count = new Date(year, value, 0).getDate();
      const cells = [];
      for (let index = 0; index < first; index += 1) cells.push({ key: `empty-${index}`, date: "", day: 0, events: [] });
      for (let day = 1; day <= count; day += 1) {
        const date = `${year}-${String(value).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        cells.push({ key: date, date, day, events: grouped.value[date] || [] });
      }
      return cells;
    });
    const visibleItems = computed(() => selectedDate.value ? grouped.value[selectedDate.value] || [] : items.value);
    const totalPages = computed(() => Math.max(1, Math.ceil(visibleItems.value.length / pageSize)));
    const pagedItems = computed(() => visibleItems.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize));
    watch(visibleItems, () => {
      currentPage.value = 1;
    });
    async function load() {
      var _a;
      loading.value = true;
      selectedDate.value = "";
      currentPage.value = 1;
      try {
        const response = await $fetch("/api/running/marathons", { query: { month: month.value, region: region.value || void 0, status: status.value || void 0, distance: distance.value || void 0 } });
        items.value = response.success ? ((_a = response.data) == null ? void 0 : _a.items) || [] : [];
      } finally {
        loading.value = false;
      }
    }
    [__temp, __restore] = withAsyncContext(() => load()), await __temp, __restore();
    const config = useRuntimeConfig();
    useSeoMeta({
      title: `${monthLabel.value} \uC804\uAD6D \uB9C8\uB77C\uD1A4 \uC77C\uC815 \uBC0F \uC811\uC218\uC815\uBCF4 | LifeRun`,
      description: "\uB0A0\uC9DC, \uC9C0\uC5ED, \uC885\uBAA9, \uC811\uC218 \uC0C1\uD0DC\uBCC4\uB85C \uC804\uAD6D \uB7EC\uB2DD \uB300\uD68C \uC77C\uC815\uC744 \uD655\uC778\uD558\uC138\uC694.",
      ogUrl: `${config.public.appBaseUrl}/running/marathons`
    });
    useHead({ link: [{ rel: "canonical", href: `${config.public.appBaseUrl}/running/marathons` }] });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_StateBlock = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "page-shell py-8" }, _attrs))}><section class="mb-8"><p class="text-sm font-black uppercase tracking-[0.18em] text-running">Race calendar</p><h1 class="mt-2 text-3xl font-black text-ink sm:text-4xl">\uB9C8\uB77C\uD1A4 \uC77C\uC815</h1><p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600"> \uB9E4\uC77C \uAC31\uC2E0\uD55C \uACF5\uAC1C \uC77C\uC815 \uB370\uC774\uD130\uB97C \uAE30\uC900\uC73C\uB85C \uB300\uD68C \uB0A0\uC9DC\uC640 \uC811\uC218 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC138\uC694. \uB300\uD68C \uC0C1\uC138\uC815\uBCF4\uC640 \uC811\uC218 \uC5EC\uBD80\uB294 \uACF5\uC2DD \uC548\uB0B4\uB97C \uCD5C\uC885 \uD655\uC778\uD574 \uC8FC\uC138\uC694. </p></section><section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6"><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label class="text-sm font-bold text-slate-700"> \uC6D4 \uC120\uD0DD <input${ssrRenderAttr("value", unref(month))} class="focus-ring mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3" type="month"></label><label class="text-sm font-bold text-slate-700"> \uC9C0\uC5ED <select class="focus-ring mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(region)) ? ssrLooseContain(unref(region), "") : ssrLooseEqual(unref(region), "")) ? " selected" : ""}>\uC804\uAD6D</option><!--[-->`);
      ssrRenderList(regions, (item) => {
        _push(`<option${ssrRenderAttr("value", item)}${ssrIncludeBooleanAttr(Array.isArray(unref(region)) ? ssrLooseContain(unref(region), item) : ssrLooseEqual(unref(region), item)) ? " selected" : ""}>${ssrInterpolate(item)}</option>`);
      });
      _push(`<!--]--></select></label><label class="text-sm font-bold text-slate-700"> \uC811\uC218 \uC0C1\uD0DC <select class="focus-ring mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(status)) ? ssrLooseContain(unref(status), "") : ssrLooseEqual(unref(status), "")) ? " selected" : ""}>\uC804\uCCB4 \uC0C1\uD0DC</option><option value="\uC811\uC218\uC911"${ssrIncludeBooleanAttr(Array.isArray(unref(status)) ? ssrLooseContain(unref(status), "\uC811\uC218\uC911") : ssrLooseEqual(unref(status), "\uC811\uC218\uC911")) ? " selected" : ""}>\uC811\uC218\uC911</option><option value="\uC811\uC218\uC608\uC815"${ssrIncludeBooleanAttr(Array.isArray(unref(status)) ? ssrLooseContain(unref(status), "\uC811\uC218\uC608\uC815") : ssrLooseEqual(unref(status), "\uC811\uC218\uC608\uC815")) ? " selected" : ""}>\uC811\uC218\uC608\uC815</option><option value="\uB9C8\uAC10"${ssrIncludeBooleanAttr(Array.isArray(unref(status)) ? ssrLooseContain(unref(status), "\uB9C8\uAC10") : ssrLooseEqual(unref(status), "\uB9C8\uAC10")) ? " selected" : ""}>\uB9C8\uAC10</option></select></label><label class="text-sm font-bold text-slate-700"> \uC885\uBAA9 <select class="focus-ring mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(distance)) ? ssrLooseContain(unref(distance), "") : ssrLooseEqual(unref(distance), "")) ? " selected" : ""}>\uC804\uCCB4 \uC885\uBAA9</option><option value="10k"${ssrIncludeBooleanAttr(Array.isArray(unref(distance)) ? ssrLooseContain(unref(distance), "10k") : ssrLooseEqual(unref(distance), "10k")) ? " selected" : ""}>10km \uD3EC\uD568</option><option value="half"${ssrIncludeBooleanAttr(Array.isArray(unref(distance)) ? ssrLooseContain(unref(distance), "half") : ssrLooseEqual(unref(distance), "half")) ? " selected" : ""}>\uD558\uD504 \uD3EC\uD568</option><option value="full"${ssrIncludeBooleanAttr(Array.isArray(unref(distance)) ? ssrLooseContain(unref(distance), "full") : ssrLooseEqual(unref(distance), "full")) ? " selected" : ""}>\uD480\uCF54\uC2A4 \uD3EC\uD568</option></select></label></div></section>`);
      if (unref(loading)) {
        _push(`<p class="mt-6 rounded-2xl bg-slate-100 px-4 py-5 text-sm text-slate-600">\uC77C\uC815\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.</p>`);
      } else if (!unref(items).length) {
        _push(ssrRenderComponent(_component_StateBlock, {
          class: "mt-6",
          eyebrow: "No races",
          title: "\uC120\uD0DD\uD55C \uAE30\uAC04\uC5D0 \uB4F1\uB85D\uB41C \uC77C\uC815\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
          text: "\uACF5\uAC1C \uC6D0\uCC9C\uC5D0 \uB4F1\uB85D\uB41C \uC77C\uC815\uC774 \uC5C6\uAC70\uB098 \uD544\uD130 \uC870\uAC74\uACFC \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
        }, null, _parent));
      } else {
        _push(`<section class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.95fr)]"><div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6"><div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-black text-ink">${ssrInterpolate(unref(monthLabel))}</h2><span class="text-sm font-bold text-slate-500">${ssrInterpolate(unref(items).length)}\uAC1C \uB300\uD68C</span></div><div class="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400"><!--[-->`);
        ssrRenderList(weekDays, (day) => {
          _push(`<span>${ssrInterpolate(day)}</span>`);
        });
        _push(`<!--]--></div><div class="mt-2 grid grid-cols-7 gap-1"><!--[-->`);
        ssrRenderList(unref(calendarCells), (cell) => {
          _push(`<button class="${ssrRenderClass([cell.date && cell.events.length ? "border-running/30 bg-running/5 hover:bg-running/10" : "border-transparent bg-slate-50/60", "min-h-16 rounded-xl border p-1 text-left transition sm:min-h-20"])}"${ssrIncludeBooleanAttr(!cell.date || !cell.events.length) ? " disabled" : ""}>`);
          if (cell.date) {
            _push(`<span class="${ssrRenderClass([cell.date === unref(selectedDate) ? "text-running" : "text-slate-600", "text-xs font-black"])}">${ssrInterpolate(cell.day)}</span>`);
          } else {
            _push(`<!---->`);
          }
          if (cell.events.length) {
            _push(`<span class="mt-1 block text-[10px] font-bold leading-4 text-slate-500">${ssrInterpolate(cell.events.length)}\uAC1C</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</button>`);
        });
        _push(`<!--]--></div></div><div class="flex h-[34rem] min-h-[34rem] flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-3 lg:p-4"><div class="flex items-center justify-between"><h2 class="text-lg font-black text-ink">${ssrInterpolate(unref(selectedDate) ? `${unref(selectedDate)} \uC77C\uC815` : "\uB0A0\uC9DC\uBCC4 \uC77C\uC815")}</h2>`);
        if (unref(selectedDate)) {
          _push(`<button class="text-sm font-bold text-running">\uC804\uCCB4 \uBCF4\uAE30</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="min-h-0 flex-1 grid grid-rows-5 gap-2"><!--[-->`);
        ssrRenderList(unref(pagedItems), (item) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: item.id,
            to: `/running/marathons/${item.id}`,
            class: "min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-soft transition hover:border-running/50"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a, _b;
              if (_push2) {
                _push2(`<div class="flex items-start justify-between gap-3"${_scopeId}><div class="min-w-0"${_scopeId}><p class="text-xs font-black text-running"${_scopeId}>${ssrInterpolate(item.raceDate)} \xB7 ${ssrInterpolate(item.region || "\uC9C0\uC5ED \uBBF8\uACF5\uAC1C")}</p><h3 class="mt-1 break-words text-base font-black text-ink"${_scopeId}>${ssrInterpolate(item.name)}</h3></div><span class="shrink-0 rounded-full bg-running/10 px-3 py-1 text-xs font-black text-running"${_scopeId}>${ssrInterpolate(item.dday)}</span></div><p class="mt-3 text-sm text-slate-600"${_scopeId}>${ssrInterpolate(((_a = item.distances) == null ? void 0 : _a.join(" \xB7 ")) || "\uC885\uBAA9 \uC815\uBCF4 \uBBF8\uACF5\uAC1C")} \xB7 ${ssrInterpolate(item.registrationStatus || "\uC811\uC218 \uC0C1\uD0DC \uBBF8\uACF5\uAC1C")}</p>`);
              } else {
                return [
                  createVNode("div", { class: "flex items-start justify-between gap-3" }, [
                    createVNode("div", { class: "min-w-0" }, [
                      createVNode("p", { class: "text-xs font-black text-running" }, toDisplayString(item.raceDate) + " \xB7 " + toDisplayString(item.region || "\uC9C0\uC5ED \uBBF8\uACF5\uAC1C"), 1),
                      createVNode("h3", { class: "mt-1 break-words text-base font-black text-ink" }, toDisplayString(item.name), 1)
                    ]),
                    createVNode("span", { class: "shrink-0 rounded-full bg-running/10 px-3 py-1 text-xs font-black text-running" }, toDisplayString(item.dday), 1)
                  ]),
                  createVNode("p", { class: "mt-3 text-sm text-slate-600" }, toDisplayString(((_b = item.distances) == null ? void 0 : _b.join(" \xB7 ")) || "\uC885\uBAA9 \uC815\uBCF4 \uBBF8\uACF5\uAC1C") + " \xB7 " + toDisplayString(item.registrationStatus || "\uC811\uC218 \uC0C1\uD0DC \uBBF8\uACF5\uAC1C"), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
        if (unref(totalPages) > 1) {
          _push(`<div class="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><button class="rounded-lg px-3 py-2 text-sm font-bold text-running disabled:cursor-not-allowed disabled:text-slate-300"${ssrIncludeBooleanAttr(unref(currentPage) === 1) ? " disabled" : ""}>\uC774\uC804</button><span class="text-sm font-bold text-slate-600">${ssrInterpolate(unref(currentPage))} / ${ssrInterpolate(unref(totalPages))}</span><button class="rounded-lg px-3 py-2 text-sm font-bold text-running disabled:cursor-not-allowed disabled:text-slate-300"${ssrIncludeBooleanAttr(unref(currentPage) === unref(totalPages)) ? " disabled" : ""}>\uB2E4\uC74C</button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></section>`);
      }
      _push(`</main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/running/marathons/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DEVtnK6i.mjs.map
