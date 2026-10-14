/** Native pull-to-refresh; retained name for existing screen imports. */
export function useHoldToRefresh(onRefresh: () => void) {
  return { refreshControlProps: { onRefresh }, scrollProps: {} };
}
