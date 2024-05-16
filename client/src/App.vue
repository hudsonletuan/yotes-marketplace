<script setup lang="ts">
import { computed, ref } from 'vue';
import Header from '@/components/Header.vue';
import Post from './components/Post.vue';
import UserSign from './components/UserSign.vue';
import OTPRecover from './components/OTPRecover.vue';
import OTPVerify from './components/OTPVerify.vue';
import ActivityTracker from './components/ActivityTracker.vue';
import SearchPost from './components/SearchPost.vue';
import Profile from './components/Profile.vue';
import ChangeUsername from './components/ChangeUsername.vue';
import ChangePassword from './components/ChangePassword.vue';
import NewPost from './components/NewPost.vue';
import EditPost from './components/EditPost.vue';
import MediaPreview from './components/MediaPreview.vue';
import Report from './components/Report.vue';

const userId = computed(() => localStorage.getItem('userId'));

const showUserSign = ref(false);
const showOTPRecover = ref(false);
const showOTPVerify = ref(false);
const showSearchPost = ref(false);
const showProfile = ref(false);
const showChangeUsername = ref(false);
const showChangePassword = ref(false);
const showNewPost = ref(false);
const showEditPost = ref(false);
const showMediaPreview = ref(false);
const showReport = ref(false);

let media = ref<any>({});
const handleOpenMedia = (mediaData: any) => {
  media = mediaData;
  showMediaPreview.value = true;
};

let reportPostId = ref<string>('');
const handleShowReport = (postId: string) => {
  reportPostId.value = postId;
  showReport.value = true;
};

let editPost = ref<any>({});

const handleOpenEditPost = (post: any) => {
  showEditPost.value = true;
  editPost = post;
};

let profileUserId = ref<string | null>(null);
let profileUsername = ref<string | null>(null);
const handleOpenChangeUsername = (userId: string, username: string) => {
  showChangeUsername.value = true;
  profileUserId.value = userId;
  profileUsername.value = username;
};
const handleOpenChangePassword = (userId: string) => {
  showChangePassword.value = true;
  profileUserId.value = userId;
};

let searchInputValueSet = ref<string>('');
const handleSearch = (searchInputValue: string) => {
  searchInputValueSet.value = searchInputValue;
  if (searchInputValueSet.value) {
    showSearchPost.value = true;
  }
};
const handleCloseSearch = () => {
  showSearchPost.value = false;
  searchInputValueSet.value = '';
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

const appConfig = {
  components: {
    ActivityTracker,
  },
};
</script>

<template>
  <div id="app">
    <Header :searchInputValueReset="searchInputValueSet" class="header-section" @open-newpost="showNewPost = true" @open-searchpost="handleSearch" @open-usersign="showUserSign = true" @open-profile="showProfile = true" />
    <transition name="fade">
      <div v-if="showUserSign" class="user-sign-overlay modal-container">
        <div class="user-sign modal-inner">
          <UserSign @close-usersign="showUserSign = false" @open-otpverify="handleOpenOTPVerify" @open-otprecover="showOTPRecover = true" />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showSearchPost" class="search-post-overlay modal-container">
        <div class="search-post modal-inner">
          <SearchPost :searchInputValue="searchInputValueSet" @close-searchpost="handleCloseSearch" @open-editpost="handleOpenEditPost" @open-userpost="handleSearch" @open-media="handleOpenMedia" @open-report="handleShowReport" />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showOTPRecover" class="otp-recover-overlay modal-container">
        <div class="otp-recover modal-inner">
          <OTPRecover @close-otprecover="showOTPRecover = false" />
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
          <Profile @close-profile="showProfile = false" @open-changeusername="handleOpenChangeUsername" @open-changepassword="handleOpenChangePassword" />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showChangeUsername" class="changeusername-overlay modal-container">
        <div class="changeusername modal-inner">
          <ChangeUsername :userId="profileUserId || ''" :username="profileUsername || ''" @close-changeusername="showChangeUsername = false" />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showChangePassword" class="changepassword-overlay modal-container">
        <div class="changepassword modal-inner">
          <ChangePassword :userId="profileUserId || ''" @close-changepassword="showChangePassword = false" />
        </div>
      </div>
    </transition>
    <Post @open-editpost="handleOpenEditPost" @open-userpost="handleSearch" @open-media="handleOpenMedia" @open-report="handleShowReport" />
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
      <div v-if="showMediaPreview" class="mediapreview-overlay modal-container">
        <div class="media-preview modal-inner">
          <MediaPreview :mediaSrc="media" @close-mediapreview="showMediaPreview = false" />
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showReport" class="report-overlay modal-container">
        <div class="report-inner modal-inner">
          <Report @close-report="showReport = false" :postIdReport = "reportPostId" />
        </div>
      </div>
    </transition>
  </div>
  <ActivityTracker />
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
  max-width: 800px;
}
.report-inner {
  background-color: #212529;
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  min-width: 800px;
}
.header-section {
  z-index: 100;
}
.video-compress {
  z-index: 101;
}
.search-post, .user-sign, .userpost {
  background-color: transparent
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
  z-index: 110;
}
.postchat-overlay {
  /* position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center; */
  z-index: 100;
}
.media-preview {
  max-width: 650px;
}
.profile, .changepassword, .changeusername {
  background-color: #212529;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
