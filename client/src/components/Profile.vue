<script setup lang="ts">
import { computed, ref } from 'vue';
import axios from 'axios';

const userId = computed(() => localStorage.getItem('userId'));
const username = computed(() => localStorage.getItem('username'));
const userImg = computed(() => localStorage.getItem('userImg'));
const userEmail = computed(() => localStorage.getItem('userEmail'));

const emit = defineEmits(['open-changepassword', 'open-changeusername', 'close-profile']);

const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userImg');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    location.reload();
};

const imageInput = ref<HTMLInputElement | null>(null);
const handleImageClick = () => {
    if (imageInput.value) {
        imageInput.value.click();
    }
}

const selectedImage = ref<string | null>(null);
const uploadImage = ref<File | null>(null);

const handleImageChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file: File | null = target.files ? target.files[0] : null;
    if (file) {
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg+xml', 'webp'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension && validExtensions.includes(fileExtension)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImage.value = e.target?.result as string;
            };
            reader.readAsDataURL(file);
            uploadImage.value = file;
        } else {
            alert('Invalid file format. Please select a valid image file.');
        }
    }
}

const handleImageSubmit = async () => {
    if (uploadImage.value) {
        const formData = new FormData();
        formData.append('userId', userId.value || '');
        formData.append('username', username.value || '');
        formData.append('image', uploadImage.value);
        try {
            const response = await axios.post('/api/updateimage', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });
            if (response.status === 200) {
                alert('Profile image updated successfully');
                localStorage.setItem('userImg', response.data.user.img);
                location.reload();
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            if ((error as any).response.status === 400) {
                alert((error as any).response.data.message);
            } else {
                alert('Profile image update failed');
                console.error('Profile image update failed:', error);
            }
        }
    }
};

</script>

<template>
    <div class="profile-container">
        <div class="card left-card">
            <div class="profile-image">
                <img :src="selectedImage || userImg || 'https://yotes-marketplace.s3.us-east-2.amazonaws.com/yotes-logo.png'" alt="Profile Image" />
            </div>
            <div class="change-image-container">
                <input type="file" class="change-image-input" id="imageFile" ref="imageInput" name="imageFile" 
                accept="image/jpg, image/jpeg, image/png, image/gif, image/bmp, image/svg+xml, image/webp" @change="handleImageChange" hidden/>
                <input type="button" class="btn change-image-btn" id="imageBtn" @click="handleImageClick" value="Upload Your Image" />
            </div>
            <button v-if="selectedImage" class="btn change-image-submit" @click="handleImageSubmit">Update Image</button>
        </div>
        <div class="card right-card">
            <div class="user-info">
                <h2>{{ username }}</h2>
                <h4><i>{{ userEmail!.endsWith('@yotes.collegeofidaho.edu') ? 'Student' : userEmail!.endsWith('@collegeofidaho.edu') ? 'Staff' : '' }}</i></h4>
                <p>{{ userEmail }}</p>
                <p>Posts: 0</p>
            </div>
            <br />
            <div class="buttons-container">
                <button class="btn change-username-btn" @click="$emit('open-changeusername', userId, username)">Change Username</button>
                <button class="btn change-password-btn" @click="$emit('open-changepassword', userId)">Change Password</button>
                <div class="buttons-end">
                    <button class="btn logout-btn" @click="handleLogout">Log Out</button>
                    <button class="btn close-btn" @click="$emit('close-profile')">Close</button>
                </div>
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
    color: white;
}
.card {
    margin: 0 20px;
}
.left-card {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}
.right-card {
    border: 2px solid #ffffff;
    border-radius: 10px;
    padding: 25px 10px;
}
.profile-image {
    padding: 0;
}
.profile-image img {
    width: 200px;
    border-radius: 50%;
    margin: 10px;
    border: 3px solid #333;
    height: 200px;
    object-fit: cover;
}
.btn {
    padding: 5px;
    margin: 3px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    transition: .2s ease-in-out;
    color: white;
}
.btn:hover {
    transition: .2s ease-in-out;
}
.user-info {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}
.buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
}
.change-image-btn {
    padding: 8px;
    margin-top: -10px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    background-color: #6e6e6e;
}
.change-image-btn:hover {
    background-color: #333;
}
.change-image-submit {
    padding: 5px;
    margin: 3px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    background-color: #007bff;
}
.change-image-submit:hover {
    background-color: #0056b3;
}
.change-username-btn, .change-password-btn {
    background-color: #7a4dc7;
}
.change-username-btn:hover, .change-password-btn:hover {
    background-color: #54348f;
}
.logout-btn {
    background-color: #ff8000;
}
.logout-btn:hover {
    background-color: #cc6600;
}
.close-btn {
    background-color: #ff0000;
}
.close-btn:hover {
    background-color: #e30000d2;
}
</style>