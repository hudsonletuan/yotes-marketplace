<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { socket } from '@/socket';

const userId = localStorage.getItem('userId');

const checkActivity = () => {
    const lastActive = localStorage.getItem('lastActive');
    if (lastActive) {
        const currentTime = Date.now();
        const timeDiff = currentTime - Number(lastActive);
        const hoursInactive = timeDiff / (1000 * 60 * 60);
        if (hoursInactive >= 24) {
        localStorage.clear();
        location.reload();
        }
    }
};

const updateActivity = () => {
    // socket.emit('updateUserStatus', { userId, userStatus: 'Online' })
    localStorage.setItem('lastActive', Date.now().toString());
};

onMounted(() => {
    checkActivity();
    setInterval(checkActivity, 60000); // check every minute
    document.addEventListener('click', updateActivity);
    document.addEventListener('keydown', updateActivity);
});

onUnmounted(() => {
    document.removeEventListener('click', updateActivity);
    document.removeEventListener('keydown', updateActivity);
});
</script>
