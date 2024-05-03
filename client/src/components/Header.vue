<script setup lang="ts">
import { ref, computed } from 'vue';

const emit = defineEmits(['open-newpost', 'open-searchpost', 'open-usersign', 'open-profile']);

const username = computed(() => localStorage.getItem('username'));
const userImg = computed(() => localStorage.getItem('userImg'));

const handleProfileClick = () => {
    if (username.value) {
        emit('open-profile');
    } else {
        emit('open-usersign');
    }
};

const handleLogoClick = () => {
    location.reload();
};

const searchInputValue = ref('');
const handleSearch = () => {
    if (searchInputValue.value) {
        emit('open-searchpost', searchInputValue.value);
    }
};

const isGridView = ref(false);
</script>

<template>
    <div class="header">
        <div class="logo">
            <img src="../assets/branding.png" alt="Yotes Marketplace" @click="handleLogoClick" />
        </div>
        <div class="new-post">
            <button @click="$emit('open-newpost')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-square" viewBox="0 0 16 16">
                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                </svg>
                New Post
            </button>
        </div>
        <div class="grid-view" v-if="!isGridView">
            <button @click="isGridView = true">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grid" viewBox="0 0 16 16">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
                </svg>
                View As Grid
            </button>
        </div>
        <div class="list-view" v-if="isGridView">
            <button @click="isGridView = false">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-view-list" viewBox="0 0 16 16">
                    <path d="M3 4.5h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zM1 2a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 2m0 12a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 14"/>
                </svg>
                View As List
            </button>
        </div>
        <div class="search-bar">
            <input type="search" placeholder="Search ..." id="searchInput" v-model="searchInputValue" @keyup.enter="handleSearch">
            <svg @click="handleSearch" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                <path fill="currentColor" d="m226.83 221.17l-52.7-52.7a84.1 84.1 0 1 0-5.66 5.66l52.7 52.7a4 4 0 0 0 5.66-5.66M36 112a76 76 0 1 1 76 76a76.08 76.08 0 0 1-76-76" />
            </svg>
        </div>
        <div class="profile" @click="handleProfileClick">
            <img :src="userImg ?? 'https://yotes-marketplace.s3.us-east-2.amazonaws.com/yotes-logo.png'" alt="profile" />
            <h3>{{ username ? username : 'Login/Sign Up' }}</h3>
        </div>
    </div>
</template>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #333;
    color: white;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    font-size: 16px;
}
button {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 10px;
    border: solid 1px white;
    background-color: transparent;
    color: white;
    padding: 10px;
    border-radius: 10px;
    transition: .2s ease-in-out;
    font-weight: bold;
    font-size: 16px;
}
button:hover {
    background-color: #f0f0f0;
    color: black;
    transition: .2s ease-in-out;
    cursor: pointer;
}
.logo{
    padding: 0;
    margin: -10px 0 -18px 0;
}
.logo img {
    height: 60px;
    padding: 0;
    margin: 0;
}
.logo img:hover {
    cursor: pointer;
}
.search-bar {
    width: 5%;
    height: 40px;
    background-color: #fff5;
    padding: 0 .8rem;
    border-radius: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: .2s;
}

.search-bar:hover {
    width: 20%;
    background-color: #fff8;
    box-shadow: 0 .1rem .4rem #0002;
}

.search-bar svg {
    background-color: transparent;
    color: #212529;
    width: 2.5em;
    height: 2.5em;
    margin-left: 10px;
    cursor: pointer;
}

.search-bar input {
    color: black;
    width: calc(100% - 40px);
    height: 100%;
    padding: 0 .5rem .1rem .3rem;
    background-color: transparent;
    border: none;
    outline: none;
    flex: 1;
}
.profile {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 10px;
    border: solid 1px white;
    padding: 5px 10px;
    border-radius: 10px;
    transition: .2s ease-in-out;
}
.profile img {
    width: 30px;
    height: 30px;
    object-fit: cover;
    border-radius: 50%;
}
.profile:hover {
    background-color: #f0f0f0;
    color: black;
    transition: .2s ease-in-out;
    cursor: pointer;
}
</style>