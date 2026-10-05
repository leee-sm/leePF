import { defineComponent, ref, computed, watch, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs } from 'vue/server-renderer';
import { c as useRoute, b as useRuntimeConfig } from './server.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "KakaoMap",
  __ssrInlineRender: true,
  props: {
    latitude: {},
    longitude: {},
    places: {}
  },
  emits: ["select"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const mapElement = ref(null);
    let map;
    let markers = [];
    let sdkPromise = null;
    const config = useRuntimeConfig();
    const route = useRoute();
    const javascriptKey = computed(() => route.path.startsWith("/baby") ? config.public.kakaoBabyJavascriptKey : config.public.kakaoRunJavascriptKey);
    function loadSdk() {
      if (sdkPromise) return sdkPromise;
      sdkPromise = new Promise((resolve, reject) => {
        var _a;
        if (!javascriptKey.value) return reject(new Error("Kakao JavaScript \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."));
        if ((_a = (void 0).kakao) == null ? void 0 : _a.maps) {
          (void 0).kakao.maps.load(resolve);
          return;
        }
        const existing = (void 0).querySelector("script[data-kakao-map]");
        if (existing) {
          existing.addEventListener("load", () => (void 0).kakao.maps.load(resolve), { once: true });
          existing.addEventListener("error", () => reject(new Error("Kakao \uC9C0\uB3C4 SDK\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.")), { once: true });
          return;
        }
        const script = (void 0).createElement("script");
        script.dataset.kakaoMap = "true";
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(javascriptKey.value)}&autoload=false`;
        script.onload = () => {
          var _a2;
          if (!((_a2 = (void 0).kakao) == null ? void 0 : _a2.maps)) return reject(new Error("Kakao \uC9C0\uB3C4 SDK \uC751\uB2F5\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."));
          (void 0).kakao.maps.load(resolve);
        };
        script.onerror = () => reject(new Error("Kakao \uC9C0\uB3C4 SDK\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."));
        (void 0).head.appendChild(script);
      });
      return sdkPromise;
    }
    async function draw() {
      if (!mapElement.value) return;
      try {
        await loadSdk();
        const kakao = (void 0).kakao;
        const center = new kakao.maps.LatLng(props.latitude, props.longitude);
        map || (map = new kakao.maps.Map(mapElement.value, { center, level: 5 }));
        map.setCenter(center);
        markers.forEach((marker) => marker.setMap(null));
        markers = props.places.map((place) => {
          const marker = new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(place.latitude, place.longitude), title: place.name });
          kakao.maps.event.addListener(marker, "click", () => emit("select", place));
          return marker;
        });
      } catch {
        if (mapElement.value) mapElement.value.textContent = "\uC9C0\uB3C4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. Kakao JavaScript \uD0A4\uC640 \uB3C4\uBA54\uC778 \uC124\uC815\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.";
      }
    }
    watch(() => [props.latitude, props.longitude, props.places], draw, { deep: true });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        ref_key: "mapElement",
        ref: mapElement,
        class: "h-[34rem] min-h-72 w-full overflow-hidden rounded-2xl bg-slate-100",
        "aria-label": "\uAC80\uC0C9 \uACB0\uACFC \uC9C0\uB3C4"
      }, _attrs))}></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/KakaoMap.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=KakaoMap-CoCCG5vG.mjs.map
