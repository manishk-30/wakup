import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_REQUESTED_KEY = '@wakup_review_requested';
const REVIEW_WIN_COUNT_KEY = '@wakup_alarm_win_count';

export const reviewService = {
  /**
   * Records a successful alarm challenge completion and triggers the App Store review prompt
   * at an optimal moment (e.g. after the 1st completed alarm challenge).
   */
  async recordChallengeWinAndPromptReview(): Promise<void> {
    try {
      // Increment total wins count
      const winsStr = await AsyncStorage.getItem(REVIEW_WIN_COUNT_KEY);
      const wins = (winsStr ? parseInt(winsStr, 10) : 0) + 1;
      await AsyncStorage.setItem(REVIEW_WIN_COUNT_KEY, wins.toString());

      // Check if we've already prompted
      const hasPrompted = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY);
      
      // Prompt on 1st successful morning alarm win
      if (!hasPrompted && wins >= 1) {
        if (await StoreReview.isAvailableAsync()) {
          // Delay prompt slightly so navigation back to the Home screen completes smoothly first
          setTimeout(async () => {
            try {
              await StoreReview.requestReview();
              await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, Date.now().toString());
            } catch (err) {
              console.log('[ReviewService] Error requesting review:', err);
            }
          }, 1200);
        }
      }
    } catch (e) {
      console.log('[ReviewService] Error checking/requesting review:', e);
    }
  },

  /**
   * Directly triggers the review dialog (e.g. from Settings "Rate Wakup")
   */
  async requestReviewDirect(): Promise<void> {
    try {
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
      }
    } catch (e) {
      console.log('[ReviewService] Direct review error:', e);
    }
  }
};

