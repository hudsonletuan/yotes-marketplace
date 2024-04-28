<script setup lang="ts">
import { ref } from 'vue';
import Header from '@/components/Header.vue';
import Post from './components/Post.vue';
import NewPost from './components/NewPost.vue';
import UserSign from './components/UserSign.vue';
import Profile from './components/Profile.vue';

const showNewPost = ref(false);
const showUserSign = ref(false);
const showProfile = ref(false);
</script>

<template>
  <div id="app">
    <Header @open-newpost="showNewPost = true" @open-usersign="showUserSign = true" @open-profile="showProfile = true" />
    <transition name="fade">
      <div v-if="showNewPost" class="newpost-overlay modal-container">
        <div class="newpost modal-inner">
          <NewPost @close-newpost="showNewPost = false" @post-created="showNewPost = false" />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showUserSign" class="user-sign-overlay modal-container">
        <div class="user-sign modal-inner">
          <UserSign @close-usersign="showUserSign = false" />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showProfile" class="profile-overlay modal-container">
        <div class="profile modal-inner">
          <Profile @close-profile="showProfile = false" />
        </div>
      </div>
    </transition>
    <Post />
  </div>
</template>

<style scoped>
  template {
    overflow: auto;
    scroll-behavior: smooth;
  }
  .modal-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }

  .modal-inner {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    max-width: 80%;
  }
  .user-sign {
    background-color: transparent;
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
