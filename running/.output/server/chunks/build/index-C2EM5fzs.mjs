import { _ as _sfc_main$1 } from './AddressSearch-CHXVukCx.mjs';
import { _ as _sfc_main$2 } from './StateBlock-zlgToguO.mjs';
import { _ as _sfc_main$3 } from './KakaoMap-CoCCG5vG.mjs';
import { a as useSeoMeta, u as useHead, _ as __nuxt_component_0, b as useRuntimeConfig } from './server.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@prisma/client';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import 'vue-router';

const pageSize = 5;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const items = ref([]);
    const selected = ref(null);
    const selectedPlace = ref(null);
    const message = ref("");
    const currentPage = ref(1);
    const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)));
    const pagedItems = computed(() => items.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize));
    function selectPlace(item) {
      selectedPlace.value = item;
    }
    async function selectAddress(item) {
      var _a;
      selected.value = item;
      selectedPlace.value = null;
      message.value = "";
      items.value = [];
      currentPage.value = 1;
      const response = await $fetch("/api/baby/childcare", { query: { lat: item.latitude, lon: item.longitude, radius: 3e3, sido: item.sido, sigungu: item.sigungu } });
      if (!response.success) {
        message.value = ((_a = response.error) == null ? void 0 : _a.message) || "\uC5B4\uB9B0\uC774\uC9D1 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
        return;
      }
      items.value = response.data || [];
      currentPage.value = 1;
      if (!items.value.length) message.value = "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.";
    }
    const config = useRuntimeConfig();
    useSeoMeta({ title: "\uC8FC\uBCC0 \uC5B4\uB9B0\uC774\uC9D1 \uC815\uC6D0\xB7\uD604\uC6D0 \uC815\uBCF4", description: "\uC8FC\uC18C \uAE30\uC900 \uC8FC\uBCC0 \uC5B4\uB9B0\uC774\uC9D1\uC758 \uACF5\uAC1C \uC815\uBCF4\uB97C \uD655\uC778\uD569\uB2C8\uB2E4.", ogUrl: `${config.public.appBaseUrl}/baby/childcare` });
    useHead({ link: [{ rel: "canonical", href: `${config.public.appBaseUrl}/baby/childcare` }] });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const _component_AddressSearch = _sfc_main$1;
      const _component_StateBlock = _sfc_main$2;
      const _component_KakaoMap = _sfc_main$3;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "page-shell py-8" }, _attrs))}><div class="mb-5"><p class="text-sm font-black uppercase tracking-wide text-baby">Childcare</p><h1 class="mt-2 text-3xl font-black text-ink">\uC8FC\uBCC0 \uC5B4\uB9B0\uC774\uC9D1 \uCC3E\uAE30</h1><p class="mt-2 text-sm leading-6 text-slate-600">\uC8FC\uC18C\uB97C \uAC80\uC0C9\uD55C \uB4A4 \uC9C0\uB3C4\uC5D0\uC11C \uC5B4\uB9B0\uC774\uC9D1\uC744 \uC120\uD0DD\uD558\uBA74 \uC624\uB978\uCABD\uC5D0\uC11C \uACF5\uAC1C\uB41C \uC0C1\uC138 \uC815\uBCF4\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p></div>`);
      _push(ssrRenderComponent(_component_AddressSearch, {
        label: "\uAE30\uC900 \uC8FC\uC18C",
        onSelect: selectAddress
      }, null, _parent));
      if (unref(message)) {
        _push(ssrRenderComponent(_component_StateBlock, {
          class: "mt-5",
          eyebrow: "Status",
          title: "\uC5B4\uB9B0\uC774\uC9D1 \uAC80\uC0C9 \uC548\uB0B4",
          text: unref(message)
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(items).length) {
        _push(`<div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:items-start">`);
        if (unref(selected)) {
          _push(ssrRenderComponent(_component_KakaoMap, {
            latitude: unref(selected).latitude,
            longitude: unref(selected).longitude,
            places: unref(items),
            onSelect: selectPlace
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex h-[34rem] min-w-0 flex-col gap-3">`);
        if (unref(selectedPlace)) {
          _push(`<article class="rounded-2xl border border-baby/30 bg-rose-50 p-5"><p class="text-xs font-black uppercase tracking-wide text-baby">\uC120\uD0DD\uD55C \uC5B4\uB9B0\uC774\uC9D1 \uC0C1\uC138</p><h2 class="mt-2 text-xl font-black text-ink">${ssrInterpolate(unref(selectedPlace).name)}</h2><dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt class="text-slate-500">\uC720\uD615</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate(unref(selectedPlace).type || "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uC6B4\uC601\uC0C1\uD0DC</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate(unref(selectedPlace).status || unref(selectedPlace).operatingStatus || "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div class="sm:col-span-2"><dt class="text-slate-500">\uC8FC\uC18C</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate(unref(selectedPlace).roadAddress || unref(selectedPlace).address || "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uC804\uD654\uBC88\uD638</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate(unref(selectedPlace).phone || "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uAC70\uB9AC</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate((_a = unref(selectedPlace).distanceMeters) != null ? _a : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}${ssrInterpolate(unref(selectedPlace).distanceMeters != null ? "m" : "")}</dd></div><div><dt class="text-slate-500">\uC815\uC6D0</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate((_b = unref(selectedPlace).capacity) != null ? _b : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uD604\uC6D0</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate((_c = unref(selectedPlace).currentEnrollment) != null ? _c : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uAD50\uC9C1\uC6D0\uC218</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate((_d = unref(selectedPlace).staffCount) != null ? _d : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uBCF4\uC721\uC2E4\uC218</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate((_f = (_e = unref(selectedPlace).roomCount) != null ? _e : unref(selectedPlace).classroomCount) != null ? _f : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uAD50\uC2E4\uBA74\uC801</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate((_g = unref(selectedPlace).classroomArea) != null ? _g : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uAC74\uBB3C\uC804\uC6A9\uBA74\uC801</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate((_h = unref(selectedPlace).buildingArea) != null ? _h : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uD1B5\uD559\uCC28\uB7C9</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate((_i = unref(selectedPlace).schoolBus) != null ? _i : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uB300\uAE30\uC778\uC6D0</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate((_j = unref(selectedPlace).waitlist) != null ? _j : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uC778\uAC00\uC77C</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate(unref(selectedPlace).approvalDate || "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div></dl>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/baby/childcare/${encodeURIComponent(unref(selectedPlace).id)}`,
            class: "mt-4 inline-flex text-sm font-black text-baby hover:underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`\uC804\uCCB4 \uC0C1\uC138 \uD398\uC774\uC9C0 \uBCF4\uAE30 \u2192`);
              } else {
                return [
                  createTextVNode("\uC804\uCCB4 \uC0C1\uC138 \uD398\uC774\uC9C0 \uBCF4\uAE30 \u2192")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</article>`);
        } else {
          _push(`<p class="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">\uC9C0\uB3C4\uC5D0\uC11C \uC5B4\uB9B0\uC774\uC9D1 \uC704\uCE58\uB97C \uC120\uD0DD\uD558\uC138\uC694.</p>`);
        }
        _push(`<div class="min-h-0 flex-1 grid grid-rows-5 gap-2"><!--[-->`);
        ssrRenderList(unref(pagedItems), (item) => {
          var _a2, _b2, _c2;
          _push(`<button type="button" class="${ssrRenderClass([((_a2 = unref(selectedPlace)) == null ? void 0 : _a2.id) === item.id ? "border-baby ring-2 ring-rose-100" : "border-slate-200", "min-h-0 w-full overflow-hidden rounded-xl border bg-white p-3 text-left shadow-soft transition hover:border-baby"])}"><h2 class="text-xl font-black text-ink">${ssrInterpolate(item.name)}</h2><p class="mt-1 text-sm text-slate-500">${ssrInterpolate(item.roadAddress || item.address)}</p><p class="mt-2 text-sm font-bold text-slate-700">${ssrInterpolate(item.facilityType || item.type || "\uC720\uD615 \uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")} \xB7 ${ssrInterpolate(item.distanceMeters)}m</p><p class="mt-1 text-sm text-slate-600">\uC815\uC6D0 ${ssrInterpolate((_b2 = item.capacity) != null ? _b2 : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")} \xB7 \uD604\uC6D0 ${ssrInterpolate((_c2 = item.currentEnrollment) != null ? _c2 : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</p></button>`);
        });
        _push(`<!--]--></div>`);
        if (unref(totalPages) > 1) {
          _push(`<div class="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><button class="rounded-lg px-3 py-2 text-sm font-bold text-baby disabled:text-slate-300"${ssrIncludeBooleanAttr(unref(currentPage) === 1) ? " disabled" : ""}>\uC774\uC804</button><span class="text-sm font-bold text-slate-600">${ssrInterpolate(unref(currentPage))} / ${ssrInterpolate(unref(totalPages))}</span><button class="rounded-lg px-3 py-2 text-sm font-bold text-baby disabled:text-slate-300"${ssrIncludeBooleanAttr(unref(currentPage) === unref(totalPages)) ? " disabled" : ""}>\uB2E4\uC74C</button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/baby/childcare/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-C2EM5fzs.mjs.map
