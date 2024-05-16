import { defineStore } from "pinia";

export const useUserStatusStore = defineStore({
  id: 'userStatus',
  state: () => ({
    userStatuses: {} as Record<string, { status: string, lastActive: Date }>, // Add index signature
  }),
  actions: {
    setStatus(userId: string, newStatus: string) {
      this.userStatuses[userId] = { status: newStatus, lastActive: new Date() };
    },
    setLastActive(userId: string, newDate: Date) {
      this.userStatuses[userId] = {
        ...this.userStatuses[userId],
        lastActive: newDate,
      };
    },
  },
});