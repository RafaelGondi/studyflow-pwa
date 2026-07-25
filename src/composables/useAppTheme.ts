import { useAkomaTheme } from '@rafael_dias/akoma'

/** StudyFlow theme — ocean app mood with persisted light/dark. */
export function useAppTheme() {
  return useAkomaTheme({
    mood: 'app',
    accent: 'ocean',
    storageKey: 'studyflow_theme',
  })
}
