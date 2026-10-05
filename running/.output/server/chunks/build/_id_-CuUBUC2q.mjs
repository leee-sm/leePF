import { c as useRoute, a as useSeoMeta, _ as __nuxt_component_0 } from './server.mjs';
import { _ as _sfc_main$1 } from './StateBlock-zlgToguO.mjs';
import { defineComponent, withAsyncContext, computed, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';
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
  __name: "[id]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const { data: response, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      `/api/baby/childcare/${encodeURIComponent(String(route.params.id))}`,
      "$ipZy628_t6"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const item = computed(() => {
      var _a;
      return ((_a = response.value) == null ? void 0 : _a.success) ? response.value.data : null;
    });
    const fields = computed(() => item.value ? [
      { label: "\uC720\uD615", value: item.value.type },
      { label: "\uC6B4\uC601\uC0C1\uD0DC", value: item.value.operatingStatus },
      { label: "\uC804\uD654\uBC88\uD638", value: item.value.phone },
      { label: "\uC815\uC6D0", value: item.value.capacity },
      { label: "\uD604\uC6D0", value: item.value.currentEnrollment },
      { label: "\uAD50\uC9C1\uC6D0\uC218", value: item.value.staffCount },
      { label: "\uBCF4\uC721\uC2E4\uC218", value: item.value.classroomCount },
      { label: "\uD1B5\uD559\uCC28\uB7C9", value: item.value.schoolBus },
      { label: "\uC778\uAC00\uC77C", value: item.value.approvalDate },
      { label: "\uB300\uAE30\uC778\uC6D0", value: item.value.waitlist }
    ] : []);
    useSeoMeta({ title: computed(() => item.value ? `${item.value.name} \uC5B4\uB9B0\uC774\uC9D1 \uC815\uBCF4` : "\uC5B4\uB9B0\uC774\uC9D1 \uC0C1\uC138\uC815\uBCF4"), description: "\uACF5\uC2DD \uACF5\uAC1C \uB370\uC774\uD130 \uAE30\uC900 \uC5B4\uB9B0\uC774\uC9D1 \uC0C1\uC138\uC815\uBCF4\uC785\uB2C8\uB2E4." });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_StateBlock = _sfc_main$1;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "page-shell py-8" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/baby/childcare",
        class: "text-sm font-bold text-baby"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`\u2190 \uC5B4\uB9B0\uC774\uC9D1 \uBAA9\uB85D`);
          } else {
            return [
              createTextVNode("\u2190 \uC5B4\uB9B0\uC774\uC9D1 \uBAA9\uB85D")
            ];
          }
        }),
        _: 1
      }, _parent));
      if (unref(error)) {
        _push(ssrRenderComponent(_component_StateBlock, {
          class: "mt-5",
          eyebrow: "Error",
          title: "\uC5B4\uB9B0\uC774\uC9D1 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4",
          text: "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
        }, null, _parent));
      } else if (unref(item)) {
        _push(`<article class="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8"><p class="text-sm font-black text-baby">Childcare detail</p><h1 class="mt-2 text-3xl font-black text-ink">${ssrInterpolate(unref(item).name)}</h1><p class="mt-2 text-slate-600">${ssrInterpolate(unref(item).roadAddress || unref(item).address)}</p><dl class="mt-6 grid gap-4 sm:grid-cols-2"><!--[-->`);
        ssrRenderList(unref(fields), (field) => {
          var _a;
          _push(`<div class="min-w-0 border-b border-slate-100 pb-3"><dt class="text-sm text-slate-500">${ssrInterpolate(field.label)}</dt><dd class="mt-1 break-words font-bold text-ink [overflow-wrap:anywhere]">${ssrInterpolate((_a = field.value) != null ? _a : "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C")}</dd></div>`);
        });
        _push(`<!--]--></dl>`);
        if (unref(item).placeUrl) {
          _push(`<a${ssrRenderAttr("href", unref(item).placeUrl)} target="_blank" rel="noopener" class="mt-6 inline-block rounded-xl bg-baby px-4 py-3 text-sm font-black text-white">\uC9C0\uB3C4\uC5D0\uC11C \uBCF4\uAE30</a>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="mt-6 text-xs leading-5 text-slate-500">\uACF5\uC2DD \uC5B4\uB9B0\uC774\uC9D1 \uACF5\uAC1C API\uC640 \uB9E4\uCE6D\uB418\uC9C0 \uC54A\uC740 Kakao \uC7A5\uC18C \uD6C4\uBCF4\uB294 \uC0C1\uC138 \uC815\uBCF4\uAC00 \uC81C\uD55C\uB429\uB2C8\uB2E4. \uB300\uAE30\uC778\uC6D0\uC740 \uACF5\uC2DD \uB370\uC774\uD130\uAC00 \uC5C6\uC73C\uBA74 \uACC4\uC0B0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</p></article>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/baby/childcare/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-CuUBUC2q.mjs.map
