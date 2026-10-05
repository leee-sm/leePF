import { defineComponent, mergeProps, useSSRContext } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrInterpolate } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/vue/server-renderer/index.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "StateBlock",
  __ssrInlineRender: true,
  props: {
    eyebrow: {},
    title: {},
    text: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "rounded-xl border border-slate-200 bg-white p-6 text-center shadow-soft" }, _attrs))}><p class="text-sm font-black uppercase tracking-wide text-slate-400">${ssrInterpolate(__props.eyebrow)}</p><h2 class="mt-2 text-xl font-black text-ink">${ssrInterpolate(__props.title)}</h2><p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">${ssrInterpolate(__props.text)}</p></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StateBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=StateBlock-zlgToguO.mjs.map
