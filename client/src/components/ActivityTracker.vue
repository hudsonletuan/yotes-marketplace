<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

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
    localStorage.setItem('lastActive', Date.now().toString());
};

onMounted(() => {
    checkActivity();
    setInterval(checkActivity, 60000); // check every minute
    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('keydown', updateActivity);
});

onUnmounted(() => {
    document.removeEventListener('mousemove', updateActivity);
    document.removeEventListener('keydown', updateActivity);
});
</script>
