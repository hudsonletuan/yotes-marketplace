<script setup lang="ts">
import { computed } from 'vue';
const username = computed(() => localStorage.getItem('username'));
const userImg = computed(() => localStorage.getItem('userImg'));

const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userImg');
    location.reload();
};
</script>

<template>
    <div class="profile-container">
        <div class="card left-card">
            <div class="profile-image">
                <img :src="userImg ?? 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'" alt="profile" />
            </div>
            <div class="buttons-container">
                <button>Edit Profile</button>
                <button>Change Password</button>
                <button @click="handleLogout">Log Out</button>
                <button @click="$emit('close-profile')">Close</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.profile-container {
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}
.profile-image img {
    width: 200px;
    border-radius: 50%;
    margin: 10px;
}
</style>