import { _ as _sfc_main$1 } from './StateBlock-zlgToguO.mjs';
import { c as useRoute, a as useSeoMeta, u as useHead, _ as __nuxt_component_0, b as useRuntimeConfig } from './server.mjs';
import { defineComponent, withAsyncContext, computed, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';
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
  __name: "[id]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const response = ([__temp, __restore] = withAsyncContext(() => $fetch(`/api/running/marathons/${route.params.id}`)), __temp = await __temp, __restore(), __temp);
    const marathon = computed(() => response.success ? response.data : null);
    const rows = computed(() => {
      var _a;
      const item = marathon.value;
      if (!item) return [];
      return [
        { label: "\uAC1C\uCD5C\uC77C", value: item.raceDate },
        { label: "\uC2DC\uC791\uC2DC\uAC04", value: item.startTime },
        { label: "\uC0C1\uC138\uC8FC\uC18C", value: item.address },
        { label: "\uC811\uC218\uAE30\uAC04", value: [item.registrationStartDate, item.registrationEndDate].filter(Boolean).join(" ~ ") },
        { label: "\uC811\uC218\uC0C1\uD0DC", value: item.registrationStatus },
        { label: "\uC885\uBAA9", value: (_a = item.distances) == null ? void 0 : _a.join(" / ") },
        { label: "\uCC38\uAC00\uBE44", value: item.entryFee },
        { label: "\uC8FC\uCD5C", value: item.organizer },
        { label: "\uC8FC\uAD00", value: item.host },
        { label: "\uCD9C\uCC98", value: item.sourceName }
      ];
    });
    const config = useRuntimeConfig();
    useSeoMeta({
      title: marathon.value ? `${marathon.value.name} \uC0C1\uC138\uC815\uBCF4` : "\uB9C8\uB77C\uD1A4 \uC0C1\uC138\uC815\uBCF4",
      description: "\uB9C8\uB77C\uD1A4 \uAC1C\uCD5C\uC77C, \uC9C0\uC5ED, \uC811\uC218 \uC0C1\uD0DC, \uC885\uBAA9, \uACF5\uC2DD \uD648\uD398\uC774\uC9C0 \uC815\uBCF4\uB97C \uD655\uC778\uD569\uB2C8\uB2E4.",
      ogUrl: `${config.public.appBaseUrl}/running/marathons/${route.params.id}`
    });
    useHead({ link: [{ rel: "canonical", href: `${config.public.appBaseUrl}/running/marathons/${route.params.id}` }] });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_StateBlock = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "page-shell py-8" }, _attrs))}>`);
      if (!unref(marathon)) {
        _push(ssrRenderComponent(_component_StateBlock, {
          eyebrow: "Not found",
          title: "\uB300\uD68C \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
          text: "DB\uC5D0 \uB4F1\uB85D\uB41C \uACF5\uC2DD \uCD9C\uCC98 \uAE30\uBC18 \uB300\uD68C\uB9CC \uC0C1\uC138 \uD398\uC774\uC9C0\uB97C \uC81C\uACF5\uD569\uB2C8\uB2E4."
        }, null, _parent));
      } else {
        _push(`<article class="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          class: "text-sm font-bold text-running",
          to: "/running/marathons"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`\u2190 \uBAA9\uB85D\uC73C\uB85C`);
            } else {
              return [
                createTextVNode("\u2190 \uBAA9\uB85D\uC73C\uB85C")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<h1 class="mt-4 text-3xl font-black text-ink">${ssrInterpolate(unref(marathon).name)}</h1><p class="mt-2 text-sm text-slate-500">${ssrInterpolate(unref(marathon).region || "\uC9C0\uC5ED \uC815\uBCF4 \uC5C6\uC74C")} \xB7 ${ssrInterpolate(unref(marathon).dday)}</p><dl class="mt-6 grid gap-4 sm:grid-cols-2"><!--[-->`);
        ssrRenderList(unref(rows), (row) => {
          _push(`<div class="rounded-xl bg-slate-50 p-4"><dt class="text-xs font-bold text-slate-500">${ssrInterpolate(row.label)}</dt><dd class="mt-1 min-w-0 break-words font-bold text-ink [overflow-wrap:anywhere]">${ssrInterpolate(row.value || "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div>`);
        });
        _push(`<!--]--></dl><div class="mt-6 flex flex-wrap gap-2">`);
        if (unref(marathon).websiteUrl) {
          _push(`<a class="rounded-xl bg-ink px-4 py-3 text-sm font-black text-white"${ssrRenderAttr("href", unref(marathon).websiteUrl)} target="_blank" rel="noreferrer">\uACF5\uC2DD \uD648\uD398\uC774\uC9C0</a>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(marathon).registrationUrl) {
          _push(`<a class="rounded-xl bg-running px-4 py-3 text-sm font-black text-white"${ssrRenderAttr("href", unref(marathon).registrationUrl)} target="_blank" rel="noreferrer">\uC811\uC218 \uD398\uC774\uC9C0</a>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></article>`);
      }
      _push(`</main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/running/marathons/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-CTVBpLv1.mjs.map
