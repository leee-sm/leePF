import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
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
  __name: "pace",
  __ssrInlineRender: true,
  setup(__props) {
    const distanceType = ref("10k");
    const hours = ref(0);
    const minutes = ref(50);
    const seconds = ref(0);
    const error = ref("");
    const result = ref(null);
    const config = useRuntimeConfig();
    useSeoMeta({
      title: "\uBAA9\uD45C \uD398\uC774\uC2A4 \uACC4\uC0B0\uAE30",
      description: "10km, Half, Full \uBAA9\uD45C\uC2DC\uAC04\uC744 \uAE30\uC900\uC73C\uB85C 1km \uD3C9\uADE0 \uD398\uC774\uC2A4\uC640 \uB204\uC801 \uD1B5\uACFC\uC2DC\uAC04\uC744 \uACC4\uC0B0\uD569\uB2C8\uB2E4.",
      ogUrl: `${config.public.appBaseUrl}/running/pace`
    });
    useHead({ link: [{ rel: "canonical", href: `${config.public.appBaseUrl}/running/pace` }] });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "page-shell py-8" }, _attrs))}><div class="mb-5"><p class="text-sm font-black uppercase tracking-wide text-running">Pace Calculator</p><h1 class="mt-2 text-3xl font-black text-ink">\uBAA9\uD45C \uD398\uC774\uC2A4 \uACC4\uC0B0</h1><p class="mt-2 text-sm leading-6 text-slate-600">\uCD08 \uB2E8\uC704 \uC815\uC218 \uACC4\uC0B0\uC73C\uB85C \uD3C9\uADE0 \uD398\uC774\uC2A4\uC640 \uAC70\uB9AC\uBCC4 \uB204\uC801 \uD1B5\uACFC\uC2DC\uAC04\uC744 \uACC4\uC0B0\uD569\uB2C8\uB2E4.</p></div><form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><div class="grid gap-4 sm:grid-cols-4"><label class="grid gap-2 text-sm font-bold text-ink"> \uAC70\uB9AC <select class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3"><option value="10k"${ssrIncludeBooleanAttr(Array.isArray(unref(distanceType)) ? ssrLooseContain(unref(distanceType), "10k") : ssrLooseEqual(unref(distanceType), "10k")) ? " selected" : ""}>10km</option><option value="half"${ssrIncludeBooleanAttr(Array.isArray(unref(distanceType)) ? ssrLooseContain(unref(distanceType), "half") : ssrLooseEqual(unref(distanceType), "half")) ? " selected" : ""}>Half</option><option value="full"${ssrIncludeBooleanAttr(Array.isArray(unref(distanceType)) ? ssrLooseContain(unref(distanceType), "full") : ssrLooseEqual(unref(distanceType), "full")) ? " selected" : ""}>Full</option></select></label><label class="grid gap-2 text-sm font-bold text-ink">\uC2DC\uAC04<input${ssrRenderAttr("value", unref(hours))} class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3" type="number" min="0"></label><label class="grid gap-2 text-sm font-bold text-ink">\uBD84<input${ssrRenderAttr("value", unref(minutes))} class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3" type="number" min="0" max="59"></label><label class="grid gap-2 text-sm font-bold text-ink">\uCD08<input${ssrRenderAttr("value", unref(seconds))} class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3" type="number" min="0" max="59"></label></div><button class="focus-ring mt-4 min-h-12 rounded-xl bg-running px-5 font-black text-white" type="submit">\uBAA9\uD45C \uD398\uC774\uC2A4 \uACC4\uC0B0</button>`);
      if (unref(error)) {
        _push(`<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">${ssrInterpolate(unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</form>`);
      if (unref(result)) {
        _push(`<section class="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><p class="text-sm font-black text-running">${ssrInterpolate(unref(result).distanceKm)}km \xB7 \uBAA9\uD45C ${ssrInterpolate(unref(result).targetTime)}</p><h2 class="mt-2 text-4xl font-black text-ink">${ssrInterpolate(unref(result).paceText)}</h2><div class="mt-5 overflow-x-auto"><table class="w-full min-w-80 text-left text-sm"><thead class="text-slate-500"><tr><th class="py-2">\uAC70\uB9AC</th><th>\uD398\uC774\uC2A4</th><th>\uB204\uC801\uC2DC\uAC04</th></tr></thead><tbody><!--[-->`);
        ssrRenderList(unref(result).splits, (split) => {
          _push(`<tr class="border-t border-slate-100"><td class="py-3 font-bold">${ssrInterpolate(split.distanceKm)}km</td><td>${ssrInterpolate(split.paceText)}</td><td>${ssrInterpolate(split.elapsedText)}</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div></section>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/running/pace.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=pace-CQECNcI9.mjs.map
