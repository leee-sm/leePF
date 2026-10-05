import { _ as _sfc_main$1 } from './StateBlock-zlgToguO.mjs';
import { defineComponent, ref, computed, watch, withAsyncContext, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { a as useSeoMeta, u as useHead, b as useRuntimeConfig } from './server.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "benefits",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const sido = ref("");
    const sigungu = ref("");
    const items = ref([]);
    const regions = [
      { name: "\uC11C\uC6B8\uD2B9\uBCC4\uC2DC", children: ["\uC885\uB85C\uAD6C", "\uC911\uAD6C", "\uC6A9\uC0B0\uAD6C", "\uC131\uB3D9\uAD6C", "\uAD11\uC9C4\uAD6C", "\uB3D9\uB300\uBB38\uAD6C", "\uC911\uB791\uAD6C", "\uC131\uBD81\uAD6C", "\uAC15\uBD81\uAD6C", "\uB3C4\uBD09\uAD6C", "\uB178\uC6D0\uAD6C", "\uC740\uD3C9\uAD6C", "\uC11C\uB300\uBB38\uAD6C", "\uB9C8\uD3EC\uAD6C", "\uC591\uCC9C\uAD6C", "\uAC15\uC11C\uAD6C", "\uAD6C\uB85C\uAD6C", "\uAE08\uCC9C\uAD6C", "\uC601\uB4F1\uD3EC\uAD6C", "\uB3D9\uC791\uAD6C", "\uAD00\uC545\uAD6C", "\uC11C\uCD08\uAD6C", "\uAC15\uB0A8\uAD6C", "\uC1A1\uD30C\uAD6C", "\uAC15\uB3D9\uAD6C"] },
      { name: "\uBD80\uC0B0\uAD11\uC5ED\uC2DC", children: ["\uC911\uAD6C", "\uC11C\uAD6C", "\uB3D9\uAD6C", "\uC601\uB3C4\uAD6C", "\uBD80\uC0B0\uC9C4\uAD6C", "\uB3D9\uB798\uAD6C", "\uB0A8\uAD6C", "\uBD81\uAD6C", "\uD574\uC6B4\uB300\uAD6C", "\uC0AC\uD558\uAD6C", "\uAE08\uC815\uAD6C", "\uAC15\uC11C\uAD6C", "\uC5F0\uC81C\uAD6C", "\uC218\uC601\uAD6C", "\uC0AC\uC0C1\uAD6C", "\uAE30\uC7A5\uAD70"] },
      { name: "\uB300\uAD6C\uAD11\uC5ED\uC2DC", children: ["\uC911\uAD6C", "\uB3D9\uAD6C", "\uC11C\uAD6C", "\uB0A8\uAD6C", "\uBD81\uAD6C", "\uC218\uC131\uAD6C", "\uB2EC\uC11C\uAD6C", "\uB2EC\uC131\uAD70", "\uAD70\uC704\uAD70"] },
      { name: "\uC778\uCC9C\uAD11\uC5ED\uC2DC", children: ["\uC911\uAD6C", "\uB3D9\uAD6C", "\uBBF8\uCD94\uD640\uAD6C", "\uC5F0\uC218\uAD6C", "\uB0A8\uB3D9\uAD6C", "\uBD80\uD3C9\uAD6C", "\uACC4\uC591\uAD6C", "\uC11C\uAD6C", "\uAC15\uD654\uAD70", "\uC639\uC9C4\uAD70"] },
      { name: "\uAD11\uC8FC\uAD11\uC5ED\uC2DC", children: ["\uB3D9\uAD6C", "\uC11C\uAD6C", "\uB0A8\uAD6C", "\uBD81\uAD6C", "\uAD11\uC0B0\uAD6C"] },
      { name: "\uB300\uC804\uAD11\uC5ED\uC2DC", children: ["\uB3D9\uAD6C", "\uC911\uAD6C", "\uC11C\uAD6C", "\uC720\uC131\uAD6C", "\uB300\uB355\uAD6C"] },
      { name: "\uC6B8\uC0B0\uAD11\uC5ED\uC2DC", children: ["\uC911\uAD6C", "\uB0A8\uAD6C", "\uB3D9\uAD6C", "\uBD81\uAD6C", "\uC6B8\uC8FC\uAD70"] },
      { name: "\uC138\uC885\uD2B9\uBCC4\uC790\uCE58\uC2DC", children: ["\uC138\uC885\uC2DC"] },
      { name: "\uACBD\uAE30\uB3C4", children: ["\uC218\uC6D0\uC2DC", "\uC131\uB0A8\uC2DC", "\uC758\uC815\uBD80\uC2DC", "\uC548\uC591\uC2DC", "\uBD80\uCC9C\uC2DC", "\uAD11\uBA85\uC2DC", "\uD3C9\uD0DD\uC2DC", "\uC548\uC0B0\uC2DC", "\uACE0\uC591\uC2DC", "\uACFC\uCC9C\uC2DC", "\uAD6C\uB9AC\uC2DC", "\uB0A8\uC591\uC8FC\uC2DC", "\uC624\uC0B0\uC2DC", "\uC2DC\uD765\uC2DC", "\uAD70\uD3EC\uC2DC", "\uC758\uC655\uC2DC", "\uD558\uB0A8\uC2DC", "\uC6A9\uC778\uC2DC", "\uD30C\uC8FC\uC2DC", "\uC774\uCC9C\uC2DC", "\uC548\uC131\uC2DC", "\uAE40\uD3EC\uC2DC", "\uD654\uC131\uC2DC", "\uAD11\uC8FC\uC2DC", "\uC591\uC8FC\uC2DC", "\uD3EC\uCC9C\uC2DC", "\uC5EC\uC8FC\uC2DC", "\uC5F0\uCC9C\uAD70", "\uAC00\uD3C9\uAD70", "\uC591\uD3C9\uAD70"] },
      { name: "\uAC15\uC6D0\uD2B9\uBCC4\uC790\uCE58\uB3C4", children: ["\uCD98\uCC9C\uC2DC", "\uC6D0\uC8FC\uC2DC", "\uAC15\uB989\uC2DC", "\uB3D9\uD574\uC2DC", "\uD0DC\uBC31\uC2DC", "\uC18D\uCD08\uC2DC", "\uC0BC\uCC99\uC2DC", "\uD64D\uCC9C\uAD70", "\uD6A1\uC131\uAD70", "\uC601\uC6D4\uAD70", "\uD3C9\uCC3D\uAD70", "\uC815\uC120\uAD70", "\uCCA0\uC6D0\uAD70", "\uD654\uCC9C\uAD70", "\uC591\uAD6C\uAD70", "\uC778\uC81C\uAD70", "\uACE0\uC131\uAD70", "\uC591\uC591\uAD70"] },
      { name: "\uCDA9\uCCAD\uBD81\uB3C4", children: ["\uCCAD\uC8FC\uC2DC", "\uCDA9\uC8FC\uC2DC", "\uC81C\uCC9C\uC2DC", "\uBCF4\uC740\uAD70", "\uC625\uCC9C\uAD70", "\uC601\uB3D9\uAD70", "\uC99D\uD3C9\uAD70", "\uC9C4\uCC9C\uAD70", "\uAD34\uC0B0\uAD70", "\uC74C\uC131\uAD70", "\uB2E8\uC591\uAD70"] },
      { name: "\uCDA9\uCCAD\uB0A8\uB3C4", children: ["\uCC9C\uC548\uC2DC", "\uACF5\uC8FC\uC2DC", "\uBCF4\uB839\uC2DC", "\uC544\uC0B0\uC2DC", "\uC11C\uC0B0\uC2DC", "\uB17C\uC0B0\uC2DC", "\uACC4\uB8E1\uC2DC", "\uB2F9\uC9C4\uC2DC", "\uAE08\uC0B0\uAD70", "\uBD80\uC5EC\uAD70", "\uC11C\uCC9C\uAD70", "\uCCAD\uC591\uAD70", "\uD64D\uC131\uAD70", "\uC608\uC0B0\uAD70", "\uD0DC\uC548\uAD70"] },
      { name: "\uC804\uBD81\uD2B9\uBCC4\uC790\uCE58\uB3C4", children: ["\uC804\uC8FC\uC2DC", "\uAD70\uC0B0\uC2DC", "\uC775\uC0B0\uC2DC", "\uC815\uC74D\uC2DC", "\uB0A8\uC6D0\uC2DC", "\uAE40\uC81C\uC2DC", "\uC644\uC8FC\uAD70", "\uC9C4\uC548\uAD70", "\uBB34\uC8FC\uAD70", "\uC7A5\uC218\uAD70", "\uC784\uC2E4\uAD70", "\uC21C\uCC3D\uAD70", "\uACE0\uCC3D\uAD70", "\uBD80\uC548\uAD70"] },
      { name: "\uC804\uB77C\uB0A8\uB3C4", children: ["\uBAA9\uD3EC\uC2DC", "\uC5EC\uC218\uC2DC", "\uC21C\uCC9C\uC2DC", "\uB098\uC8FC\uC2DC", "\uAD11\uC591\uC2DC", "\uB2F4\uC591\uAD70", "\uACE1\uC131\uAD70", "\uAD6C\uB840\uAD70", "\uACE0\uD765\uAD70", "\uBCF4\uC131\uAD70", "\uD654\uC21C\uAD70", "\uC7A5\uD765\uAD70", "\uAC15\uC9C4\uAD70", "\uD574\uB0A8\uAD70", "\uC601\uC554\uAD70", "\uBB34\uC548\uAD70", "\uD568\uD3C9\uAD70", "\uC601\uAD11\uAD70", "\uC7A5\uC131\uAD70", "\uC644\uB3C4\uAD70", "\uC9C4\uB3C4\uAD70", "\uC2E0\uC548\uAD70"] },
      { name: "\uACBD\uC0C1\uBD81\uB3C4", children: ["\uD3EC\uD56D\uC2DC", "\uACBD\uC8FC\uC2DC", "\uAE40\uCC9C\uC2DC", "\uC548\uB3D9\uC2DC", "\uAD6C\uBBF8\uC2DC", "\uC601\uC8FC\uC2DC", "\uC601\uCC9C\uC2DC", "\uC0C1\uC8FC\uC2DC", "\uBB38\uACBD\uC2DC", "\uACBD\uC0B0\uC2DC", "\uC758\uC131\uAD70", "\uCCAD\uC1A1\uAD70", "\uC601\uC591\uAD70", "\uC601\uB355\uAD70", "\uCCAD\uB3C4\uAD70", "\uACE0\uB839\uAD70", "\uC131\uC8FC\uAD70", "\uCE60\uACE1\uAD70", "\uC608\uCC9C\uAD70", "\uBD09\uD654\uAD70", "\uC6B8\uC9C4\uAD70", "\uC6B8\uB989\uAD70"] },
      { name: "\uACBD\uC0C1\uB0A8\uB3C4", children: ["\uCC3D\uC6D0\uC2DC", "\uC9C4\uC8FC\uC2DC", "\uD1B5\uC601\uC2DC", "\uC0AC\uCC9C\uC2DC", "\uAE40\uD574\uC2DC", "\uBC00\uC591\uC2DC", "\uAC70\uC81C\uC2DC", "\uC591\uC0B0\uC2DC", "\uC758\uB839\uAD70", "\uD568\uC548\uAD70", "\uCC3D\uB155\uAD70", "\uACE0\uC131\uAD70", "\uB0A8\uD574\uAD70", "\uD558\uB3D9\uAD70", "\uC0B0\uCCAD\uAD70", "\uD568\uC591\uAD70", "\uAC70\uCC3D\uAD70", "\uD569\uCC9C\uAD70"] },
      { name: "\uC81C\uC8FC\uD2B9\uBCC4\uC790\uCE58\uB3C4", children: ["\uC81C\uC8FC\uC2DC", "\uC11C\uADC0\uD3EC\uC2DC"] }
    ];
    const sigunguOptions = computed(() => {
      var _a;
      return ((_a = regions.find((item) => item.name === sido.value)) == null ? void 0 : _a.children) || [];
    });
    watch(sido, () => {
      sigungu.value = "";
    });
    async function refresh() {
      const response = await $fetch("/api/baby/benefits", { query: { sido: sido.value || void 0, sigungu: sigungu.value || void 0 } });
      items.value = response.success ? response.data || [] : [];
    }
    [__temp, __restore] = withAsyncContext(() => refresh()), await __temp, __restore();
    const config = useRuntimeConfig();
    useSeoMeta({
      title: "\uC784\uC2E0\xB7\uCD9C\uC0B0 \uD61C\uD0DD \uBC0F \uC9C0\uC5ED\uBCC4 \uC9C0\uC6D0\uC815\uBCF4",
      description: "\uC804\uAD6D \uACF5\uD1B5 \uBC0F \uC9C0\uC5ED\uBCC4 \uC784\uC2E0\xB7\uCD9C\uC0B0 \uC9C0\uC6D0 \uC815\uCC45\uC744 \uACF5\uC2DD \uCD9C\uCC98\uC640 \uAE30\uC900\uC77C \uC911\uC2EC\uC73C\uB85C \uD655\uC778\uD569\uB2C8\uB2E4.",
      ogUrl: `${config.public.appBaseUrl}/baby/benefits`
    });
    useHead({ link: [{ rel: "canonical", href: `${config.public.appBaseUrl}/baby/benefits` }] });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_StateBlock = _sfc_main$1;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "page-shell py-8" }, _attrs))}><div class="mb-5"><p class="text-sm font-black uppercase tracking-wide text-baby">Benefits</p><h1 class="mt-2 text-3xl font-black text-ink">\uC784\uC2E0\xB7\uCD9C\uC0B0 \uD61C\uD0DD</h1><p class="mt-2 text-sm leading-6 text-slate-600">\uC815\uCC45\uC740 DB\uC5D0 \uACF5\uC2DD \uCD9C\uCC98\uC640 \uAE30\uC900\uC77C\uC744 \uD568\uAED8 \uAD00\uB9AC\uD569\uB2C8\uB2E4. \uCD08\uAE30\uC5D0\uB294 \uC784\uC758 \uB370\uC774\uD130\uB97C \uD45C\uC2DC\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</p></div><form class="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-3"><select class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3" aria-label="\uC2DC\uB3C4 \uC120\uD0DD"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(sido)) ? ssrLooseContain(unref(sido), "") : ssrLooseEqual(unref(sido), "")) ? " selected" : ""}>\uC804\uAD6D \uACF5\uD1B5</option><!--[-->`);
      ssrRenderList(regions, (item) => {
        _push(`<option${ssrRenderAttr("value", item.name)}${ssrIncludeBooleanAttr(Array.isArray(unref(sido)) ? ssrLooseContain(unref(sido), item.name) : ssrLooseEqual(unref(sido), item.name)) ? " selected" : ""}>${ssrInterpolate(item.name)}</option>`);
      });
      _push(`<!--]--></select><select class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3"${ssrIncludeBooleanAttr(!unref(sido)) ? " disabled" : ""} aria-label="\uC2DC\uAD70\uAD6C \uC120\uD0DD"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(sigungu)) ? ssrLooseContain(unref(sigungu), "") : ssrLooseEqual(unref(sigungu), "")) ? " selected" : ""}>${ssrInterpolate(unref(sido) ? "\uC2DC\xB7\uAD70\xB7\uAD6C \uC804\uCCB4" : "\uC2DC\xB7\uB3C4 \uBA3C\uC800 \uC120\uD0DD")}</option><!--[-->`);
      ssrRenderList(unref(sigunguOptions), (item) => {
        _push(`<option${ssrRenderAttr("value", item)}${ssrIncludeBooleanAttr(Array.isArray(unref(sigungu)) ? ssrLooseContain(unref(sigungu), item) : ssrLooseEqual(unref(sigungu), item)) ? " selected" : ""}>${ssrInterpolate(item)}</option>`);
      });
      _push(`<!--]--></select><button class="focus-ring min-h-12 rounded-xl bg-baby px-4 font-black text-white">\uC9C0\uC5ED \uD61C\uD0DD \uC870\uD68C</button></form>`);
      if (!unref(items).length) {
        _push(ssrRenderComponent(_component_StateBlock, {
          eyebrow: "No official policy data",
          title: "\uB4F1\uB85D\uB41C \uACF5\uC2DD \uD61C\uD0DD \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
          text: "\uACF5\uACF5\uB370\uC774\uD130 \uB610\uB294 \uACF5\uC2DD \uCD9C\uCC98 \uAE30\uBC18 \uC815\uCC45\uC744 DB\uC5D0 \uC801\uC7AC\uD558\uBA74 \uC774\uACF3\uC5D0 \uC804\uAD6D \uACF5\uD1B5 \uBC0F \uC9C0\uC5ED\uBCC4 \uD61C\uD0DD\uC774 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
        }, null, _parent));
      } else {
        _push(`<div class="grid gap-3"><!--[-->`);
        ssrRenderList(unref(items), (item) => {
          _push(`<article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><h2 class="text-xl font-black text-ink">${ssrInterpolate(item.title)}</h2>`);
          if (item.amount) {
            _push(`<p class="mt-2 text-lg font-black text-baby">${ssrInterpolate(item.amount)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<p class="mt-2 text-sm leading-6 text-slate-600">${ssrInterpolate(item.content || "\uC0C1\uC138 \uB0B4\uC6A9 \uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</p><p class="mt-3 text-xs text-slate-500">\uCD9C\uCC98: ${ssrInterpolate(item.sourceName || "\uACF5\uC2DD \uCD9C\uCC98 \uD655\uC778 \uD544\uC694")} \xB7 \uAE30\uC900\uC77C ${ssrInterpolate(item.updatedSourceAt || item.effectiveDate || "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</p></article>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/baby/benefits.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=benefits-BZ1idFbt.mjs.map
