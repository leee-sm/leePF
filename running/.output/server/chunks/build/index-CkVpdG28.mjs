import { a as useSeoMeta, u as useHead, _ as __nuxt_component_0, b as useRuntimeConfig } from './server.mjs';
import { _ as _sfc_main$1 } from './StateBlock-zlgToguO.mjs';
import { defineComponent, withAsyncContext, computed, mergeProps, withCtx, createTextVNode, unref, createVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderAttr } from 'vue/server-renderer';
import { u as useFetch } from './fetch-CQWeqfZ5.mjs';
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
import '@vue/shared';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data: response, pending, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/baby/benefits",
      "$G8GW1RNs3J"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const benefits = computed(() => {
      var _a;
      return ((_a = response.value) == null ? void 0 : _a.success) ? response.value.data || [] : [];
    });
    const links = [
      { eyebrow: "Benefits", title: "\uC9C0\uC5ED\uBCC4 \uD61C\uD0DD", text: "\uC2DC\xB7\uB3C4\uC640 \uC2DC\xB7\uAD70\xB7\uAD6C\uB97C \uC120\uD0DD\uD574 \uCD94\uAC00 \uC9C0\uC6D0\uC744 \uD655\uC778\uD569\uB2C8\uB2E4.", to: "/baby/benefits" },
      { eyebrow: "Hospitals", title: "\uC8FC\uBCC0 \uBCD1\uC6D0", text: "\uC8FC\uC18C\uB97C \uAC80\uC0C9\uD558\uACE0 3\xB75\xB710km \uB0B4 \uBCD1\uC6D0\uC744 \uCC3E\uC2B5\uB2C8\uB2E4.", to: "/baby/hospitals" },
      { eyebrow: "Checklist", title: "\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", text: "\uC784\uC2E0 \uC8FC\uCC28\uC640 \uC544\uAE30 \uC8FC\uCC28\uBCC4 \uC900\uBE44\uC0AC\uD56D\uC744 \uAD00\uB9AC\uD569\uB2C8\uB2E4.", to: "/baby/checklist" },
      { eyebrow: "Childcare", title: "\uC5B4\uB9B0\uC774\uC9D1", text: "\uC8FC\uBCC0 \uC5B4\uB9B0\uC774\uC9D1 \uACF5\uAC1C \uC815\uBCF4\uB97C \uD655\uC778\uD569\uB2C8\uB2E4.", to: "/baby/childcare" }
    ];
    const config = useRuntimeConfig();
    useSeoMeta({ title: "\uC784\uC2E0\xB7\uCD9C\uC0B0 \uD61C\uD0DD \uBC0F \uC721\uC544 \uC815\uBCF4", description: "\uC804\uAD6D \uACF5\uD1B5 \uC784\uC2E0\xB7\uCD9C\uC0B0 \uD61C\uD0DD\uACFC \uC9C0\uC5ED\uBCC4 \uC9C0\uC6D0, \uBCD1\uC6D0, \uCCB4\uD06C\uB9AC\uC2A4\uD2B8, \uC5B4\uB9B0\uC774\uC9D1 \uC815\uBCF4\uB97C \uD655\uC778\uD558\uC138\uC694.", ogUrl: `${config.public.appBaseUrl}/baby` });
    useHead({ link: [{ rel: "canonical", href: `${config.public.appBaseUrl}/baby` }] });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_StateBlock = _sfc_main$1;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "page-shell py-8" }, _attrs))}><section class="rounded-3xl bg-white p-6 shadow-soft sm:p-8"><p class="text-sm font-black uppercase tracking-wide text-baby">Baby guide</p><h1 class="mt-2 text-3xl font-black text-ink sm:text-5xl">\uC784\uC2E0\xB7\uCD9C\uC0B0\uACFC \uC721\uC544\uC5D0 \uD544\uC694\uD55C \uACF5\uC2DD \uC815\uBCF4</h1><p class="mt-4 max-w-2xl leading-7 text-slate-600">\uC804\uAD6D \uACF5\uD1B5 \uD61C\uD0DD\uC744 \uBA3C\uC800 \uD655\uC778\uD558\uACE0, \uC9C0\uC5ED \uD61C\uD0DD\xB7\uBCD1\uC6D0\xB7\uCCB4\uD06C\uB9AC\uC2A4\uD2B8\xB7\uC5B4\uB9B0\uC774\uC9D1 \uC815\uBCF4\uB97C \uC774\uC5B4\uC11C \uCC3E\uC544\uBCF4\uC138\uC694.</p></section><section class="mt-6 rounded-3xl border border-rose-100 bg-rose-50/60 p-5 sm:p-7"><div class="flex flex-wrap items-end justify-between gap-4"><div><p class="text-sm font-black text-baby">\uC804\uAD6D \uACF5\uD1B5 \uD61C\uD0DD</p><h2 class="mt-1 text-2xl font-black text-ink">\uC784\uC2E0\xB7\uCD9C\uC0B0 \uC8FC\uC694 \uC9C0\uC6D0</h2></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/baby/benefits",
        class: "rounded-xl bg-baby px-4 py-3 text-sm font-black text-white"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`\uC9C0\uC5ED\uBCC4 \uD61C\uD0DD \uCC3E\uAE30`);
          } else {
            return [
              createTextVNode("\uC9C0\uC5ED\uBCC4 \uD61C\uD0DD \uCC3E\uAE30")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(pending)) {
        _push(`<div class="mt-5 grid gap-3 sm:grid-cols-2"><!--[-->`);
        ssrRenderList(4, (n) => {
          _push(`<div class="h-32 animate-pulse rounded-2xl bg-white/80"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (unref(error)) {
        _push(ssrRenderComponent(_component_StateBlock, {
          class: "mt-5",
          eyebrow: "Error",
          title: "\uD61C\uD0DD \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4",
          text: "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
        }, null, _parent));
      } else if (!unref(benefits).length) {
        _push(ssrRenderComponent(_component_StateBlock, {
          class: "mt-5",
          eyebrow: "No data",
          title: "\uB4F1\uB85D\uB41C \uACF5\uC2DD \uD61C\uD0DD \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
          text: "\uACF5\uACF5\uB370\uC774\uD130 \uB610\uB294 \uACF5\uC2DD\uAE30\uAD00 \uC790\uB8CC\uAC00 \uC5F0\uACB0\uB418\uBA74 \uC774\uACF3\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
        }, null, _parent));
      } else {
        _push(`<div class="mt-5 grid gap-3 sm:grid-cols-2"><!--[-->`);
        ssrRenderList(unref(benefits), (item) => {
          _push(`<article class="rounded-2xl bg-white p-5 ring-1 ring-rose-100"><h3 class="text-lg font-black text-ink">${ssrInterpolate(item.title)}</h3>`);
          if (item.amount) {
            _push(`<p class="mt-2 text-lg font-black text-baby">${ssrInterpolate(item.amount)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<p class="mt-2 text-sm leading-6 text-slate-600">${ssrInterpolate(item.content || "\uC0C1\uC138 \uC9C0\uC6D0\uB0B4\uC6A9\uC740 \uACF5\uC2DD \uC548\uB0B4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.")}</p><p class="mt-3 text-xs text-slate-500">\uB300\uC0C1: ${ssrInterpolate(item.target || "\uACF5\uC2DD \uC548\uB0B4 \uD655\uC778 \uD544\uC694")} \xB7 ${ssrInterpolate(item.updatedSourceAt || item.effectiveDate || "\uAE30\uC900\uC77C \uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</p>`);
          if (item.officialUrl) {
            _push(`<a${ssrRenderAttr("href", item.officialUrl)} target="_blank" rel="noopener" class="mt-3 inline-block text-sm font-bold text-baby">\uACF5\uC2DD \uC548\uB0B4 \uD655\uC778 \u2192</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</article>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`<p class="mt-5 text-xs leading-5 text-slate-500">\uC815\uCC45\uC740 \uBCC0\uACBD\uB420 \uC218 \uC788\uC73C\uBBC0\uB85C \uC2E0\uCCAD \uC804 \uBC18\uB4DC\uC2DC \uACF5\uC2DD\uAE30\uAD00\uC758 \uCD5C\uC2E0 \uC548\uB0B4\uB97C \uCD5C\uC885 \uD655\uC778\uD558\uC138\uC694.</p></section><section class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><!--[-->`);
      ssrRenderList(links, (item) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: item.to,
          to: item.to,
          class: "rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:border-rose-300"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="text-sm font-black text-baby"${_scopeId}>${ssrInterpolate(item.eyebrow)}</span><h2 class="mt-2 text-xl font-black text-ink"${_scopeId}>${ssrInterpolate(item.title)}</h2><p class="mt-2 text-sm leading-6 text-slate-600"${_scopeId}>${ssrInterpolate(item.text)}</p>`);
            } else {
              return [
                createVNode("span", { class: "text-sm font-black text-baby" }, toDisplayString(item.eyebrow), 1),
                createVNode("h2", { class: "mt-2 text-xl font-black text-ink" }, toDisplayString(item.title), 1),
                createVNode("p", { class: "mt-2 text-sm leading-6 text-slate-600" }, toDisplayString(item.text), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></section></main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/baby/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CkVpdG28.mjs.map
