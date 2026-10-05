import { _ as _sfc_main$1 } from './AddressSearch-CHXVukCx.mjs';
import { _ as _sfc_main$2 } from './StateBlock-zlgToguO.mjs';
import { _ as _sfc_main$3 } from './KakaoMap-CoCCG5vG.mjs';
import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue/server-renderer/index.mjs';
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

const pageSize = 5;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "hospitals",
  __ssrInlineRender: true,
  setup(__props) {
    const selected = ref(null);
    const selectedPlace = ref(null);
    const selectedRadius = ref(3e3);
    const items = ref([]);
    const message = ref("");
    const currentPage = ref(1);
    const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)));
    const pagedItems = computed(() => items.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize));
    function statusDotClass(status) {
      return status === "\uC601\uC5C5\uC911" ? "bg-emerald-500" : status === "\uC601\uC5C5\uC885\uB8CC" || status === "\uD734\uBB34" ? "bg-red-500" : "bg-slate-300";
    }
    function selectPlace(item) {
      selectedPlace.value = item;
    }
    async function selectAddress(item) {
      selected.value = item;
      selectedPlace.value = null;
      currentPage.value = 1;
      await load();
    }
    async function load() {
      var _a;
      if (!selected.value) return;
      message.value = "";
      items.value = [];
      selectedPlace.value = null;
      const response = await $fetch("/api/baby/hospitals", { query: { lat: selected.value.latitude, lon: selected.value.longitude, radius: selectedRadius.value } });
      if (!response.success) {
        message.value = ((_a = response.error) == null ? void 0 : _a.message) || "\uBCD1\uC6D0 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
        return;
      }
      items.value = response.data || [];
      currentPage.value = 1;
      if (!items.value.length) message.value = "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.";
    }
    const config = useRuntimeConfig();
    useSeoMeta({ title: "\uC8FC\uBCC0 \uBCD1\uC6D0 \uCC3E\uAE30", description: "\uC8FC\uC18C \uAE30\uC900 \uC8FC\uBCC0 \uBCD1\uC6D0 \uBAA9\uB85D\uACFC \uC704\uCE58 \uC815\uBCF4\uB97C \uD655\uC778\uD569\uB2C8\uB2E4.", ogUrl: `${config.public.appBaseUrl}/baby/hospitals` });
    useHead({ link: [{ rel: "canonical", href: `${config.public.appBaseUrl}/baby/hospitals` }] });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_AddressSearch = _sfc_main$1;
      const _component_StateBlock = _sfc_main$2;
      const _component_KakaoMap = _sfc_main$3;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "page-shell py-8" }, _attrs))}><div class="mb-5"><p class="text-sm font-black uppercase tracking-wide text-baby">Hospitals</p><h1 class="mt-2 text-3xl font-black text-ink">\uC8FC\uBCC0 \uBCD1\uC6D0 \uCC3E\uAE30</h1><p class="mt-2 text-sm leading-6 text-slate-600">\uC8FC\uC18C\uB97C \uAC80\uC0C9\uD55C \uB4A4 \uC9C0\uB3C4\uC5D0\uC11C \uBCD1\uC6D0\uC744 \uC120\uD0DD\uD558\uBA74 \uC624\uB978\uCABD\uC5D0\uC11C \uC0C1\uC138 \uC815\uBCF4\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p></div>`);
      _push(ssrRenderComponent(_component_AddressSearch, {
        label: "\uAE30\uC900 \uC8FC\uC18C",
        onSelect: selectAddress
      }, null, _parent));
      _push(`<div class="mt-4 flex gap-2"><!--[-->`);
      ssrRenderList([3e3, 5e3, 1e4], (radius) => {
        _push(`<button class="${ssrRenderClass([unref(selectedRadius) === radius ? "border-baby bg-rose-50 text-baby" : "border-slate-200 bg-white", "rounded-xl border px-3 py-2 text-sm font-bold"])}">${ssrInterpolate(radius / 1e3)}km</button>`);
      });
      _push(`<!--]--></div>`);
      if (unref(message)) {
        _push(ssrRenderComponent(_component_StateBlock, {
          class: "mt-5",
          eyebrow: "Status",
          title: "\uBCD1\uC6D0 \uAC80\uC0C9 \uC548\uB0B4",
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
          _push(`<article class="rounded-2xl border border-baby/30 bg-rose-50 p-5"><p class="text-xs font-black uppercase tracking-wide text-baby">\uC120\uD0DD\uD55C \uBCD1\uC6D0 \uC0C1\uC138</p><h2 class="mt-2 text-xl font-black text-ink">${ssrInterpolate(unref(selectedPlace).name)}</h2><dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt class="text-slate-500">\uC8FC\uC18C</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate(unref(selectedPlace).roadAddress || unref(selectedPlace).address || "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uAC70\uB9AC</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate((_a = unref(selectedPlace).distanceMeters) != null ? _a : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}${ssrInterpolate(unref(selectedPlace).distanceMeters != null ? "m" : "")}</dd></div><div><dt class="text-slate-500">\uC804\uD654\uBC88\uD638</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate(unref(selectedPlace).phone || "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div><div><dt class="text-slate-500">\uC601\uC5C5 \uC0C1\uD0DC</dt><dd class="mt-1 flex items-center gap-2 font-bold text-ink"><span class="${ssrRenderClass([statusDotClass(unref(selectedPlace).openStatus), "h-2.5 w-2.5 rounded-full"])}"></span>${ssrInterpolate(unref(selectedPlace).openStatus || "\uC601\uC5C5\uC2DC\uAC04 \uD655\uC778 \uD544\uC694")}</dd></div><div class="sm:col-span-2"><dt class="text-slate-500">\uBD84\uB958</dt><dd class="mt-1 font-bold text-ink">${ssrInterpolate(unref(selectedPlace).category || "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div></dl></article>`);
        } else {
          _push(`<p class="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">\uC9C0\uB3C4\uC5D0\uC11C \uBCD1\uC6D0 \uC704\uCE58\uB97C \uC120\uD0DD\uD558\uC138\uC694.</p>`);
        }
        _push(`<div class="min-h-0 flex-1 grid grid-rows-5 gap-2"><!--[-->`);
        ssrRenderList(unref(pagedItems), (item) => {
          var _a2;
          _push(`<button type="button" class="${ssrRenderClass([((_a2 = unref(selectedPlace)) == null ? void 0 : _a2.id) === item.id ? "border-baby ring-2 ring-rose-100" : "border-slate-200", "min-h-0 w-full overflow-hidden rounded-xl border bg-white p-3 text-left shadow-soft transition hover:border-baby"])}"><h2 class="text-xl font-black text-ink">${ssrInterpolate(item.name)}</h2><p class="mt-1 text-sm text-slate-500">${ssrInterpolate(item.roadAddress || item.address)}</p><p class="mt-2 flex items-center gap-2 text-sm font-bold text-slate-700"><span class="${ssrRenderClass([statusDotClass(item.openStatus), "h-2.5 w-2.5 rounded-full"])}"></span>${ssrInterpolate(item.distanceMeters)}m \xB7 ${ssrInterpolate(item.openStatus || "\uC601\uC5C5\uC2DC\uAC04 \uD655\uC778 \uD544\uC694")}</p><p class="mt-1 text-sm text-slate-600">${ssrInterpolate(item.phone || "\uC804\uD654\uBC88\uD638 \uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</p></button>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/baby/hospitals.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=hospitals-D1SSbOp2.mjs.map
