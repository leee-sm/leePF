import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrInterpolate } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue/server-renderer/index.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "AddressSearch",
  __ssrInlineRender: true,
  props: {
    label: {}
  },
  emits: ["select"],
  setup(__props, { emit: __emit }) {
    const inputId = `address-${Math.random().toString(36).slice(2)}`;
    const query = ref("");
    const loading = ref(false);
    const error = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<form${ssrRenderAttrs(mergeProps({ class: "rounded-2xl border border-slate-200 bg-white p-4 shadow-soft" }, _attrs))}><div class="flex flex-col gap-3 sm:flex-row sm:items-end"><div class="min-w-0 flex-1"><label class="text-sm font-black text-ink"${ssrRenderAttr("for", inputId)}>\uC8FC\uC18C \uC785\uB825</label><input${ssrRenderAttr("id", inputId)}${ssrRenderAttr("value", unref(query))} class="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base" placeholder="\uC8FC\uC18C \uC785\uB825" autocomplete="street-address"></div><button class="focus-ring min-h-12 rounded-xl bg-ink px-5 font-black text-white disabled:bg-slate-400"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} type="submit">${ssrInterpolate(unref(loading) ? "\uAC80\uC0C9 \uC911" : "\uAC80\uC0C9")}</button></div>`);
      if (unref(error)) {
        _push(`<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">${ssrInterpolate(unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</form>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AddressSearch.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=AddressSearch-CHXVukCx.mjs.map
