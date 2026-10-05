import { _ as _sfc_main$1 } from './StateBlock-zlgToguO.mjs';
import { defineComponent, ref, computed, withAsyncContext, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderComponent } from 'vue/server-renderer';
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
  __name: "checklist",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const type = ref("pregnancy");
    const periodKey = ref("week:4");
    const category = ref("all");
    const items = ref([]);
    const checked = ref({});
    const pending = ref(false);
    const errorMessage = ref("");
    const pregnancyCategories = ["\uAC80\uC0AC", "\uC9C4\uB8CC", "\uC0DD\uD65C", "\uC900\uBE44", "\uD589\uC815", "\uCD9C\uC0B0\uC900\uBE44"];
    const babyCategories = ["\uC608\uBC29\uC811\uC885", "\uAC74\uAC15\uAC80\uC9C4", "\uC218\uC720", "\uC218\uBA74", "\uBC1C\uB2EC", "\uC548\uC804", "\uC0DD\uD65C", "\uD589\uC815"];
    const categories = computed(() => type.value === "pregnancy" ? pregnancyCategories : babyCategories);
    const periodOptions = computed(() => type.value === "pregnancy" ? Array.from({ length: 37 }, (_, index) => ({ key: `week:${index + 4}`, label: `\uC784\uC2E0 ${index + 4}\uC8FC` })) : [...Array.from({ length: 12 }, (_, index) => ({ key: `week:${index + 1}`, label: `\uC0DD\uD6C4 ${index + 1}\uC8FC` })), ...Array.from({ length: 10 }, (_, index) => ({ key: `month:${index + 3}`, label: `\uC0DD\uD6C4 ${index + 3}\uAC1C\uC6D4` }))]);
    const filteredItems = computed(() => {
      const [periodType, value] = periodKey.value.split(":");
      const period = Number(value);
      return items.value.filter((item) => item.periodType === periodType && (periodType === "week" ? item.weekFrom === period : item.monthFrom === period) && (category.value === "all" || item.category === category.value));
    });
    function loadChecked() {
    }
    async function refresh() {
      var _a;
      pending.value = true;
      errorMessage.value = "";
      category.value = "all";
      try {
        const response = await $fetch("/api/baby/checklists", { query: { type: type.value } });
        if (!response.success) throw new Error(((_a = response.error) == null ? void 0 : _a.message) || "\uCCB4\uD06C\uB9AC\uC2A4\uD2B8 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
        items.value = response.data || [];
        periodKey.value = type.value === "pregnancy" ? "week:4" : "week:1";
        loadChecked();
      } catch (error) {
        items.value = [];
        errorMessage.value = error instanceof Error ? error.message : "\uCCB4\uD06C\uB9AC\uC2A4\uD2B8 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
      } finally {
        pending.value = false;
      }
    }
    [__temp, __restore] = withAsyncContext(() => refresh()), await __temp, __restore();
    const config = useRuntimeConfig();
    useSeoMeta({ title: "\uC784\uC2E0\xB7\uCD9C\uC0B0 \uD6C4 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8", description: "\uC784\uC2E0 \uC8FC\uCC28\uC640 \uCD9C\uC0B0 \uD6C4 \uC544\uAE30 \uC8FC\uCC28\xB7\uC6D4\uB839\uBCC4 \uD655\uC778\uC0AC\uD56D\uC744 \uACF5\uC2DD \uCD9C\uCC98\uC640 \uD568\uAED8 \uD655\uC778\uD569\uB2C8\uB2E4.", ogUrl: `${config.public.appBaseUrl}/baby/checklist` });
    useHead({ link: [{ rel: "canonical", href: `${config.public.appBaseUrl}/baby/checklist` }] });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_StateBlock = _sfc_main$1;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "page-shell py-8" }, _attrs))}><div class="mb-5"><p class="text-sm font-black uppercase tracking-wide text-baby">Checklist</p><h1 class="mt-2 text-3xl font-black text-ink">${ssrInterpolate(unref(type) === "pregnancy" ? "\uC784\uC2E0 \uC8FC\uCC28\uBCC4 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8" : "\uCD9C\uC0B0 \uD6C4 \uC544\uAE30 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8")}</h1><p class="mt-2 text-sm leading-6 text-slate-600">\uC774\uBC88 \uC8FC\uC5D0 \uD655\uC778\uD574\uBCF4\uC138\uC694. \uC77C\uBC18\uC801\uC778 \uD655\uC778\uC0AC\uD56D\uC774\uBA70 \uAC1C\uC778\uBCC4 \uC9C4\uB8CC \uBC0F \uAC80\uC0AC \uC77C\uC815\uC740 \uB2E4\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p><p class="mt-2 text-xs leading-5 text-slate-500">\uC815\uD655\uD55C \uC77C\uC815\uC740 \uC758\uB8CC\uC9C4 \uB610\uB294 \uACF5\uC2DD \uAE30\uAD00 \uC548\uB0B4\uB97C \uD655\uC778\uD558\uC138\uC694.</p></div><div class="mb-5 flex rounded-xl border border-slate-200 bg-white p-1 shadow-soft" role="tablist" aria-label="\uCCB4\uD06C\uB9AC\uC2A4\uD2B8 \uC720\uD615"><button type="button" role="tab"${ssrRenderAttr("aria-selected", unref(type) === "pregnancy")} class="${ssrRenderClass([unref(type) === "pregnancy" ? "bg-rose-50 text-baby" : "text-slate-500", "flex-1 rounded-lg px-3 py-3 text-sm font-black"])}">\uC784\uC2E0</button><button type="button" role="tab"${ssrRenderAttr("aria-selected", unref(type) === "baby")} class="${ssrRenderClass([unref(type) === "baby" ? "bg-rose-50 text-baby" : "text-slate-500", "flex-1 rounded-lg px-3 py-3 text-sm font-black"])}">\uCD9C\uC0B0 \uD6C4 \uC544\uAE30</button></div><section class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2"><label class="grid gap-2 text-sm font-bold text-ink">\uD655\uC778 \uC2DC\uAE30 <select class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3"><!--[-->`);
      ssrRenderList(unref(periodOptions), (option) => {
        _push(`<option${ssrRenderAttr("value", option.key)}${ssrIncludeBooleanAttr(Array.isArray(unref(periodKey)) ? ssrLooseContain(unref(periodKey), option.key) : ssrLooseEqual(unref(periodKey), option.key)) ? " selected" : ""}>${ssrInterpolate(option.label)}</option>`);
      });
      _push(`<!--]--></select></label><label class="grid gap-2 text-sm font-bold text-ink">\uCE74\uD14C\uACE0\uB9AC <select class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(unref(category)) ? ssrLooseContain(unref(category), "all") : ssrLooseEqual(unref(category), "all")) ? " selected" : ""}>\uC804\uCCB4</option><!--[-->`);
      ssrRenderList(unref(categories), (item) => {
        _push(`<option${ssrRenderAttr("value", item)}${ssrIncludeBooleanAttr(Array.isArray(unref(category)) ? ssrLooseContain(unref(category), item) : ssrLooseEqual(unref(category), item)) ? " selected" : ""}>${ssrInterpolate(item)}</option>`);
      });
      _push(`<!--]--></select></label></section>`);
      if (unref(type) === "pregnancy") {
        _push(`<section class="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-slate-700"> \uC77C\uBC18\uC801\uC778 \uAC80\uC0AC \uC2DC\uAE30 \uCC38\uACE0\uC815\uBCF4\uC785\uB2C8\uB2E4. \uBAA9\uB35C\uBBF8\uD22C\uBA85\uB300\uAC80\uC0AC\uB294 11~14\uC8FC, \uD1B5\uD569\uC120\uBCC4\uAC80\uC0AC 2\uCC28 \uD608\uC561\uAC80\uC0AC\uB294 15~22\uC8FC, \uC784\uC2E0\uC131 \uB2F9\uB1E8\uAC80\uC0AC\uB294 24~28\uC8FC\uC5D0 \uC2DC\uD589\uB420 \uC218 \uC788\uC73C\uBA70 \uAC1C\uC778\uBCC4 \uC77C\uC815\uC740 \uC758\uB8CC\uC9C4 \uC548\uB0B4\uB97C \uD655\uC778\uD558\uC138\uC694. </section>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(pending)) {
        _push(`<div class="mt-5 grid gap-3"><!--[-->`);
        ssrRenderList(4, (n) => {
          _push(`<div class="h-24 animate-pulse rounded-2xl bg-slate-100"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (unref(errorMessage)) {
        _push(ssrRenderComponent(_component_StateBlock, {
          class: "mt-5",
          eyebrow: "Error",
          title: "\uCCB4\uD06C\uB9AC\uC2A4\uD2B8\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4",
          text: unref(errorMessage)
        }, null, _parent));
      } else if (!unref(filteredItems).length) {
        _push(ssrRenderComponent(_component_StateBlock, {
          class: "mt-5",
          eyebrow: "No checklist data",
          title: "\uC774 \uC2DC\uAE30\uC758 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
          text: "\uACF5\uC2DD\uAE30\uAD00 \uC790\uB8CC\uB97C \uD655\uC778\uD574 \uCD94\uAC00\uD560 \uC218 \uC788\uB294 \uD56D\uBAA9\uC740 \uC21C\uCC28\uC801\uC73C\uB85C \uB4F1\uB85D\uB429\uB2C8\uB2E4."
        }, null, _parent));
      } else {
        _push(`<div class="mt-5 grid gap-3"><!--[-->`);
        ssrRenderList(unref(filteredItems), (item) => {
          _push(`<label class="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"><input${ssrIncludeBooleanAttr(Array.isArray(unref(checked)[item.id]) ? ssrLooseContain(unref(checked)[item.id], null) : unref(checked)[item.id]) ? " checked" : ""} class="mt-1 h-5 w-5 accent-rose-600" type="checkbox"><span class="min-w-0"><span class="mb-1 inline-flex rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-baby">${ssrInterpolate(item.category)}${ssrInterpolate(item.mandatory ? " \xB7 \uCC38\uACE0 \uC6B0\uC120\uC21C\uC704 \uB192\uC74C" : "")}</span><b class="block text-ink">${ssrInterpolate(item.title)}</b><span class="mt-1 block text-sm leading-6 text-slate-600">${ssrInterpolate(item.description)}</span>`);
          if (item.sourceUrl) {
            _push(`<a${ssrRenderAttr("href", item.sourceUrl)} target="_blank" rel="noopener" class="mt-2 inline-block text-xs font-bold text-baby">\uCD9C\uCC98: ${ssrInterpolate(item.sourceName || "\uACF5\uC2DD\uAE30\uAD00")} \u2192</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</span></label>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/baby/checklist.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=checklist-BauGzpEn.mjs.map
