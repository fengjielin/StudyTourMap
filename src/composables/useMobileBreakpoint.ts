/** 与样式断点一致：max-width: 768px */
export function useMobileBreakpoint(breakpointPx = 768) {
  const isMobile = ref(false);
  let mq: MediaQueryList | null = null;

  const sync = () => {
    isMobile.value = mq?.matches ?? false;
  };

  onMounted(() => {
    mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    sync();
    mq.addEventListener('change', sync);
  });

  onUnmounted(() => {
    mq?.removeEventListener('change', sync);
    mq = null;
  });

  if (typeof window !== 'undefined') {
    isMobile.value = window.matchMedia(`(max-width: ${breakpointPx}px)`).matches;
  }

  return { isMobile };
}
