import { useAkomaTheme } from '@rafael_dias/akoma'

/** StudyFlow theme — slate app mood with persisted light/dark. */
export function useAppTheme() {
  return useAkomaTheme({
    mood: 'app',
    accent: 'slate',
    storageKey: 'studyflow_theme',
  })
}
