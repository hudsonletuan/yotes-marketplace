<script setup lang="ts">
import { ref } from 'vue';
import Header from '@/components/Header.vue';
import Post from './components/Post.vue';
import UserSign from './components/UserSign.vue';
import OTPVerify from './components/OTPVerify.vue';
import Profile from './components/Profile.vue';
import NewPost from './components/NewPost.vue';
import EditPost from './components/EditPost.vue';
import UserPost from './components/UserPost.vue';

const showUserSign = ref(false);
const showOTPVerify = ref(false);
const showProfile = ref(false);
const showNewPost = ref(false);
const showEditPost = ref(false);
const showUserPost = ref(false);

let editPost = ref<any>({});

const handleOpenEditPost = (post: any) => {
  showEditPost.value = true;
  editPost = post;
};

let selectedUsername = ref<string | null>(null);

const handleOpenUserPost = (username: string) => {
  showUserPost.value = true;
  selectedUsername.value = username;
};

let emailSignUp = ref<string>('');
let usernameSignUp = ref<string>('');
let passwordSignUp = ref<string>('');
let password = ref<string>('');
const handleOpenOTPVerify = (data: { username: string, email: string, password: string }) => {
  showOTPVerify.value = true;
  usernameSignUp.value = data.username;
  emailSignUp.value = data.email;
  passwordSignUp.value = data.password;
};
</script>

<template>
  <div id="app">
    <Header @open-newpost="showNewPost = true" @open-usersign="showUserSign = true" @open-profile="showProfile = true" />
    <transition name="fade">
      <div v-if="showUserSign" class="user-sign-overlay modal-container">
        <div class="user-sign modal-inner">
          <UserSign @close-usersign="showUserSign = false" @open-otpverify="handleOpenOTPVerify" />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showOTPVerify" class="otp-verify-overlay modal-container">
        <div class="otp-verify modal-inner">
          <OTPVerify :username="usernameSignUp" :email="emailSignUp" :password="passwordSignUp" @close-otpverify="showOTPVerify = false" />
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
    <Post @open-editpost="handleOpenEditPost" @open-userpost="handleOpenUserPost" />
    <transition name="fade">
      <div v-if="showNewPost" class="newpost-overlay modal-container">
        <div class="newpost modal-inner">
          <NewPost @close-newpost="showNewPost = false" @post-created="showNewPost = false" />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showEditPost" class="editpost-overlay modal-container">
        <div class="editpost modal-inner">
          <EditPost :post="editPost" @close-editpost="showEditPost = false" />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showUserPost" class="userpost-overlay">
        <div class="userpost modal-inner">
          <UserPost :username="selectedUsername" @close-userpost="showUserPost = false" @open-editpost="handleOpenEditPost" />
        </div>
      </div>
    </transition>
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
.userpost-overlay{
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;

}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
